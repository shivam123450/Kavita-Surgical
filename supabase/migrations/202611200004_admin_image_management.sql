begin;

-- Reuse the existing product-images bucket and image tables. Keep durable
-- object paths in the database; the client creates short-lived URLs on demand.
alter table public.categories
  add column if not exists image_storage_path text,
  add column if not exists image_alt text not null default '',
  add column if not exists image_published boolean not null default true;

alter table public.homepage_settings
  add column if not exists hero_image_storage_path text,
  add column if not exists hero_image_alt text not null default '',
  add column if not exists hero_image_published boolean not null default true;

alter table public.product_images
  add column if not exists storage_path text not null default '',
  add column if not exists is_published boolean not null default true;

alter table public.product_images
  alter column is_published set default false;

-- Convert legacy public URLs only when the referenced object exists. URLs
-- that cannot be verified remain intact for recovery or later migration.
with image_paths as (
  select
    image.id,
    split_part(
      substring(image.url from '/storage/v1/object/public/product-images/(.+)$'),
      '?',
      1
    ) as storage_path
  from public.product_images as image
  where coalesce(image.storage_path, '') = ''
    and image.url ~ '/storage/v1/object/public/product-images/.+'
)
update public.product_images as image
set storage_path = image_paths.storage_path
from image_paths
where image.id = image_paths.id
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = image_paths.storage_path
  );

insert into public.product_images (
  product_id,
  url,
  storage_path,
  alt_text,
  sort_order,
  is_primary,
  is_published
)
select
  product.id,
  '',
  image_path.storage_path,
  coalesce(product.image_alt, ''),
  0,
  true,
  true
from public.products as product
cross join lateral (
  select split_part(
    substring(product.image from '/storage/v1/object/public/product-images/(.+)$'),
    '?',
    1
  ) as storage_path
) as image_path
where product.image ~ '/storage/v1/object/public/product-images/.+'
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = image_path.storage_path
  )
  and not exists (
    select 1
    from public.product_images as image
    where image.product_id = product.id
      and image.is_primary
  );

update public.categories as category
set image_storage_path = split_part(
  substring(category.image from '/storage/v1/object/public/product-images/(.+)$'),
  '?',
  1
)
where coalesce(category.image_storage_path, '') = ''
  and category.image ~ '/storage/v1/object/public/product-images/.+'
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = split_part(
        substring(category.image from '/storage/v1/object/public/product-images/(.+)$'),
        '?',
        1
      )
  );

update public.homepage_settings as settings
set hero_image_storage_path = split_part(
  substring(settings.hero_image from '/storage/v1/object/public/product-images/(.+)$'),
  '?',
  1
)
where coalesce(settings.hero_image_storage_path, '') = ''
  and settings.hero_image ~ '/storage/v1/object/public/product-images/.+'
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = split_part(
        substring(settings.hero_image from '/storage/v1/object/public/product-images/(.+)$'),
        '?',
        1
      )
  );

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images
for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.products as product
    where product.id = product_id
      and product.published = true
  )
);

-- Retire only legacy URLs whose exact replacement object has been verified.
update public.product_images as image
set url = ''
where image.url ~ '/storage/v1/object/public/product-images/.+'
  and image.storage_path = split_part(
    substring(image.url from '/storage/v1/object/public/product-images/(.+)$'),
    '?',
    1
  )
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = image.storage_path
  );

update public.products as product
set image = null
where product.image ~ '/storage/v1/object/public/product-images/.+'
  and exists (
    select 1
    from public.product_images as image
    where image.product_id = product.id
      and image.is_primary
      and image.storage_path = split_part(
        substring(product.image from '/storage/v1/object/public/product-images/(.+)$'),
        '?',
        1
      )
      and exists (
        select 1
        from storage.objects as storage_object
        where storage_object.bucket_id = 'product-images'
          and storage_object.name = image.storage_path
      )
  );

update public.categories as category
set image = null
where category.image ~ '/storage/v1/object/public/product-images/.+'
  and category.image_storage_path = split_part(
    substring(category.image from '/storage/v1/object/public/product-images/(.+)$'),
    '?',
    1
  )
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = category.image_storage_path
  );

update public.homepage_settings as settings
set hero_image = null
where settings.hero_image ~ '/storage/v1/object/public/product-images/.+'
  and settings.hero_image_storage_path = split_part(
    substring(settings.hero_image from '/storage/v1/object/public/product-images/(.+)$'),
    '?',
    1
  )
  and exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id = 'product-images'
      and storage_object.name = settings.hero_image_storage_path
  );

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique
    check (section_key in ('about-visual', 'promotional-banner', 'site-icon')),
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_images enable row level security;

drop policy if exists "Public can read published site images" on public.site_images;
create policy "Public can read published site images"
on public.site_images
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can manage site images" on public.site_images;
create policy "Admins can manage site images"
on public.site_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select on public.site_images to anon, authenticated;
grant insert, update, delete on public.site_images to authenticated;

drop trigger if exists set_site_images_updated_at on public.site_images;
create trigger set_site_images_updated_at
before update on public.site_images
for each row execute function public.set_updated_at();

-- The public bucket bypasses Storage RLS. Make the existing bucket private so
-- public clients can sign only objects attached to published website content.
update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';

drop policy if exists "Public can read product images" on storage.objects;
drop policy if exists "Public can read published website images" on storage.objects;
create policy "Public can read published website images"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-images'
  and (
    exists (
      select 1
      from public.product_images as image
      join public.products as product on product.id = image.product_id
      where image.storage_path = storage.objects.name
        and image.storage_path <> ''
        and image.is_published = true
        and product.published = true
    )
    or exists (
      select 1
      from public.categories as category
      where category.image_storage_path = storage.objects.name
        and category.image_published = true
        and category.published = true
    )
    or exists (
      select 1
      from public.homepage_settings as settings
      where settings.hero_image_storage_path = storage.objects.name
        and settings.hero_image_published = true
    )
    or exists (
      select 1
      from public.site_images as image
      where image.storage_path = storage.objects.name
        and image.is_published = true
    )
  )
);

drop policy if exists "Admins can read website images" on storage.objects;
create policy "Admins can read website images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and public.is_admin()
);

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.is_admin()
  and (storage.foldername(name))[1] in (
    'products',
    'categories',
    'homepage',
    'site'
  )
);

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'site_images'
  ) then
    alter publication supabase_realtime add table public.site_images;
  end if;
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'product_images'
  ) then
    alter publication supabase_realtime add table public.product_images;
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
