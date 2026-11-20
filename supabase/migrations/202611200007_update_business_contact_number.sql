begin;

update public.business_settings
set phone = '+917977039439',
    whatsapp = '917977039493',
    updated_at = now()
where id = 'business';

commit;
