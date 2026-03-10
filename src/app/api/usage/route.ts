import { NextResponse } from "next/server";

export async function GET() {
  const apiStatus = {
    meta: {
      configured: !!process.env.META_APP_ID && !!process.env.META_APP_SECRET,
      name: "Meta (Instagram)",
    },
    late: { configured: !!process.env.LATE_API_KEY, name: "Late.dev" },
    manychat: { configured: !!process.env.MANYCHAT_API_TOKEN, name: "ManyChat" },
    stripe: { configured: !!process.env.STRIPE_SECRET_KEY, name: "Stripe" },
  };

  return NextResponse.json({
    apiStatus,
  });
}
