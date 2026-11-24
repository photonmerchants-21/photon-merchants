# Contract Acceptance List (Phase 8.6)

Final payment (KES 30,000) is due when **all** checks pass on the **public** site.  
Local/sandbox status below — update Pass/Date when verified on the client domain.

| Check | Done when | Local / sandbox | Live site |
| --- | --- | --- | --- |
| **Browse** | Product found by category and by search on a phone | Pass | Pending domain |
| **Checkout** | Guest and registered customer both reach payment | Pass | Pending |
| **Pay** | M-Pesa STK confirms an order once | Sandbox simulate Pass · Live Daraja Pending | Pending |
| **Failed payment** | Failed payment does not mark paid and does not reduce stock | Pass (simulate fail) | Pending |
| **Catalog** | Staff add product with images, sale price, stock | Pass (Medusa Products) | Pending |
| **Stock** | Stock drops only after payment is confirmed | Pass (decrement on paid) | Pending |
| **Tracking** | Staff set each status; customer sees current status | Pass | Pending |
| **Delivery** | Fee matches area; collection available | Pass | Pending |
| **Live site** | Shop loads over HTTPS on client domain | Pending (needs domain) | Pending |

## Gate notes

- Phase 5 **live Daraja** remains parked until client credentials.  
- Phase 8.1 **domain + HTTPS** is documented in [DEPLOY.md](./DEPLOY.md); mark Live site Pass after DNS cutover.  
- Re-run this list on production after deploy; keep a dated copy for the warranty start.

## Local verification (2026-11-23)

- `scripts/backup-db.sh` wrote a custom dump under `backups/`.  
- Restore into `photon_medusa_restore` succeeded (`product` count 17).  
- Simulate **fail** → no stock change; simulate **success** → stock −1 once; retry pay → idempotent.
