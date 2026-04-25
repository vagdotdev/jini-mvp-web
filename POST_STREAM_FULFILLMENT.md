# Post-Stream Fulfillment

After a Jini live session ends, the host needs to see every paid order alongside the buyer's shipping address so the items can be packed and dispatched.

---

## Problem

Right now there is no way to view completed orders after a stream ends. All the data exists in Supabase (`orders`, `stream_items`, `profiles`) but nothing surfaces it for the host.

---

## What we need

### 1. Post-stream order export page

A protected page (same `JINI_STREAM_CREATE_SECRET` gate as `/admin`) at:

```
/admin/orders/[slug]
```

Accessible directly from the "Recent streams" panel on `/admin` — add a **View orders** button next to each ended stream.

**Columns to show:**

| Field | Source |
|---|---|
| Item name | `stream_items.name` |
| Size | `stream_items.size_label` |
| Price | `stream_items.price_inr` |
| Buyer name | `profiles.full_name` |
| Phone | `profiles.phone` |
| Shipping address | `profiles.default_shipping_address` (JSON) |
| Payment status | `orders.status` |
| Payment ref | `orders.upi_txn_ref` |
| Order time | `orders.created_at` |

Filter: `orders.status = 'paid'` only (skip failed/expired/refunded).

### 2. CSV download

A **Download CSV** button that exports all rows above as a `.csv` file so the host can open it in Google Sheets / Excel and hand it to a packer or courier partner.

Format each address field as plain text (flatten JSON → `line1, city, pincode`).

### 3. API route

```
GET /api/orders?slug=[slug]
```

- Requires `x-jini-create-secret` header.
- Joins `orders → stream_items → live_streams` and `orders → profiles`.
- Returns only `paid` orders for the given stream slug.
- Used by the page above and the CSV export.

---

## Schema notes (no migrations needed yet)

All required tables already exist:

- `orders` — `item_id`, `buyer_id`, `status`, `upi_txn_ref`, `amount_inr`, `created_at`
- `stream_items` — `stream_id`, `name`, `price_inr`, `size_label`
- `live_streams` — `slug`
- `profiles` — `full_name`, `phone`, `default_shipping_address` (jsonb)

The join chain is:

```
live_streams.slug
  → stream_items.stream_id = live_streams.id
    → orders.item_id = stream_items.id
      → profiles.id = orders.buyer_id
```

---

## Nice-to-haves (later)

- **Mark as dispatched** — add a `dispatched_at` column to `orders` and a button on the fulfillment page.
- **WhatsApp receipt** — send buyer a message with tracking number once dispatched.
- **Multi-stream view** — `/admin/orders` (no slug) to see all unfulfilled orders across every stream.
- **Inventory count** — show how many units of each item type were sold in a session.

---

## Implementation order

1. `GET /api/orders?slug=` route (admin-gated).
2. `/admin/orders/[slug]` page: table + CSV download button.
3. **View orders** button on each ended stream row in `/admin` Recent streams panel.
4. (Later) dispatched status + WhatsApp.
