import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as stripePayments from "@/lib/services/stripe-payments";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      campaign: { select: { id: true, name: true } },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Create Stripe product + price if Stripe key is configured
  let stripeProductId: string | undefined;
  let stripePriceId: string | undefined;
  let checkoutUrl: string | undefined;

  if (process.env.STRIPE_SECRET_KEY) {
    const stripeResult = await stripePayments.createProduct(
      body.name,
      body.price,
      body.currency || "usd"
    );
    stripeProductId = stripeResult.productId;
    stripePriceId = stripeResult.priceId;

    // Create a reusable Payment Link
    const paymentLink = await stripePayments.createPaymentLink(stripeResult.priceId);
    checkoutUrl = paymentLink.url;
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      currency: body.currency || "usd",
      stripeProductId,
      stripePriceId,
      checkoutUrl,
      campaignId: body.campaignId,
    },
  });

  return NextResponse.json(product, { status: 201 });
}
