import { NextResponse } from "next/server";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getUserSites } from "@/lib/data-access/forms";

export async function GET() {
  try {
    const accountId = await getCurrentAccountId();
    const sites = await getUserSites(accountId);

    return NextResponse.json({ sites });
  } catch (error) {
    console.error("Failed to fetch sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}
