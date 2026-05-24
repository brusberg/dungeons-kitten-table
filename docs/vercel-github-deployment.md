# Vercel + GitHub Deployment

## Target Architecture

```text
GitHub repo: brusberg/dungeons-kittens-table
  |
  v
Vercel Hobby project
  |
  +-- Next.js app hosting
  +-- Preview URL per branch/PR
  +-- Production URL from main
  |
  v
Supabase project
  +-- campaigns document table
  +-- realtime table subscriptions
```

No custom domain is needed for the first launch. Vercel will provide a `*.vercel.app` URL.

## GitHub Setup

Create an empty GitHub repository under the `brusberg` account. Suggested name:

```text
dungeons-kittens-table
```

Then push this local repo:

```bash
git remote add origin git@github.com:brusberg/dungeons-kittens-table.git
git branch -M main
git push -u origin main
```

If using HTTPS instead of SSH:

```bash
git remote add origin https://github.com/brusberg/dungeons-kittens-table.git
git branch -M main
git push -u origin main
```

This repo is locally configured for unsigned commits and future commits authored as:

```text
brusberg <brenbrus@gmail.com>
```

## Vercel Import

1. In Vercel, choose `Add New...` then `Project`.
2. Select the GitHub provider.
3. Import `brusberg/dungeons-kittens-table`.
4. Framework Preset should auto-detect as `Next.js`.
5. Keep Root Directory as repository root.
6. Build Command should resolve to `npm run build`.
7. Install Command can stay automatic, or be set to `npm ci` for lockfile installs.
8. Deploy.

Vercel creates preview deployments for branch pushes and a production deployment from `main`.

## Environment Variables

The app can deploy without Supabase variables, but live multiplayer will show as unavailable until these are configured:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Add both variables to Vercel Project Settings for Production and Preview. After adding or changing env vars, trigger a new deployment.

## Supabase Database

Run the SQL in:

```text
docs/supabase-sync-schema.sql
```

For the MVP, table codes are soft-private and seat choice is not auth. Before sharing broadly, add row-level security policies or a server-side API boundary.

## Current Notes

- The app currently uses `next build --webpack` to keep local Codex/macOS testing stable.
- Vercel will respect the `build` script from `package.json` for Next.js projects.
- No `vercel.json` is required for this app right now.
