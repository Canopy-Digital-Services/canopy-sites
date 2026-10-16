import { NextRequest, NextResponse } from "next/server";
import { getOwnedForm } from "@/lib/data-access/forms";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  try {
    const { getCurrentAccountId } = await import("@/lib/auth-utils");
    const accountId = await getCurrentAccountId();

    // Verify ownership
    let form;
    try {
      form = await getOwnedForm(formId, accountId);
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

    // Get format from query params (default to csv)
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    const dateString = new Date().toISOString().split("T")[0];

    if (format === "json") {
      // Build JSON export
      const jsonData = submissions.map((submission) => {
        const meta = submission.meta as { ipHash?: string; userAgent?: string; referrer?: string; origin?: string };
        return {
          id: submission.id,
          createdAt: submission.createdAt.toISOString(),
          status: submission.status,
          isSpam: submission.isSpam,
          data: submission.data,
          meta: {
            ipHash: meta.ipHash || null,
            userAgent: meta.userAgent || null,
            referrer: meta.referrer || null,
            origin: meta.origin || null,
          },
        };
      });

      const filename = `${form.slug}-submissions-${dateString}.json`;

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Build composite field map for CSV column expansion
    const compositeFields = new Map<string, { type: string; parts: string[] }>();
    for (const field of form.fields) {
      if (field.type === "NAME") {
        const opts = field.options as { parts?: string[] } | null;
        compositeFields.set(field.name, {
          type: "NAME",
          parts: opts?.parts || ["first", "last"],
        });
      } else if (field.type === "ADDRESS") {
        const opts = field.options as { showLine2?: boolean } | null;
        const parts = ["line1"];
        if (opts?.showLine2 !== false) parts.push("line2");
        parts.push("city", "region", "postalCode");
        compositeFields.set(field.name, { type: "ADDRESS", parts });
      }
    }

    // Build CSV export (default)
    const allKeys = new Set<string>();
    submissions.forEach((submission) => {
      const data = submission.data as Record<string, unknown>;
      Object.keys(data).forEach((key) => allKeys.add(key));
    });

    // Expand composite keys into separate columns
    const dataKeys = Array.from(allKeys);
    type CsvColumn = { header: string; getValue: (data: Record<string, unknown>) => string };
    const columns: CsvColumn[] = [];

    for (const key of dataKeys) {
      const composite = compositeFields.get(key);
      if (composite) {
        for (const part of composite.parts) {
          columns.push({
            header: `${key}_${part}`,
            getValue: (data) => {
              const obj = data[key] as Record<string, unknown> | undefined;
              return obj?.[part] != null ? String(obj[part]) : "";
            },
          });
        }
      } else {
        columns.push({
          header: key,
          getValue: (data) => {
            const value = data[key];
            if (value === null || value === undefined) return "";
            return typeof value === "object" ? JSON.stringify(value) : String(value);
          },
        });
      }
    }

    const headers = [
      "ID",
      "Date",
      "Status",
      "Is Spam",
      ...columns.map((c) => c.header),
      "IP Hash",
      "User Agent",
      "Referrer",
      "Origin",
    ];

    let csv = headers.map((h) => `"${h}"`).join(",") + "\n";

    submissions.forEach((submission) => {
      const data = submission.data as Record<string, unknown>;
      const meta = submission.meta as { ipHash?: string; userAgent?: string; referrer?: string; origin?: string };

      const row = [
        submission.id,
        submission.createdAt.toISOString(),
        submission.status,
        submission.isSpam ? "Yes" : "No",
        ...columns.map((col) => col.getValue(data)),
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

    const filename = `${form.slug}-submissions-${dateString}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
