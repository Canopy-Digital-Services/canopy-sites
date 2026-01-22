import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getUserSites } from "@/lib/data-access/forms";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const sites = await getUserSites(userId);

    return NextResponse.json({ sites });
  } catch (error) {
    console.error("Failed to fetch sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}
