-- =====================================================================
-- Migration 0005 : données initiales (rôles + catégories)
-- =====================================================================

-- ---------- Rôles ---------------------------------------------------------
insert into public.roles (slug, label, level, can_manage_users, can_view_sensitive, can_delete, can_view_all_audit)
values
  ('responsable', 'Responsable du Pôle', 100, true,  true, true,  true),
  ('secretaire',  'Secrétaire',           10, false, true, false, false)
on conflict (slug) do update
  set label = excluded.label,
      level = excluded.level,
      can_manage_users   = excluded.can_manage_users,
      can_view_sensitive = excluded.can_view_sensitive,
      can_delete         = excluded.can_delete,
      can_view_all_audit = excluded.can_view_all_audit;

-- ---------- Catégories d'entreprises par défaut --------------------------
insert into public.company_categories (slug, label, color, position) values
  ('ltd',         'LTD',         '#C9A24B', 1),
  ('fast_food',   'Fast Food',   '#D98A3A', 2),
  ('service',     'Service',     '#4C86C6', 3),
  ('farm',        'Farm',        '#4F9E5E', 4),
  ('automobile',  'Automobile',  '#8B8F98', 5),
  ('artistique',  'Artistique',  '#B565C0', 6),
  ('night',       'Night',       '#7A5CE0', 7),
  ('association', 'Association', '#3FA5A0', 8)
on conflict (slug) do nothing;

-- =====================================================================
-- BOOTSTRAP DE LA PREMIÈRE RESPONSABLE
-- ---------------------------------------------------------------------
-- 1) Créez l'utilisateur dans Supabase > Authentication > Users (Add user),
--    avec un mot de passe. Copiez son UUID.
-- 2) Décommentez et complétez la requête ci-dessous, puis exécutez-la :
--
-- insert into public.profiles (id, first_name, last_name, display_name, email,
--                              role_id, is_active, must_change_password)
-- values (
--   '00000000-0000-0000-0000-000000000000',        -- UUID copié à l'étape 1
--   'Prénom', 'Nom', 'Prénom Nom', 'email@exemple.fr',
--   (select id from public.roles where slug = 'responsable'),
--   true, false
-- );
--
-- Les comptes suivants se créent ensuite depuis l'application
-- (page « Utilisateurs »), via l'Edge Function admin-users.
-- =====================================================================
