# Photon Merchants

Online store for Photon Merchants (OTC Wholesale Mall, Nairobi).

Signed agreement: **KES 100,000 · 9 weeks**. Payments: **M-Pesa STK only** (no Paystack, no cards at launch).

## Phase status

### Phase 0 — Foundations

| Slice | Status |
| --- | --- |
| 0.1–0.5 Shell, Medusa, brand, chrome, staging | Done |

### Phase 1 — Catalog

| Slice | Status |
| --- | --- |
| 1.1–1.5 Categories, products, PDP, search, bag | Done |

### Phase 2 — Homepage

| Slice | Status | Done when |
| --- | --- | --- |
| 2.1 Hero banner | Done | Full-bleed promo + CTA |
| 2.2 Offer strip | Done | Sale badge + compare-at price |
| 2.3 Category tiles | Done | Eight categories from Medusa (rank + `metadata.image_url`) |
| 2.4 Featured / New / Best sellers | Done | Three shelves from admin handles |
| 2.5 Trust strip | Done | M-Pesa · delivery · collect |
| 2.6 Admin homepage | Done | Medusa **Homepage** sidebar → save → storefront refresh |
| Sale campaign | Done | Black Friday: Medusa sale price list + countdown bar, homepage banner, `/deals` |

Seed catalog + homepage (run in order; each is idempotent):

```bash
cd backend/apps/backend
npx medusa exec ./src/scripts/seed-photon-catalog.ts
npx medusa exec ./src/scripts/seed-photon-homepage.ts
npx medusa exec ./src/scripts/seed-photon-categories.ts   # 8 categories, 31 products
npx medusa exec ./src/scripts/seed-black-friday.ts        # price list 21–30 Nov 2026
```

Campaign: sale prices and dates live in Admin → **Price Lists**; the banner copy and
on/off switch live in Admin → **Homepage → Sale campaign**. When the price list ends,
prices revert and the storefront drops the bar, banner, and badges on its own.

Edit homepage: http://localhost:9000/app/homepage

## Staging (phone)

Live tunnel (while this machine runs Next + cloudflared):

**https://surname-usually-footage-acceptance.trycloudflare.com**

```bash
cd storefront && npm run dev -- --port 3001
npx cloudflared tunnel --protocol http2 --url http://127.0.0.1:3001
```

The URL changes every time the tunnel restarts. Browser calls to Medusa go through
the storefront's `/medusa/*` rewrite, so one tunnel covers login, checkout, and tracking.

Same Wi‑Fi LAN: `http://192.168.100.24:3001`

## Local URLs

| App | URL |
| --- | --- |
| Storefront | http://localhost:3001 |
| Medusa Admin | http://localhost:9000/app |
| Medusa API | http://localhost:9000 |

### Admin login (local only)

- Email: `admin@photon.local`
- Password: `PhotonAdmin2026!`

Change this before any shared/staging admin is exposed.

## Run locally

Postgres (Homebrew):

```bash
brew services start postgresql@16
```

Database: `photon_medusa` (user `daniel` on this machine).

```bash
# Terminal 1 — commerce backend
cd backend
npm run backend:dev

# Terminal 2 — storefront
cd storefront
npm run dev -- --port 3001
```

Docker Compose Postgres is also defined in `docker-compose.yml` if you prefer Docker later.

## Project layout

```
storefront/          Next.js shop (customer-facing)
backend/             Medusa monorepo
  apps/backend/      Medusa API + admin
brand/logo.png       Client logo
mockups/             Clickable HTML prototype (reference)
docker-compose.yml   Optional Postgres via Docker
```

## Brand

- Colours: black `#0a0a0a`, mustard `#e8a317`, cream text
- Logo: `brand/logo.png` / `storefront/public/logo.png`
- WhatsApp (site button): `0748 908 954` — confirm if the client prefers the other number

### Phase 3 — Bag & checkout

| Slice | Status |
| --- | --- |
| 3.1–3.2 Bag persist / qty / subtotal | Done |
| 3.3 Guest form | Done |
| 3.4 Delivery vs collection | Done |
| 3.5 Fees from Excel | Done (`src/data/delivery-areas.json`) |
| 3.6 Summary + M-Pesa stub | Done (`/checkout/pay`) |

### Phase 4 — Customer accounts

| Slice | Status |
| --- | --- |
| 4.1 Register / login / logout | Done (`/account`, Medusa emailpass session) |
| 4.2 Password reset | Done (local email log + `.photon-last-reset-url` + `/account/reset-password`) |
| 4.3 Saved addresses | Done (Medusa addresses + checkout reuse) |
| 4.4 Order history | Done (local history until Phase 5/6 Medusa orders) |
| GATE | Guest checkout still works; account checkout prefills + saved areas |

### Phase 5 — Payment (sandbox simulate)

| Slice | Status |
| --- | --- |
| Simulate success / fail | Done (`/checkout/pay`) |
| Idempotent paid state | Done (retry does not re-debit) |
| Live Daraja STK | Parked until client credentials |

### Phase 6 — Orders, tracking, staff desk

| Slice | Status |
| --- | --- |
| 6.1 Status model | Done (`placed` → `delivered` + cancelled/returned) |
| 6.2 Staff update | Done (Medusa **Orders desk**) |
| 6.3 Customer tracking | Done (`/orders` + account history) |
| 6.4 Status emails | Done (local notification log) |
| 6.5 Delivery notes | Done (ETA + dispatch note on desk) |

### Phase 7 — Merchandising and ops

| Slice | Status |
| --- | --- |
| 7.1 Product CRUD + multi images | Done (Medusa Products + clickable PDP gallery) |
| 7.2 Discount codes | Done (admin **Discounts** · checkout `PHOTON10` / `SAVE500`) |
| 7.3 Low-stock list | Done (admin **Low stock**) |
| 7.4 Sales summary | Done (Orders desk date range + paid total) |
| 7.5 Banners / offers | Done (Homepage upload + product search picker) |

### Phase 8 — Launch plumbing

| Slice | Status |
| --- | --- |
| 8.1 Domain + HTTPS | Docs ready ([docs/DEPLOY.md](docs/DEPLOY.md)) — needs client domain |
| 8.2 DB backup + restore | Done (`scripts/backup-db.sh`, `scripts/restore-db.sh`) |
| 8.3 SEO basics | Done (titles/OG, `/sitemap.xml`, `/robots.txt`) |
| 8.4 GA / Pixel | Done (env stubs; loads only when IDs set) |
| 8.5 Training + ops guide | Done ([docs/OPERATING.md](docs/OPERATING.md)) |
| 8.6 Acceptance list | Done ([docs/ACCEPTANCE.md](docs/ACCEPTANCE.md)) |

Live Daraja STK and public domain cutover still pending client.

