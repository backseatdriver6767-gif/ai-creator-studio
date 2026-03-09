import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent } from "@/lib/services/stripe-payments";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const event = constructWebhookEvent(body, signature);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const productId = session.metadata?.productId;

        if (productId) {
          await prisma.order.create({
            data: {
              productId,
              stripeSessionId: session.id,
              stripePaymentId: session.payment_intent as string,
              amount: session.amount_total || 0,
              currency: session.currency || "usd",
              status: "COMPLETED",
              customerEmail: session.customer_details?.email,
              customerName: session.customer_details?.name,
              source: session.metadata?.source,
              manychatContactId: session.metadata?.manychatContactId,
            },
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;
        const sessionId = pi.metadata?.sessionId;

        if (sessionId) {
          await prisma.order.updateMany({
            where: { stripeSessionId: sessionId },
            data: { status: "FAILED" },
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntent = charge.payment_intent as string;

        if (paymentIntent) {
          await prisma.order.updateMany({
            where: { stripePaymentId: paymentIntent },
            data: { status: "REFUNDED" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 }
    );
  }
}
