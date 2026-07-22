-- =====================================================================
-- Migration 0002 : fonctions & triggers
-- =====================================================================

-- ---------- Helpers de rôle (SECURITY DEFINER) ---------------------------
-- Utilisés par les policies RLS. security definer => évite la récursion RLS
-- sur profiles quand on lit le rôle de l'utilisateur courant.

create or replace function public.my_role_slug()
returns text
language sql stable security definer set search_path = public
as $$
  select r.slug
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid() and p.is_active
$$;

create or replace function public.is_active_user()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
$$;

create or replace function public.is_responsable()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.my_role_slug() = 'responsable', false)
$$;

create or replace function public.can_view_sensitive()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.is_active and r.can_view_sensitive
  )
$$;

create or replace function public.can_delete()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    join public.roles r on r.id = p.role_id
    where p.id = auth.uid() and p.is_active and r.can_delete
  )
$$;

-- ---------- updated_at automatique ---------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- companies : updated_at + updated_by automatiques
create or replace function public.set_updated_company()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists trg_companies_updated on public.companies;
create trigger trg_companies_updated before update on public.companies
  for each row execute function public.set_updated_company();

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','company_notes','invoices','contracts',
    'useful_links','message_templates','company_sensitive'
  ] loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ---------- Audit automatique des notes (modif / suppression) ------------
-- Garantit qu'une note ne peut pas être modifiée « silencieusement ».

create or replace function public.audit_note_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'UPDATE') then
    if new.is_deleted and not old.is_deleted then
      insert into public.audit_logs(actor_id, action, entity_type, entity_id, company_id, summary, old_value)
      values (auth.uid(), 'delete', 'note', old.id, old.company_id,
              'Suppression d''une note de suivi', left(old.content, 500));
    elsif new.content is distinct from old.content then
      insert into public.audit_logs(actor_id, action, entity_type, entity_id, company_id, field, old_value, new_value, summary)
      values (auth.uid(), 'update', 'note', old.id, old.company_id,
              'content', left(old.content, 500), left(new.content, 500),
              'Modification d''une note de suivi');
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_notes_audit on public.company_notes;
create trigger trg_notes_audit after update on public.company_notes
  for each row execute function public.audit_note_change();

-- ---------- Enregistrer la dernière connexion ----------------------------
-- Appelée par le frontend après un login réussi.

create or replace function public.touch_last_login()
returns void language sql security definer set search_path = public as $$
  update public.profiles
     set last_login_at = now(), must_change_password = must_change_password
   where id = auth.uid()
$$;

-- ---------- Marquer le mot de passe comme changé --------------------------

create or replace function public.mark_password_changed()
returns void language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid()
$$;
