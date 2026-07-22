-- =====================================================================
-- Migration 0003 : Row Level Security
-- =====================================================================
-- Principe :
--  * tout utilisateur ACTIF authentifié peut consulter/alimenter le CRM ;
--  * seule la responsable gère comptes, catégories, suppressions définitives
--    et voit l'historique complet ;
--  * les données sensibles (RIB) sont isolées dans company_sensitive ;
--  * audit_logs est en insertion seule (aucun UPDATE / DELETE autorisé).
-- =====================================================================

alter table public.roles                        enable row level security;
alter table public.profiles                     enable row level security;
alter table public.company_categories           enable row level security;
alter table public.companies                    enable row level security;
alter table public.company_secondary_categories enable row level security;
alter table public.company_sensitive            enable row level security;
alter table public.company_contacts             enable row level security;
alter table public.company_notes                enable row level security;
alter table public.company_documents            enable row level security;
alter table public.invoices                     enable row level security;
alter table public.contracts                    enable row level security;
alter table public.useful_links                 enable row level security;
alter table public.message_templates            enable row level security;
alter table public.audit_logs                   enable row level security;
alter table public.notifications                enable row level security;

-- ------------------------------------------------------------ roles ------
create policy roles_read on public.roles
  for select to authenticated using (public.is_active_user());
create policy roles_manage on public.roles
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- --------------------------------------------------------- profiles ------
-- Lecture de tous les profils actifs (attribution « qui a fait quoi »),
-- écriture réservée à la responsable.
create policy profiles_read on public.profiles
  for select to authenticated
  using (public.is_active_user() and (is_active or public.is_responsable() or id = auth.uid()));
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- ------------------------------------------------ company_categories -----
create policy categories_read on public.company_categories
  for select to authenticated using (public.is_active_user());
create policy categories_manage on public.company_categories
  for all to authenticated
  using (public.is_responsable()) with check (public.is_responsable());

-- -------------------------------------------------------- companies ------
-- Actifs : voient les entreprises non archivées. Responsable : tout.
create policy companies_read on public.companies
  for select to authenticated
  using (public.is_active_user() and (is_active or public.is_responsable()));
create policy companies_insert on public.companies
  for insert to authenticated with check (public.is_active_user());
create policy companies_update on public.companies
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
-- Suppression DÉFINITIVE : responsable uniquement.
create policy companies_delete on public.companies
  for delete to authenticated using (public.can_delete());

-- --------------------------------- company_secondary_categories ----------
create policy sec_cat_read on public.company_secondary_categories
  for select to authenticated using (public.is_active_user());
create policy sec_cat_write on public.company_secondary_categories
  for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());

-- ------------------------------------------------ company_sensitive ------
-- RIB : uniquement les rôles autorisés (can_view_sensitive).
create policy sensitive_read on public.company_sensitive
  for select to authenticated using (public.can_view_sensitive());
create policy sensitive_write on public.company_sensitive
  for all to authenticated
  using (public.can_view_sensitive()) with check (public.can_view_sensitive());

-- ------------------------------------------------- company_contacts ------
create policy contacts_read on public.company_contacts
  for select to authenticated using (public.is_active_user());
create policy contacts_write on public.company_contacts
  for all to authenticated
  using (public.is_active_user()) with check (public.is_active_user());

-- --------------------------------------------------- company_notes -------
-- Lecture par tous les actifs ; une note appartient à son auteur.
-- Modif/suppression : auteur ou responsable (et toujours tracée, cf. trigger).
create policy notes_read on public.company_notes
  for select to authenticated using (public.is_active_user());
create policy notes_insert on public.company_notes
  for insert to authenticated
  with check (public.is_active_user() and author_id = auth.uid());
create policy notes_update on public.company_notes
  for update to authenticated
  using (author_id = auth.uid() or public.is_responsable())
  with check (author_id = auth.uid() or public.is_responsable());
create policy notes_delete on public.company_notes
  for delete to authenticated using (public.is_responsable());

-- ----------------------------------------------- company_documents -------
create policy documents_read on public.company_documents
  for select to authenticated using (public.is_active_user());
create policy documents_write on public.company_documents
  for insert to authenticated with check (public.is_active_user());
create policy documents_update on public.company_documents
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy documents_delete on public.company_documents
  for delete to authenticated using (public.is_responsable());

-- ---------------------------------------------------------- invoices -----
create policy invoices_read on public.invoices
  for select to authenticated using (public.is_active_user());
create policy invoices_write on public.invoices
  for insert to authenticated with check (public.is_active_user());
create policy invoices_update on public.invoices
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy invoices_delete on public.invoices
  for delete to authenticated using (public.is_responsable());

-- --------------------------------------------------------- contracts -----
create policy contracts_read on public.contracts
  for select to authenticated using (public.is_active_user());
create policy contracts_write on public.contracts
  for insert to authenticated with check (public.is_active_user());
create policy contracts_update on public.contracts
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy contracts_delete on public.contracts
  for delete to authenticated using (public.is_responsable());

-- ------------------------------------------------------ useful_links -----
create policy links_read on public.useful_links
  for select to authenticated using (public.is_active_user());
create policy links_write on public.useful_links
  for insert to authenticated with check (public.is_active_user());
create policy links_update on public.useful_links
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy links_delete on public.useful_links
  for delete to authenticated
  using (created_by = auth.uid() or public.is_responsable());

-- ------------------------------------------------- message_templates -----
create policy templates_read on public.message_templates
  for select to authenticated using (public.is_active_user());
create policy templates_write on public.message_templates
  for insert to authenticated with check (public.is_active_user());
create policy templates_update on public.message_templates
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy templates_delete on public.message_templates
  for delete to authenticated
  using (created_by = auth.uid() or public.is_responsable());

-- --------------------------------------------------------- audit_logs ----
-- Insertion par tout utilisateur actif (trace de ses actions).
-- Lecture : sa propre activité, ou tout pour la responsable.
-- AUCUN update / delete => historique non modifiable, y compris responsable.
create policy audit_read on public.audit_logs
  for select to authenticated
  using (public.is_active_user() and (actor_id = auth.uid() or public.is_responsable()));
create policy audit_insert on public.audit_logs
  for insert to authenticated
  with check (public.is_active_user() and actor_id = auth.uid());

-- ------------------------------------------------------ notifications ----
create policy notif_read on public.notifications
  for select to authenticated
  using (public.is_active_user() and (user_id = auth.uid() or user_id is null));
create policy notif_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notif_insert on public.notifications
  for insert to authenticated with check (public.is_responsable());
