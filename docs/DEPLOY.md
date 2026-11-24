# Photon Merchants — Deploy (Phase 8.1)

Goal: shop loads on the **client domain over HTTPS**.

## What to host

| App | Role | Typical host |
| --- | --- | --- |
| `storefront/` | Next.js public shop | Vercel / Cloudflare / any Node host |
| `backend/apps/backend` | Medusa API + Admin | Railway / Render / VPS |
| Postgres 16 | Medusa DB | Same provider managed Postgres |

## Storefront env (production)

```bash
MEDUSA_BACKEND_URL=https://api.client-domain.example
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.client-domain.example
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_SITE_URL=https://www.client-domain.example
NEXT_PUBLIC_DEFAULT_REGION=ke
# Optional analytics (Phase 8.4)
# NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX
# NEXT_PUBLIC_META_PIXEL_ID=1234567890
```

## Backend env (production)

```bash
DATABASE_URL=postgres://...
STORE_CORS=https://www.client-domain.example
ADMIN_CORS=https://admin.client-domain.example,https://api.client-domain.example
AUTH_CORS=https://www.client-domain.example,https://api.client-domain.example
STOREFRONT_URL=https://www.client-domain.example
JWT_SECRET=...   # long random
COOKIE_SECRET=...
```

Admin is served from Medusa at `/app` on the API host (or reverse-proxied).

## DNS + HTTPS checklist

1. Point `www` (and apex) A/CNAME to the storefront host.
2. Point `api` to the Medusa host.
3. Enable provider HTTPS (Let’s Encrypt / Cloudflare).
4. Confirm `https://www…` loads the shop and `https://api…/health` (or store products) responds.
5. Update Medusa CORS to match exact storefront origins (no trailing slash mismatches).

## Soft launch order

1. Deploy Postgres + Medusa + run migrations / seed catalog if empty.
2. Deploy storefront with production keys.
3. Create admin user; change password from local defaults.
4. Smoke: browse → bag → checkout → sandbox pay (until Daraja credentials).
5. Schedule `scripts/backup-db.sh` daily (see [OPERATING.md](./OPERATING.md)).

## Not done until client provides

- Final domain name
- Live Daraja STK credentials (Phase 5 parked)
- GA / Search Console / Meta Pixel IDs (optional day one)
