import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { findOrder } from "../../../server/queries.ts";
import { getViewer } from "../../../server/viewer.ts";
import { OrderStatus } from "./OrderStatus.tsx";

export const metadata: Metadata = { title: "Your order" };

// Already written: someone else's order is a 404, the same as one that doesn't exist.
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=/orders/${id}`);
  const order = /^[1-9]\d*$/.test(id) ? await findOrder(Number(id), viewer) : null;
  if (!order) notFound();
  return <OrderStatus initial={order} sandbox={process.env.NODE_ENV !== "production"} />;
}
