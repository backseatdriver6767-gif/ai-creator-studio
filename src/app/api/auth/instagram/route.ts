import { NextRequest, NextResponse } from "next/server";
import { getOAuthUrl } from "@/lib/services/instagram";

// GET - redirect to Facebook OAuth dialog
export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "META_APP_ID not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/instagram/callback`;

  // Pass persona ID if provided, so we can link the account after OAuth
  const personaId = req.nextUrl.searchParams.get("personaId") || "";
  const state = personaId;

  const oauthUrl = getOAuthUrl(appId, redirectUri, state);

  return NextResponse.redirect(oauthUrl);
}
