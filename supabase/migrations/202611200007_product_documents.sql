-- Documents are private objects; a published record on a published product
-- authorizes a short-lived signed download, just like managed images.
create table public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  kind text not null check (kind in ('document', 'license')),
  storage_path text not null unique,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  check (storage_path ~ ('^' || product_id::text || '/[0-9a-f-]+\.pdf$'))
);

create index product_documents_product_id_idx on public.product_documents(product_id);
alter table public.product_documents enable row level security;
grant select on public.product_documents to anon, authenticated;
grant insert, update, delete on public.product_documents to authenticated;

create policy "Public can read published product documents"
on public.product_documents for select to anon, authenticated
using (
  is_published and exists (
    select 1 from public.products
    where products.id = product_documents.product_id and products.published
  )
);

create policy "Admins can manage product documents"
on public.product_documents for all to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-documents', 'product-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf'];

create policy "Public can read published product document files"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'product-documents' and exists (
    select 1 from public.product_documents as document
    join public.products as product on product.id = document.product_id
    where document.storage_path = storage.objects.name
      and document.is_published and product.published
  )
);

create policy "Admins can read product document files"
on storage.objects for select to authenticated
using (bucket_id = 'product-documents' and public.is_admin());

create policy "Admins can upload product document files"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-documents' and public.is_admin());

create policy "Admins can delete product document files"
on storage.objects for delete to authenticated
using (bucket_id = 'product-documents' and public.is_admin());
