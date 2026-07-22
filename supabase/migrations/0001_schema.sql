-- =====================================================================
-- Pôle Entreprise — Mairie de San Andréas
-- Migration 0001 : schéma (types, tables, relations, index)
-- =====================================================================
-- À exécuter dans l'éditeur SQL de Supabase (rôle postgres).
-- Ordre : 0001_schema → 0002_functions_triggers → 0003_rls → 0004_storage → 0005_seed
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Types énumérés ------------------------------------------------

do $$ begin
  create type company_status as enum ('prospect','actif','inactif','partenaire','archive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type note_type as enum
    ('compte_rendu','appel','demande_document','relance','probleme','info');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status as enum
    ('brouillon','en_attente','actif','termine','resilie','archive');
exception when duplicate_object then null; end $$;

-- ---------- Rôles ---------------------------------------------------------

create table if not exists public.roles (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,          -- 'responsable' | 'secretaire'
  label              text not null,
  level              int  not null default 0,       -- 100 = responsable
  can_manage_users   boolean not null default false,
  can_view_sensitive boolean not null default true, -- accès RIB / documents sensibles
  can_delete         boolean not null default false,
  can_view_all_audit boolean not null default false,
  created_at         timestamptz not null default now()
);

-- ---------- Profils (1-1 avec auth.users) --------------------------------

create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  first_name           text,
  last_name            text,
  display_name         text,
  email                text,
  role_id              uuid references public.roles(id),
  is_active            boolean not null default true,
  must_change_password boolean not null default true,
  last_login_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  created_by           uuid references auth.users(id) default auth.uid()
);

-- ---------- Catégories d'entreprises -------------------------------------

create table if not exists public.company_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  label      text not null,
  color      text not null default '#C9A24B',
  position   int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

-- ---------- Entreprises ---------------------------------------------------

create table if not exists public.companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  category_id         uuid references public.company_categories(id),
  logo_path           text,                       -- Storage: bucket company-assets
  owner_first_name    text,
  owner_last_name     text,
  owner_phone         text,
  coowner_first_name  text,                       -- copatron : facultatif
  coowner_last_name   text,
  coowner_phone       text,
  last_meeting_at     date,                       -- dernier rendez-vous
  status              company_status not null default 'prospect',
  notes               text,                       -- notes générales de la fiche
  is_active           boolean not null default true,
  archived_at         timestamptz,
  archived_by         uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid references auth.users(id) default auth.uid(),
  updated_by          uuid references auth.users(id) default auth.uid()
);

create index if not exists idx_companies_category on public.companies(category_id);
create index if not exists idx_companies_active   on public.companies(is_active);
create index if not exists idx_companies_meeting   on public.companies(last_meeting_at);
create index if not exists idx_companies_name      on public.companies(lower(name));

-- Catégories secondaires (facultatif, plusieurs par entreprise)
create table if not exists public.company_secondary_categories (
  company_id  uuid references public.companies(id) on delete cascade,
  category_id uuid references public.company_categories(id) on delete cascade,
  primary key (company_id, category_id)
);

-- ---------- Données sensibles (RIB) — table séparée = colonne masquable ---

create table if not exists public.company_sensitive (
  company_id        uuid primary key references public.companies(id) on delete cascade,
  rib_text          text,
  rib_document_path text,                         -- Storage: bucket documents
  updated_at        timestamptz not null default now(),
  updated_by        uuid references auth.users(id) default auth.uid()
);

-- ---------- Contacts supplémentaires -------------------------------------

create table if not exists public.company_contacts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  first_name  text,
  last_name   text,
  phone       text,
  role        text,                               -- ex: 'RH', 'comptable'
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);
create index if not exists idx_contacts_company on public.company_contacts(company_id);

-- ---------- Notes de suivi ------------------------------------------------

create table if not exists public.company_notes (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  author_id   uuid references auth.users(id) default auth.uid(),
  type        note_type not null default 'info',
  content     text not null,
  is_deleted  boolean not null default false,
  deleted_at  timestamptz,
  deleted_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_notes_company on public.company_notes(company_id, created_at desc);
create index if not exists idx_notes_author  on public.company_notes(author_id, created_at desc);

-- ---------- Documents génériques -----------------------------------------

create table if not exists public.company_documents (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  doc_type     text not null default 'autre',     -- 'rib' | 'logo' | 'autre'
  name         text not null,
  storage_path text,
  external_url text,
  mime_type    text,
  size_bytes   bigint,
  created_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) default auth.uid()
);
create index if not exists idx_documents_company on public.company_documents(company_id, created_at desc);

-- ---------- Factures ------------------------------------------------------

create table if not exists public.invoices (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references public.companies(id) on delete cascade,
  number         text not null,                   -- nom ou numéro
  category       text,
  file_path      text,                            -- Storage: bucket documents
  external_url   text,
  amount         numeric(12,2),
  invoice_date   date,
  received_at    date default current_date,
  comment        text,
  previous_files jsonb not null default '[]'::jsonb, -- historique des remplacements
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid references auth.users(id) default auth.uid()
);
create index if not exists idx_invoices_company on public.invoices(company_id, received_at desc);
create index if not exists idx_invoices_number  on public.invoices(lower(number));

-- ---------- Contrats ------------------------------------------------------

create table if not exists public.contracts (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  name         text not null,
  category     text,
  file_path    text,
  external_url text,
  status       contract_status not null default 'brouillon',
  start_date   date,
  end_date     date,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) default auth.uid()
);
create index if not exists idx_contracts_company on public.contracts(company_id);
create index if not exists idx_contracts_status  on public.contracts(status);
create index if not exists idx_contracts_end     on public.contracts(end_date);

-- ---------- Liens utiles (GDocs) -----------------------------------------

create table if not exists public.useful_links (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  url         text not null,
  category    text,
  company_id  uuid references public.companies(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);
create index if not exists idx_links_category on public.useful_links(category);

-- ---------- Templates / messages types -----------------------------------

create table if not exists public.message_templates (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,
  content     text not null,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) default auth.uid()
);
create index if not exists idx_templates_category on public.message_templates(category);

-- ---------- Journal d'audit (insert-only) --------------------------------

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) default auth.uid(),
  action      text not null,                      -- create | update | delete | archive | ...
  entity_type text not null,                      -- company | note | invoice | contract | ...
  entity_id   uuid,
  company_id  uuid references public.companies(id) on delete set null,
  field       text,
  old_value   text,
  new_value   text,
  summary     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_audit_actor   on public.audit_logs(actor_id, created_at desc);
create index if not exists idx_audit_company on public.audit_logs(company_id, created_at desc);
create index if not exists idx_audit_entity  on public.audit_logs(entity_type, entity_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ---------- Notifications internes ---------------------------------------

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade, -- null = diffusion à tous
  type        text not null,
  title       text not null,
  body        text,
  entity_type text,
  entity_id   uuid,
  company_id  uuid references public.companies(id) on delete cascade,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);
