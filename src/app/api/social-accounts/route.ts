import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as lateSocial from "@/lib/services/late-social";

// GET - list all social accounts (from DB) and optionally sync from Late.dev
export async function GET(req: NextRequest) {
  const sync = req.nextUrl.searchParams.get("sync") === "true";

  // If sync requested and Late API is configured, pull accounts from Late.dev
  if (sync && process.env.LATE_API_KEY) {
    try {
      const lateAccounts = await lateSocial.listAccounts();

      // Upsert each Late.dev account into our DB
      for (const acc of lateAccounts) {
        const platform = acc.platform.toUpperCase();
        const existing = await prisma.socialAccount.findFirst({
          where: { lateAccountId: acc.id },
        });

        if (!existing) {
          // Try to find a persona to attach to (use the first active one as default)
          const defaultPersona = await prisma.aIPersona.findFirst({
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "asc" },
          });

          if (defaultPersona) {
            await prisma.socialAccount.create({
              data: {
                personaId: defaultPersona.id,
                platform: platform as "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "FACEBOOK" | "TWITTER" | "LINKEDIN",
                username: acc.username,
                accountId: acc.id,
                lateAccountId: acc.id,
              },
            });
          }
        } else {
          await prisma.socialAccount.update({
            where: { id: existing.id },
            data: { username: acc.username },
          });
        }
      }
    } catch {
      // Late.dev sync failed - continue with local data
    }
  }

  const accounts = await prisma.socialAccount.findMany({
    include: {
      persona: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

// POST - manually add a social account
export async function POST(req: NextRequest) {
  const body = await req.json();

  const account = await prisma.socialAccount.create({
    data: {
      personaId: body.personaId,
      platform: body.platform,
      username: body.username,
      accountId: body.accountId,
      lateAccountId: body.lateAccountId,
    },
  });

  return NextResponse.json(account, { status: 201 });
}
