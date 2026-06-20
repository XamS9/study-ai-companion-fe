# Supabase Setup — Auth, Profile, Theme & i18n

This is the external setup required before the auth/profile features work. The app
is already coded against env vars; these steps fill in the real values.

> Provider summary for this phase: **Email/Password + Google + GitHub + Microsoft**.
> Avatars use a **private** Storage bucket served via **signed URLs**. Theme & language
> are **local-only** for now (no profile columns yet).

---

## 1. Create the Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**.
2. Pick a name/region and a strong database password.
3. Once provisioned, open **Project Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → backend only (`SUPABASE_SERVICE_ROLE_KEY`), **never** in the app.

Note your **project ref** (the `<ref>` in `https://<ref>.supabase.co`) — it appears in the
OAuth callback URL below.

---

## 2. Frontend env

Create `study-ai-companion-fe/.env` (copy from `.env.example`):

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=http://localhost:4000
```

The OAuth redirect scheme (`studyaicompanionfe`) is already set in `app.json`.

---

## 3. Auth → URL Configuration

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `studyaicompanionfe://`
- **Redirect URLs** (add all):
  - `studyaicompanionfe://`
  - `studyaicompanionfe://reset-password`
  - the Expo dev URL printed by `pnpm start` (e.g. `exp://192.168.x.x:8081`) — for testing
    in a dev build.

---

## 4. Auth → Providers

Dashboard → **Authentication → Providers**.

### Email
- Enable **Email**.
- Turn **Confirm email** ON (registration stays pending until the link is tapped).

### Google
1. <https://console.cloud.google.com> → create/select a project.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
3. **Authorized redirect URIs**: `https://<ref>.supabase.co/auth/v1/callback`
4. Copy **Client ID** + **Client secret** into the Supabase **Google** provider → enable.

### GitHub
1. <https://github.com/settings/developers> → **New OAuth App**.
2. **Authorization callback URL**: `https://<ref>.supabase.co/auth/v1/callback`
3. Copy **Client ID** + generate a **Client secret** → paste into Supabase **GitHub** provider → enable.

### Microsoft (Azure)
1. <https://portal.azure.com> → **Microsoft Entra ID → App registrations → New registration**.
2. **Redirect URI** (type *Web*): `https://<ref>.supabase.co/auth/v1/callback`
3. **Certificates & secrets → New client secret** → copy the secret **value**.
4. Copy **Application (client) ID** + the secret into the Supabase **Azure** provider → enable.
   (Set the tenant/issuer if you want to restrict to a single organization.)

---

## 5. Auth → Email Templates

Dashboard → **Authentication → Email Templates**. Customize and confirm the redirect for:

- **Confirm signup** → redirects to `studyaicompanionfe://`
- **Reset password** → redirects to `studyaicompanionfe://reset-password`

The free tier's built-in mailer is fine for the MVP (rate-limited). Add custom SMTP later if
you outgrow it.

---

## 6. Storage → avatars bucket

Dashboard → **Storage → New bucket**:
- Name: `avatars`
- **Public: OFF** (private — the app fetches short-lived signed URLs).

The RLS policies for it are in the SQL below.

---

## 7. Database → SQL

Dashboard → **SQL Editor** → run this once:

```sql
-- profiles: 1 row per auth user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,           -- storage object path, NOT a public URL
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- auto-create a profile row on signup (reads full_name from signUp metadata)
create function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- storage policies for the private 'avatars' bucket (path = <uid>/avatar.<ext>)
create policy "avatar read own"
  on storage.objects for select
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar write own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar update own"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

---

## 8. Verify

OAuth and deep links require a **dev build** — they do **not** work in Expo Go.

```bash
nvm use            # Node 22
pnpm install
pnpm android       # or: pnpm ios  (development build)
```

Then walk through:
- Email sign up → confirmation email → tap link → lands on dashboard.
- Login with Google / GitHub / Microsoft.
- Forgot password → reset email → deep link → set new password → re-login.
- Profile: upload a photo (shows via signed URL), edit name.
- Settings: switch theme (system/light/dark) and language (es/en) — both persist across restart.
- Log in, kill network, reopen → still lands on the authenticated shell (persisted session).

Email/password login, theme, and language can be tested without OAuth configured.
