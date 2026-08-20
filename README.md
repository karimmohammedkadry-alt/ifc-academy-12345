# IFC Academy — Production

IFC Academy uses **Supabase PostgreSQL as the only persistent database**. The application contains no local JSON database, mock academy data, SQLite database, or in-memory fallback for academy records.

## Production deployment

1. In the **existing** Supabase project, review and run `supabase/production_migration.sql` once. It is non-destructive: it does not drop, truncate, reset, or recreate the existing production tables. It only adds missing compatibility columns, creates genuinely new feature tables with `IF NOT EXISTS`, and adds indexes.
2. Do **not** run an old schema/reset script from a previous version of the project.
3. Push the repository contents to GitHub.
4. Import the GitHub repository into Vercel.
5. Add these **server-only** Vercel Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (32+ random characters)
   - `SESSION_SECRET` (32+ random characters)
   - `NODE_ENV=production`
6. Redeploy after setting the variables.
7. Verify:
   - `/api/health` returns `{ "ok": true }`.
   - `/api/supabase/status` returns `connected: true`.
   - Login uses the existing `users` table and existing admin UUID.

`SUPABASE_ANON_KEY` is included in `.env.example` for compatibility, but production backend access should use the server-only service-role key. Never place service-role, JWT, or session secrets in any `VITE_` variable or frontend source.

## Architecture

Browser → relative `/api/*` → Express serverless function → Supabase PostgreSQL.

`api/index.ts` is only the Vercel entry point. Business logic lives under `server/`.

## Local development

Create a local `.env` from `.env.example`, install dependencies, then run `npm run dev`.

## Verification

Run before production deployment:

```bash
npm install
npm run build
npx tsc --noEmit
```

The current source was statically audited in the supplied environment. Full dependency installation/build execution could not be completed there because the package download operation timed out; therefore a successful build should be confirmed by GitHub/Vercel before real customer use.
