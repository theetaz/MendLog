# Supabase setup — MendLog

4 clicks. Should take ~30 seconds.

1. **Create the project** — https://supabase.com/dashboard → *New Project* → name it `mendlog`, pick a region close to you (e.g. `ap-south-1` Mumbai), set a database password (save it in your password manager).

2. **Copy URL + anon key** — Project Settings → *API*. Copy the two values into a new `.env` file at the repo root (template: [`.env.example`](../../.env.example)):

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   ```

3. **Run the schema** — SQL Editor → paste the contents of [`schema.sql`](./schema.sql) → *Run*. This creates the `jobs` table, enables RLS (so users only see their own rows), and adds an `activity_per_day` function for the contribution grid.

4. **Enable email auth** — Authentication → *Providers* → turn on Email. For v0 we're using email+password.

That's it. Restart `npx expo start` after writing `.env` so the new env vars get picked up.

## Notes

- `.env` is git-ignored. Don't commit it.
- The anon key is safe to ship in the app bundle — RLS enforces data isolation server-side.
- No service-role key lives on the device. Ever. If a workflow ever needs one (e.g. batch import), we'll run it from a local script and never ship it.
