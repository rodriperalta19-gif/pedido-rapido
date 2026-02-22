-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- RESTAURANTS TABLE
create table if not exists restaurants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  address text,
  phone text,
  opening_hours text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- PROFILES TABLE (User metadata and roles)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  restaurant_id uuid references restaurants(id),
  full_name text,
  email text,
  role text default 'customer', -- owner, waiter, cook, superadmin
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- CATEGORIES TABLE (Updated with restaurant_id)
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id),
  name text not null,
  sort_order int default 0
);

-- PRODUCTS TABLE (Updated with restaurant_id)
create table if not exists products (
  id text default uuid_generate_v4()::text primary key,
  restaurant_id uuid references restaurants(id),
  category_id uuid references categories(id),
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_available boolean default true,
  category text
);

-- TABLES TABLE
create table if not exists tables (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id),
  number text not null,
  status text default 'libre', -- libre, ocupada, reservada
  capacity int default 2,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ORDERS TABLE (Updated with restaurant_id)
create table if not exists orders (
  id uuid default uuid_generate_v4() primary key,
  restaurant_id uuid references restaurants(id),
  table_id text not null, -- This could be updated to reference tables.id if wanted, but keeping as text for flexibility for now
  status text default 'pendiente',
  total numeric not null,
  bill_requested boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ORDER ITEMS TABLE
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id),
  product_id text references products(id), -- Changed to text
  quantity int not null,
  price numeric not null, -- Price at time of order
  notes text,
  product_name text -- Snapshot of name in case it changes
);

-- SEED DATA (Categorías) - Only insert if empty
insert into categories (name, sort_order) 
select 'Entradas', 1 where not exists (select 1 from categories where name = 'Entradas');
insert into categories (name, sort_order) 
select 'Platos Principales', 2 where not exists (select 1 from categories where name = 'Platos Principales');
insert into categories (name, sort_order) 
select 'Bebidas', 3 where not exists (select 1 from categories where name = 'Bebidas');
insert into categories (name, sort_order) 
select 'Postres', 4 where not exists (select 1 from categories where name = 'Postres');

-- RLS POLICIES (Seguridad Básica)
-- Permitir lectura pública de productos y categorías
alter table categories enable row level security;
create policy "Public categories are viewable by everyone" on categories for select using (true);

alter table products enable row level security;
create policy "Public products are viewable by everyone" on products for select using (true);

alter table orders enable row level security;
create policy "Orders are viewable by everyone" on orders for select using (true);
create policy "Orders can be created by everyone" on orders for insert with check (true);
create policy "Orders can be updated by everyone" on orders for update using (true);

alter table order_items enable row level security;
create policy "Order items are viewable by everyone" on order_items for select using (true);
create policy "Order items can be created by everyone" on order_items for insert with check (true);
-- STORAGE BUCKET FOR IMAGES
-- Nota: La creación de buckets a veces es mejor hacerla desde el panel de Supabase,
-- pero aquí están los comandos para configurar las políticas si el bucket se llama 'product-images'.

-- 1. Crear el bucket (esto a veces requiere permisos de superusuario en SQL Editor, si no funciona hazlo manual)
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
-- on conflict (id) do nothing;

-- 2. Políticas de Storage
-- Permitir que cualquiera vea las imágenes
create policy "Images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'product-images' );
-- Políticas para PROFILES
alter table profiles enable row level security;

create policy "Profiles are viewable by owner or self"
  on profiles for select
  using (
    auth.uid() = id OR 
    exists (
      select 1 from profiles p 
      where p.id = auth.uid() 
      and p.role = 'owner' 
      and p.restaurant_id = profiles.restaurant_id
    )
  );

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Permitir subir imágenes (puedes restringirlo a usuarios autenticados después)
create policy "Anyone can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'product-images' );

-- Permitir borrar imágenes
create policy "Anyone can delete images"
  on storage.objects for delete
  using ( bucket_id = 'product-images' );
