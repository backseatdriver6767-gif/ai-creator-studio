import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export async function createProduct(
  name: string,
  priceInCents: number,
  currency: string = "usd"
): Promise<{ productId: string; priceId: string }> {
  const stripe = getStripe();
  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceInCents,
    currency,
  });
  return { productId: product.id, priceId: price.id };
}

export async function createPaymentLink(
  priceId: string
): Promise<{ url: string; id: string }> {
  const stripe = getStripe();
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: priceId, quantity: 1 }],
  });
  return { url: link.url, id: link.id };
}

export async function createCheckoutSession(
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });
  return { sessionId: session.id, url: session.url! };
}

export async function getSession(sessionId: string) {
  return getStripe().checkout.sessions.retrieve(sessionId);
}

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
