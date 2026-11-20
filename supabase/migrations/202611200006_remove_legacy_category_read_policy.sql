begin;

-- PostgreSQL combines permissive policies with OR. Remove the legacy policy
-- so unpublished categories cannot remain visible through active = true.
drop policy if exists "Public can read active categories"
  on public.categories;

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'categories'
    ) then
      alter publication supabase_realtime add table public.categories;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'homepage_settings'
    ) then
      alter publication supabase_realtime add table public.homepage_settings;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'business_settings'
    ) then
      alter publication supabase_realtime add table public.business_settings;
    end if;
  end if;
end
$$;

notify pgrst, 'reload schema';

commit;
