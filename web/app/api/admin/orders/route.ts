import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCreateSecret } from "@/lib/auth/secrets";

type OrderRow = {
  id: string;
  created_at: string;
  amount_inr: number;
  status: string;
  buyer_id: string;
  item_id: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  item_name: string | null;
  item_image_display_url: string | null;
  stream_slug: string | null;
  stream_title: string | null;
  shipping_address: string | null;
};

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function normalizeShippingAddress(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const text = value.trim();
    return text || null;
  }
  if (typeof value !== "object") return null;

  const src = value as Record<string, unknown>;
  const candidates = [
    src.line1,
    src.address,
    src.full_address,
    src.shipping_address,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function toCsv(rows: OrderRow[]): string {
  const header = [
    "order_id",
    "created_at",
    "amount_inr",
    "buyer_name",
    "buyer_phone",
    "item_name",
    "stream_title",
    "stream_slug",
    "item_image_url",
    "shipping_address",
  ];
  const lines = rows.map((row) =>
    [
      row.id,
      row.created_at,
      row.amount_inr,
      row.buyer_name,
      row.buyer_phone,
      row.item_name,
      row.stream_title,
      row.stream_slug,
      row.item_image_display_url,
      row.shipping_address,
    ]
      .map(csvEscape)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

/**
 * GET /api/admin/orders
 * Admin-only paid orders feed.
 * Query params:
 *   - format=csv (optional): export as CSV for Excel.
 *   - limit (optional): max rows, defaults to 50.
 */
export async function GET(req: Request) {
  const denied = requireCreateSecret(req);
  if (denied) return denied;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ demo: true, orders: [] });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const limitParam = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 50;

  const { data: orderRows, error: orderError } = await admin
    .from("orders")
    .select("id, created_at, amount_inr, status, buyer_id, item_id, shipping_snapshot")
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const orders = orderRows || [];
  if (!orders.length) {
    if (format === "csv") {
      return new NextResponse(toCsv([]), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="jini-recent-orders.csv"',
        },
      });
    }
    return NextResponse.json({ orders: [] });
  }

  const buyerIds = [...new Set(orders.map((o) => o.buyer_id))];
  const itemIds = [...new Set(orders.map((o) => o.item_id))];

  const [{ data: profiles }, { data: items, error: itemsError }] = await Promise.all([
    admin.from("profiles").select("id, full_name, phone").in("id", buyerIds),
    admin
      .from("stream_items")
      .select("id, name, image_display_url, stream_id")
      .in("id", itemIds),
  ]);
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const streamIds = [...new Set((items || []).map((i) => i.stream_id))];
  const { data: streams, error: streamsError } = await admin
    .from("live_streams")
    .select("id, slug, title")
    .in("id", streamIds);
  if (streamsError) {
    return NextResponse.json({ error: streamsError.message }, { status: 500 });
  }

  const profileById = new Map((profiles || []).map((p) => [p.id, p]));
  const itemById = new Map((items || []).map((i) => [i.id, i]));
  const streamById = new Map((streams || []).map((s) => [s.id, s]));

  const hydrated: OrderRow[] = orders.map((order) => {
    const profile = profileById.get(order.buyer_id);
    const item = itemById.get(order.item_id);
    const stream = item ? streamById.get(item.stream_id) : null;
    return {
      id: order.id,
      created_at: order.created_at,
      amount_inr: order.amount_inr,
      status: order.status,
      buyer_id: order.buyer_id,
      item_id: order.item_id,
      buyer_name: profile?.full_name || null,
      buyer_phone: profile?.phone || null,
      item_name: item?.name || null,
      item_image_display_url: item?.image_display_url || null,
      stream_slug: stream?.slug || null,
      stream_title: stream?.title || null,
      shipping_address: normalizeShippingAddress(order.shipping_snapshot),
    };
  });

  if (format === "csv") {
    return new NextResponse(toCsv(hydrated), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="jini-recent-orders.csv"',
      },
    });
  }

  return NextResponse.json({ orders: hydrated });
}
