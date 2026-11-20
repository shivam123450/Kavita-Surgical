begin;

create table if not exists public.filter_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint filter_categories_name_not_blank check (btrim(name) <> ''),
  constraint filter_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint filter_categories_sort_order_nonnegative check (sort_order >= 0)
);

create unique index if not exists filter_categories_name_ci_uidx
  on public.filter_categories (lower(btrim(name)));
create unique index if not exists filter_categories_slug_ci_uidx
  on public.filter_categories (lower(btrim(slug)));
create index if not exists filter_categories_published_sort_idx
  on public.filter_categories (is_published, sort_order, name);

-- Preserve every legacy product assignment, merging names that differ only by case or whitespace.
with normalized_categories as (
  select
    lower(btrim(filter_category)) as normalized_name,
    min(btrim(filter_category)) as name
  from public.products
  where nullif(btrim(filter_category), '') is not null
  group by lower(btrim(filter_category))
),
base_slugs as (
  select
    normalized_name,
    name,
    coalesce(
      nullif(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''),
      'filter-category'
    ) as base_slug
  from normalized_categories
),
resolved_slugs as (
  select
    normalized_name,
    name,
    base_slug || case
      when count(*) over (partition by base_slug) > 1
        then '-' || substr(md5(normalized_name), 1, 8)
      else ''
    end as slug
  from base_slugs
)
insert into public.filter_categories (name, slug, sort_order, is_published)
select name, slug, row_number() over (order by normalized_name)::integer - 1, true
from resolved_slugs
on conflict do nothing;

alter table public.products
  add column if not exists filter_category_id uuid;

update public.products as product
set filter_category_id = category.id
from public.filter_categories as category
where product.filter_category_id is null
  and nullif(btrim(product.filter_category), '') is not null
  and lower(btrim(product.filter_category)) = lower(btrim(category.name));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_filter_category_id_fkey'
  ) then
    alter table public.products
      add constraint products_filter_category_id_fkey
      foreign key (filter_category_id)
      references public.filter_categories(id)
      on delete restrict;
  end if;
end
$$;

create index if not exists products_filter_category_id_idx
  on public.products (filter_category_id);

-- The text field remains nullable for staged client rollout; the FK is authoritative.
alter table public.products
  alter column filter_category drop default,
  alter column filter_category drop not null;

do $$
declare
  check_constraint record;
begin
  for check_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%filter_category%'
  loop
    execute format(
      'alter table public.products drop constraint %I',
      check_constraint.conname
    );
  end loop;
end
$$;

create or replace function public.sync_product_filter_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  matched_category_id uuid;
  category_name text;
  category_is_published boolean;
begin
  if tg_op = 'INSERT' then
    if new.filter_category_id is null and new.filter_category is not null then
      select id, name, is_published
      into matched_category_id, category_name, category_is_published
      from public.filter_categories
      where lower(btrim(name)) = lower(btrim(new.filter_category));

      if not found then
        raise exception 'Choose a filter category managed in the Admin Portal.'
          using errcode = '23514';
      end if;
      if not category_is_published then
        raise exception 'Products can only be assigned to published filter categories.'
          using errcode = '23514';
      end if;

      new.filter_category_id := matched_category_id;
    end if;
  elsif new.filter_category_id is not distinct from old.filter_category_id
    and new.filter_category is distinct from old.filter_category
  then
    new.filter_category_id := null;

    if new.filter_category is not null then
      select id, name, is_published
      into matched_category_id, category_name, category_is_published
      from public.filter_categories
      where lower(btrim(name)) = lower(btrim(new.filter_category));

      if not found then
        raise exception 'Choose a filter category managed in the Admin Portal.'
          using errcode = '23514';
      end if;
      if not category_is_published
        and matched_category_id is distinct from old.filter_category_id
      then
        raise exception 'Products can only be assigned to published filter categories.'
          using errcode = '23514';
      end if;

      new.filter_category_id := matched_category_id;
    end if;
  end if;

  if new.filter_category_id is null then
    new.filter_category := null;
    return new;
  end if;

  select name, is_published
  into category_name, category_is_published
  from public.filter_categories
  where id = new.filter_category_id;

  if not found then
    raise exception 'The selected filter category does not exist.'
      using errcode = '23503';
  end if;
  if not category_is_published then
    if tg_op = 'INSERT' then
      raise exception 'Products can only be assigned to published filter categories.'
        using errcode = '23514';
    elsif new.filter_category_id is distinct from old.filter_category_id then
      raise exception 'Products can only be assigned to published filter categories.'
        using errcode = '23514';
    end if;
  end if;

  new.filter_category := category_name;
  return new;
end;
$$;

drop trigger if exists sync_product_filter_category on public.products;
create trigger sync_product_filter_category
before insert or update of filter_category_id, filter_category
on public.products
for each row execute function public.sync_product_filter_category();

create or replace function public.sync_renamed_filter_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.name is distinct from old.name then
    update public.products
    set filter_category = new.name
    where filter_category_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_renamed_filter_category on public.filter_categories;
create trigger sync_renamed_filter_category
after update of name on public.filter_categories
for each row execute function public.sync_renamed_filter_category();

drop trigger if exists set_filter_categories_updated_at on public.filter_categories;
create trigger set_filter_categories_updated_at
before update on public.filter_categories
for each row execute function public.set_updated_at();

alter table public.filter_categories enable row level security;

drop policy if exists "Public can read published filter categories"
  on public.filter_categories;
create policy "Public can read published filter categories"
on public.filter_categories
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can manage filter categories"
  on public.filter_categories;
create policy "Admins can manage filter categories"
on public.filter_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.filter_categories to anon, authenticated;
grant insert, update, delete on public.filter_categories to authenticated;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'filter_categories'
  ) then
    alter publication supabase_realtime add table public.filter_categories;
  end if;
end
$$;

comment on column public.products.filter_category_id is
  'Canonical filter category assignment. The filter_category text column is retained only for staged client compatibility.';

notify pgrst, 'reload schema';

commit;
