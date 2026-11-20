-- ==========================================
-- 1. PRODUCTS TABLE
-- ==========================================

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    sku text not null,
    name text not null,
    category text not null,
    filter_category text not null default 'Handles & Shafts'
        check (
            filter_category in (
                'Handles & Shafts',
                'Dissectors',
                'Scissors',
                'Graspers'
            )
        ),
    description text not null,
    image text,
    image_alt text not null default '',
    original_price numeric,
    offer_price numeric,
    featured boolean not null default false,
    published boolean not null default false,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add missing columns safely

alter table public.products
    add column if not exists id uuid default gen_random_uuid(),
    add column if not exists sku text not null default '',
    add column if not exists name text not null default '',
    add column if not exists category text not null default '',
    add column if not exists filter_category text not null default 'Handles & Shafts',
    add column if not exists description text not null default '',
    add column if not exists image text,
    add column if not exists image_alt text not null default '',
    add column if not exists original_price numeric,
    add column if not exists offer_price numeric,
    add column if not exists featured boolean not null default false,
    add column if not exists published boolean not null default false,
    add column if not exists sort_order integer not null default 0,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

update public.products
set id = gen_random_uuid()
where id is null;

alter table public.products
    alter column id set default gen_random_uuid(),
    alter column id set not null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.products'::regclass
        and contype = 'p'
    ) then
        alter table public.products
        add constraint products_pkey primary key (id);
    end if;
end;
$$;

create unique index if not exists products_id_unique_idx
    on public.products (id);


-- ==========================================
-- 2. CATEGORIES TABLE
-- ==========================================

create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    slug text not null unique,
    description text not null default '',
    image text,
    active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.categories
    add column if not exists name text not null default '',
    add column if not exists slug text not null default '',
    add column if not exists description text not null default '',
    add column if not exists image text,
    add column if not exists active boolean not null default true,
    add column if not exists sort_order integer not null default 0,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now();

create unique index if not exists categories_name_unique_idx
    on public.categories (name);

create unique index if not exists categories_slug_unique_idx
    on public.categories (slug);


-- ==========================================
-- 3. ADMIN USERS TABLE
-- ==========================================

create table if not exists public.admin_users (
    user_id uuid primary key
        references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.admin_users enable row level security;


-- ==========================================
-- 4. ADMIN VERIFICATION FUNCTION
-- ==========================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.admin_users
        where user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- ==========================================
-- 5. ADMIN USERS POLICIES
-- ==========================================

drop policy if exists "Admins can read their admin record"
on public.admin_users;

create policy "Admins can read their admin record"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

grant select on public.admin_users to authenticated;

revoke insert, update, delete
on public.admin_users
from anon, authenticated;


-- ==========================================
-- 6. PRODUCTS POLICIES
-- ==========================================

drop policy if exists "Public can read published products"
on public.products;

create policy "Public can read published products"
on public.products
for select
to anon, authenticated
using (published = true);

drop policy if exists "Admins can manage products"
on public.products;

create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;

grant insert, update, delete
on public.products to authenticated;


-- ==========================================
-- 7. CATEGORIES POLICIES
-- ==========================================

drop policy if exists "Public can read active categories"
on public.categories;

create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (active = true);

drop policy if exists "Admins can manage categories"
on public.categories;

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.categories to anon, authenticated;

grant insert, update, delete
on public.categories to authenticated;


-- ==========================================
-- 8. PRODUCT IMAGES STORAGE
-- ==========================================

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id)
do update set public = excluded.public;


drop policy if exists "Public can read product images"
on storage.objects;

create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');


drop policy if exists "Admins can upload product images"
on storage.objects;

create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'product-images'
    and public.is_admin()
);


drop policy if exists "Admins can update product images"
on storage.objects;

create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'product-images'
    and public.is_admin()
)
with check (
    bucket_id = 'product-images'
    and public.is_admin()
);


drop policy if exists "Admins can delete product images"
on storage.objects;

create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'product-images'
    and public.is_admin()
);


-- ==========================================
-- 9. INDEXES
-- ==========================================

create index if not exists products_published_sort_idx
on public.products (published, sort_order);

create index if not exists categories_active_sort_idx
on public.categories (active, sort_order);


-- ==========================================
-- 10. SUPABASE REALTIME
-- ==========================================

do $$
begin
    if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'products'
    ) then
        alter publication supabase_realtime
        add table public.products;
    end if;
end;
$$;


-- ==========================================
-- 11. REFRESH SCHEMA CACHE
-- ==========================================
