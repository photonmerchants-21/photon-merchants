# Photon Merchants — Operating guide (Phase 8.5)

Short guide for staff. Pair with a ~90-minute walkthrough on launch week.

## Daily flow

1. **Orders desk** (Medusa Admin → Orders desk)  
   - Filter by date if needed (sales summary at top).  
   - Open an order → set status → save.  
   - Collection: use *ready for collection* / *collected*.  
   - Delivery: packed → dispatched → out for delivery → delivered.  
   - Add ETA + note when useful.

2. **Catalog** (Medusa Admin → Products)  
   - Add product: title, handle, images (multiple), variants, KES price, inventory.  
   - Sale price: set product metadata `compare_at_price` to the old KES amount.  
   - Publish when ready.

3. **Homepage** (Medusa Admin → Homepage)  
   - Upload or paste hero image URL → edit text/CTA → Save.  
   - Search products → choose a shelf → click to add handles.  
   - Refresh the storefront to see changes.

4. **Discounts** (Medusa Admin → Discounts)  
   - Create percent or fixed KES codes; toggle Active.  
   - Customers enter the code at checkout.

5. **Low stock** (Medusa Admin → Low stock)  
   - Review variants at/under the threshold; restock in Products.

## Customer-facing pages

| Need | URL |
| --- | --- |
| Shop home | `/` |
| Track order | `/orders` (order number + checkout phone) |
| Account | `/account` |
| WhatsApp | Floating button (site number) |

## Payments (current)

- **Sandbox simulate** on `/checkout/pay` until live Daraja STK is wired.  
- Success → order `paid`, stock decrements once.  
- Fail → `payment_failed`, **no** stock change, customer can retry.

## Backups

```bash
# From repo root (requires pg_dump)
./scripts/backup-db.sh
```

Restore test (staging DB only):

```bash
./scripts/restore-db.sh backups/photon_medusa-YYYYMMDD-HHMMSS.dump
```

Schedule the backup script daily on the server that can reach Postgres.

## Passwords

Change `admin@photon.local` / local demo passwords before any public admin URL is exposed.

## Training agenda (90 min)

1. Browse + search on phone (10)  
2. Place guest order + track (15)  
3. Register / address / history (10)  
4. Orders desk statuses + collection vs delivery (20)  
5. Add product + images + sale + stock (15)  
6. Homepage banner + shelf products (10)  
7. Discount code + low stock + sales dates (10)
