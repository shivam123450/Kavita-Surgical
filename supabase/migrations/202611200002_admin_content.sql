create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists name text,
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists image text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists published boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.categories
set id = gen_random_uuid()
where id is null;

update public.categories
set name = 'Category ' || id::text
where name is null or btrim(name) = '';

update public.categories
set slug = 'category-' || id::text
where slug is null or btrim(slug) = '';

alter table public.categories
  alter column id set default gen_random_uuid(),
  alter column id set not null,
  alter column name set not null,
  alter column slug set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.categories'::regclass
      and contype = 'p'
  ) then
    alter table public.categories
      add constraint categories_pkey primary key (id);
  end if;
end
$$;

create unique index if not exists categories_id_unique_idx
  on public.categories (id);
create unique index if not exists categories_name_case_insensitive_unique_idx
  on public.categories (lower(btrim(name)));
create unique index if not exists categories_slug_case_insensitive_unique_idx
  on public.categories (lower(btrim(slug)));
create index if not exists categories_published_sort_idx
  on public.categories (published, sort_order);

insert into public.categories (name, slug, sort_order, published)
values
  ('Laparoscopic Instruments', 'laparoscopic-instruments', 1, true),
  ('Instrument Tips', 'instrument-tips', 2, true),
  ('Handles & Shafts', 'handles-shafts', 3, true),
  ('Dissectors', 'dissectors', 4, true),
  ('Scissors', 'scissors', 5, true),
  ('Graspers', 'graspers', 6, true)
on conflict do nothing;

alter table public.categories enable row level security;

drop policy if exists "Public can read published categories" on public.categories;
create policy "Public can read published categories"
on public.categories for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant usage on schema public to anon, authenticated;

alter table public.products
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists specifications jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_category_id_fkey'
  ) then
    alter table public.products
      add constraint products_category_id_fkey
      foreign key (category_id)
      references public.categories(id)
      on delete set null;
  end if;
end
$$;

update public.products as product
set category_id = category.id
from public.categories as category
where product.category_id is null
  and lower(btrim(product.category)) = lower(btrim(category.name));

create index if not exists products_category_id_idx
  on public.products (category_id);
create index if not exists products_published_sort_idx
  on public.products (published, sort_order);

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

create index if not exists product_images_product_sort_idx
  on public.product_images (product_id, sort_order);

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.published = true
  )
);

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
on public.product_images for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;

create table if not exists public.product_specifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null,
  value text not null,
  sort_order integer not null default 0
);

alter table public.product_specifications enable row level security;

create index if not exists product_specifications_product_sort_idx
  on public.product_specifications (product_id, sort_order);

drop policy if exists "Public can read published product specifications" on public.product_specifications;
create policy "Public can read published product specifications"
on public.product_specifications for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and p.published = true
  )
);

drop policy if exists "Admins can manage product specifications" on public.product_specifications;
create policy "Admins can manage product specifications"
on public.product_specifications for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.product_specifications to anon, authenticated;
grant insert, update, delete on public.product_specifications to authenticated;

create table if not exists public.homepage_settings (
  id text primary key,
  hero_title text,
  hero_subtitle text,
  hero_image text,
  featured_product_ids uuid[] not null default '{}'::uuid[],
  updated_at timestamptz not null default now()
);

alter table public.homepage_settings enable row level security;

drop policy if exists "Public can read homepage settings" on public.homepage_settings;
create policy "Public can read homepage settings"
on public.homepage_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage homepage settings" on public.homepage_settings;
create policy "Admins can manage homepage settings"
on public.homepage_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.homepage_settings to anon, authenticated;
grant insert, update, delete on public.homepage_settings to authenticated;

create table if not exists public.business_settings (
  id text primary key,
  name text,
  gstin text,
  phone text,
  whatsapp text,
  email text,
  address text,
  instagram text,
  facebook text,
  linkedin text,
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;

drop policy if exists "Public can read business settings" on public.business_settings;
create policy "Public can read business settings"
on public.business_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage business settings" on public.business_settings;
create policy "Admins can manage business settings"
on public.business_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.business_settings to anon, authenticated;
grant insert, update, delete on public.business_settings to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

notify pgrst, 'reload schema';
