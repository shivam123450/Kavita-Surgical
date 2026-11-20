begin;

alter table public.products
  add column if not exists featured_order integer not null default 0,
  add column if not exists gst_rate numeric;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_featured_order_nonnegative'
  ) then
    alter table public.products
      add constraint products_featured_order_nonnegative
      check (featured_order >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_gst_rate_range'
  ) then
    alter table public.products
      add constraint products_gst_rate_range
      check (gst_rate is null or (gst_rate >= 0 and gst_rate <= 100));
  end if;
end
$$;

with ranked_featured_products as (
  select
    id,
    row_number() over (order by sort_order, name, id)::integer - 1 as display_order
  from public.products
  where featured = true
)
update public.products as product
set featured_order = ranked.display_order
from ranked_featured_products as ranked
where ranked.id = product.id;

alter table public.homepage_settings
  add column if not exists featured_product_limit integer not null default 3;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.homepage_settings'::regclass
      and conname = 'homepage_featured_product_limit_nonnegative'
  ) then
    alter table public.homepage_settings
      add constraint homepage_featured_product_limit_nonnegative
      check (featured_product_limit >= 0);
  end if;
end
$$;

create index if not exists products_featured_order_idx
  on public.products (featured_order, sort_order)
  where featured = true and published = true;

notify pgrst, 'reload schema';

commit;
