import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ONBOARDING_KEY = 'onboardingCompleted';

/**
 * GET /api/settings/onboarding
 * Returns onboarding completion status
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: ONBOARDING_KEY },
    });

    return NextResponse.json({
      onboardingCompleted: setting?.value === true,
    });
  } catch (error) {
    console.error('Failed to fetch onboarding status:', error);
    // Return false on error (safe default - show onboarding)
    return NextResponse.json({ onboardingCompleted: false });
  }
}

/**
 * POST /api/settings/onboarding
 * Marks onboarding as completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const completed = body.completed ?? true;

    await prisma.setting.upsert({
      where: { key: ONBOARDING_KEY },
      create: { key: ONBOARDING_KEY, value: completed },
      update: { value: completed },
    });

    return NextResponse.json({ success: true, onboardingCompleted: completed });
  } catch (error) {
    console.error('Failed to save onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding status' },
      { status: 500 }
    );
  }
}
