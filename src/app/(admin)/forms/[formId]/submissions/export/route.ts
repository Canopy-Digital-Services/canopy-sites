import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { getOwnedForm } from "@/lib/data-access/forms";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  try {
    const userId = await getCurrentUserId();

    // Verify ownership
    let form;
    try {
      form = await getOwnedForm(formId, userId);
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
    });

    if (submissions.length === 0) {
      return new NextResponse("No submissions to export", { status: 404 });
    }

    // Collect all unique keys from all submissions
    const allKeys = new Set<string>();
    submissions.forEach((submission) => {
      const data = submission.data as Record<string, any>;
      Object.keys(data).forEach((key) => allKeys.add(key));
    });

    const dataKeys = Array.from(allKeys);
    const headers = [
      "ID",
      "Date",
      "Status",
      "Is Spam",
      ...dataKeys,
      "IP Hash",
      "User Agent",
      "Referrer",
      "Origin",
    ];

    // Build CSV
    let csv = headers.map((h) => `"${h}"`).join(",") + "\n";

    submissions.forEach((submission) => {
      const data = submission.data as Record<string, any>;
      const meta = submission.meta as Record<string, any>;

      const row = [
        submission.id,
        submission.createdAt.toISOString(),
        submission.status,
        submission.isSpam ? "Yes" : "No",
        ...dataKeys.map((key) => {
          const value = data[key];
          if (value === null || value === undefined) return "";
          return typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
        }),
        meta.ipHash || "",
        meta.userAgent || "",
        meta.referrer || "",
        meta.origin || "",
      ];

      // Escape and quote each field
      csv +=
        row
          .map((field) => `"${String(field).replace(/"/g, '""')}"`)
          .join(",") + "\n";
    });

    const filename = `${form.slug}-submissions-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
