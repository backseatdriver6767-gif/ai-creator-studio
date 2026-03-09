import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as stripePayments from "@/lib/services/stripe-payments";

// POST - create a Stripe checkout session for this product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (!product.stripePriceId) {
    return NextResponse.json({ error: "Product not configured in Stripe" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  const session = await stripePayments.createCheckoutSession(
    product.stripePriceId,
    `${appUrl}/products?success=true`,
    `${appUrl}/products?canceled=true`,
    {
      productId: product.id,
      source: body.source || "direct",
      manychatContactId: body.manychatContactId || "",
    }
  );

  // Update the product's checkout URL with the latest session URL
  await prisma.product.update({
    where: { id },
    data: { checkoutUrl: session.url },
  });

  return NextResponse.json({ url: session.url, sessionId: session.sessionId });
}
