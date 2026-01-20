import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string; formId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Verify ownership
    const site = await prisma.site.findFirst({
      where: {
        id: params.siteId,
        userId,
      },
      include: {
        forms: {
          where: { id: params.formId },
          include: {
            submissions: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!site || site.forms.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const form = site.forms[0];
    const submissions = form.submissions;

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
      csv += row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",") + "\n";
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
