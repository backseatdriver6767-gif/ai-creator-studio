import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getInstagramAccountFromPages,
} from "@/lib/services/instagram";

// GET - handle OAuth callback from Facebook
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const personaId = req.nextUrl.searchParams.get("state") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?error=oauth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`);
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = `${appUrl}/api/auth/instagram/callback`;

  try {
    console.log("[IG OAuth] Got code, exchanging for token...");
    // Step 1: Exchange code for short-lived token
    const { accessToken: shortToken } = await exchangeCodeForToken(
      code,
      appId,
      appSecret,
      redirectUri
    );
    console.log("[IG OAuth] Got short-lived token");

    // Step 2: Exchange for long-lived token (60 days)
    const { accessToken: longToken, expiresIn } = await getLongLivedToken(
      shortToken,
      appId,
      appSecret
    );
    console.log("[IG OAuth] Got long-lived token, expires in", expiresIn, "seconds");

    // Step 3: Discover Instagram Business accounts
    const igAccounts = await getInstagramAccountFromPages(longToken);
    console.log("[IG OAuth] Found IG accounts:", JSON.stringify(igAccounts));

    if (!igAccounts.length) {
      console.log("[IG OAuth] No IG Business accounts found");
      return NextResponse.redirect(
        `${appUrl}/settings?error=no_ig_account&message=No+Instagram+Business+account+found.+Make+sure+your+Instagram+is+a+Business+or+Creator+account+linked+to+a+Facebook+Page.`
      );
    }

    // Step 4: Save each Instagram account
    for (const ig of igAccounts) {
      console.log("[IG OAuth] Saving account:", ig.igUsername, "to persona:", personaId);
      // Find or assign persona
      let targetPersonaId = personaId;
      if (!targetPersonaId) {
        const firstPersona = await prisma.aIPersona.findFirst({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
        });
        targetPersonaId = firstPersona?.id || "";
      }

      if (!targetPersonaId) continue;

      const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

      // Upsert: update if account exists, create if not
      const existing = await prisma.socialAccount.findFirst({
        where: { accountId: ig.igUserId, platform: "INSTAGRAM" },
      });

      if (existing) {
        await prisma.socialAccount.update({
          where: { id: existing.id },
          data: {
            username: ig.igUsername,
            accessToken: longToken,
            tokenExpiry,
            personaId: targetPersonaId,
          },
        });
      } else {
        await prisma.socialAccount.create({
          data: {
            personaId: targetPersonaId,
            platform: "INSTAGRAM",
            username: ig.igUsername,
            accountId: ig.igUserId,
            accessToken: longToken,
            tokenExpiry,
          },
        });
      }
    }

    const connectedCount = igAccounts.length;
    return NextResponse.redirect(
      `${appUrl}/settings?success=instagram&count=${connectedCount}`
    );
  } catch (err) {
    console.error("[IG OAuth] ERROR:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      `${appUrl}/settings?error=oauth_failed&message=${encodeURIComponent(message)}`
    );
  }
}
