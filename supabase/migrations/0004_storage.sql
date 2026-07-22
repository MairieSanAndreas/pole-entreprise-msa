-- =====================================================================
-- Migration 0004 : Supabase Storage (buckets + policies)
-- =====================================================================
-- Deux buckets :
--   company-assets (public)  -> logos d'entreprises (affichés en <img>)
--   documents      (privé)   -> RIB, factures, contrats, autres documents
--                               (accès via URL signée, réservé au personnel actif)
-- Organisation des chemins : {company_id}/{type}/{fichier}
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('company-assets', 'company-assets', true,  5242880,
     array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('documents', 'documents', false, 15728640,
     array['application/pdf','image/png','image/jpeg','image/webp',
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- company-assets (logos) ---------------------------------------
-- Lecture publique assurée par le flag `public` du bucket.
drop policy if exists assets_insert on storage.objects;
create policy assets_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'company-assets' and public.is_active_user());

drop policy if exists assets_update on storage.objects;
create policy assets_update on storage.objects
  for update to authenticated
  using (bucket_id = 'company-assets' and public.is_active_user());

drop policy if exists assets_delete on storage.objects;
create policy assets_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'company-assets' and public.is_responsable());

-- ---------- documents (privé) --------------------------------------------
drop policy if exists documents_read on storage.objects;
create policy documents_read on storage.objects
  for select to authenticated
  using (bucket_id = 'documents' and public.is_active_user());

drop policy if exists documents_insert on storage.objects;
create policy documents_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'documents' and public.is_active_user());

drop policy if exists documents_update on storage.objects;
create policy documents_update on storage.objects
  for update to authenticated
  using (bucket_id = 'documents' and public.is_active_user());

drop policy if exists documents_delete on storage.objects;
create policy documents_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'documents' and public.is_responsable());
