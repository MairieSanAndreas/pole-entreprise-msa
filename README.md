# Pôle Entreprise — Mairie de San Andréas

Outil de gestion collaboratif des entreprises pour le Pôle Entreprise :
fiches entreprises, suivi des rendez-vous, notes, factures, contrats, liens,
messages types, historique d'audit et gestion des comptes.

**Stack** : React + Vite · Supabase (PostgreSQL, Auth, Storage) · Edge Function
(Deno) pour l'administration · GitHub Pages pour l'hébergement.

Identité visuelle institutionnelle sombre & or, cohérente avec les autres
outils de la Mairie de San Andréas.

---

## 1. Prérequis

- **Node.js 18+** et npm
- Un compte **Supabase** (projet gratuit suffisant pour démarrer)
- La **CLI Supabase** pour déployer l'Edge Function : https://supabase.com/docs/guides/cli
- Un dépôt **GitHub** pour héberger le code

---

## 2. Installation locale

```bash
git clone https://github.com/<votre-compte>/pole-entreprise-msa.git
cd pole-entreprise-msa
npm install
cp .env.example .env      # puis renseignez vos clés (voir §4)
npm run dev               # démarre sur http://localhost:5173
```

---

## 3. Configuration de Supabase

### 3.1 Créer le projet
Créez un projet sur https://supabase.com. Notez l'**URL du projet** et la
**clé anon (publishable)** dans *Project Settings → API*.

### 3.2 Exécuter les migrations SQL
Dans *SQL Editor*, exécutez **dans l'ordre** les fichiers du dossier
`supabase/migrations/` :

1. `0001_schema.sql` — tables, types, relations, index
2. `0002_functions_triggers.sql` — fonctions RLS, `updated_at`, audit des notes
3. `0003_rls.sql` — politiques Row Level Security
4. `0004_storage.sql` — buckets Storage (`company-assets`, `documents`) + policies
5. `0005_seed.sql` — rôles et catégories par défaut

### 3.3 Créer la première responsable (bootstrap)
1. *Authentication → Users → Add user* : créez un utilisateur (email + mot de passe),
   confirmez l'email, copiez son **UUID**.
2. Dans *SQL Editor*, exécutez la requête en bas de `0005_seed.sql` en
   remplaçant l'UUID et les informations.

Les comptes suivants se créent ensuite **depuis l'application** (page
*Utilisateurs*), sans repasser par le tableau de bord Supabase.

### 3.4 Déployer l'Edge Function d'administration
La création de comptes utilise la clé `service_role` **uniquement côté serveur**.
Elle n'est jamais exposée au navigateur.

```bash
supabase login
supabase link --project-ref <ref-du-projet>
supabase functions deploy admin-users
```

Les secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`
sont fournis automatiquement par Supabase à la fonction ; aucun réglage
supplémentaire n'est nécessaire.

---

## 4. Variables d'environnement

Fichier `.env` à la racine (jamais commité — voir `.gitignore`) :

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé publique *anon / publishable* |

> Seule la clé **anon** est utilisée côté frontend. La clé `service_role`
> reste exclusivement dans l'Edge Function.

---

## 5. Lancer / construire

```bash
npm run dev       # développement (rechargement à chaud)
npm run build     # build de production dans dist/
npm run preview   # prévisualiser le build
```

---

## 6. Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit et publie automatiquement
à chaque `push` sur `main`.

1. *Repository → Settings → Secrets and variables → Actions* : ajoutez
   `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
2. *Settings → Pages* : source = **GitHub Actions**.
3. `git push` sur `main` → le site se déploie.
4. Dans Supabase, *Authentication → URL Configuration* : ajoutez l'URL Pages
   du site aux **Redirect URLs** / **Site URL**.

L'application utilise un routage par *hash* (`/#/…`), compatible d'emblée avec
GitHub Pages (aucune configuration de réécriture d'URL requise).

---

## 7. Rôles et autorisations

Deux rôles sont fournis (table `roles`, extensible) :

| Rôle | Droits |
|---|---|
| **Responsable du Pôle** | Accès total : comptes utilisateurs, catégories, suppressions définitives, historique complet, données sensibles. |
| **Secrétaire** | Consulte et alimente le CRM (entreprises, notes, factures, contrats, liens, templates), voit sa propre activité, accède aux données sensibles selon la configuration du rôle. |

**La sécurité est appliquée côté base** via Row Level Security, pas seulement
masquée dans l'interface :

- des fonctions `is_responsable()`, `is_active_user()`, `can_view_sensitive()`,
  `can_delete()` (SECURITY DEFINER) pilotent les politiques ;
- les **RIB** et documents sensibles sont isolés dans la table
  `company_sensitive`, accessible uniquement aux rôles autorisés ;
- le journal `audit_logs` est en **insertion seule** : aucune modification ni
  suppression n'est possible, y compris pour la responsable ;
- toute modification/suppression d'une **note** est tracée automatiquement par
  un trigger, même si l'action n'est pas passée par l'application ;
- la **suppression définitive** d'une entreprise est réservée à la responsable ;
  les secrétaires archivent (suppression logique).

Réglages fins par rôle : colonnes `can_view_sensitive`, `can_delete`,
`can_manage_users`, `can_view_all_audit` de la table `roles`.

---

## 8. Structure du projet

```
supabase/
  migrations/            SQL à exécuter dans l'ordre (schéma, RLS, storage, seed)
  functions/admin-users/ Edge Function d'administration des comptes
src/
  lib/          supabase (client), constants, format, audit, storage
  context/      AuthContext (session + rôle)
  hooks/        useToast
  components/   Layout, GlobalSearch, ui (Modal, Field, RdvPill…)
  pages/        Login, Dashboard, Companies, CompanyDetail, CompanyForm,
                Invoices, Contracts, Links, Templates, MySpace, History,
                Users, Settings
```

### Tables principales
`roles`, `profiles`, `companies`, `company_sensitive`, `company_contacts`,
`company_notes`, `company_documents`, `company_categories`,
`company_secondary_categories`, `invoices`, `contracts`, `useful_links`,
`message_templates`, `audit_logs`, `notifications`.

---

## 9. Suivi automatique des rendez-vous

La couleur de suivi se calcule à la volée depuis la date du jour, sans
modifier la fiche :

- **vert** — dernier RDV il y a moins de 3 semaines ;
- **orange** — 3 semaines ou plus ;
- **rouge** — 1 mois ou plus ;
- **gris** — aucun rendez-vous renseigné.

Seuils modifiables dans `src/lib/constants.js`
(`RDV_WARN_DAYS`, `RDV_LATE_DAYS`).

---

## 10. Messages types — variables

Les templates acceptent `{entreprise}`, `{patron}`, `{date}`, `{secretaire}`.
Depuis une fiche entreprise, les variables se remplissent avec ses
informations ; ailleurs, `{date}` et `{secretaire}` sont renseignés
automatiquement à la copie.
