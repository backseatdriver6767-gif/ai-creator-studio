import { NextResponse } from "next/server";
import * as arcads from "@/lib/services/arcads";

export async function GET() {
  try {
    const actors = await arcads.listActors();
    return NextResponse.json(actors);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list actors" },
      { status: 500 }
    );
  }
}
