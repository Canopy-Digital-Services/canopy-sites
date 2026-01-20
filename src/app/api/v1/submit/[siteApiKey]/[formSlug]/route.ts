import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { queueEmailNotification } from "@/lib/email-queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteApiKey: string; formSlug: string }> }
) {
  try {
    const { siteApiKey, formSlug } = await params;

    // 1. Lookup Site by apiKey
    const site = await prisma.site.findUnique({
      where: { apiKey: siteApiKey },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // 2. Lookup Form by siteId + formSlug
    const form = await prisma.form.findUnique({
      where: {
        siteId_slug: {
          siteId: site.id,
          slug: formSlug,
        },
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: "Form not found" },
        { status: 404 }
      );
    }

    // 3. Validate Origin header
    const origin = request.headers.get("origin");
    if (!validateOrigin(origin, site.domain)) {
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403 }
      );
    }

    // Get client IP and hash it
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Check rate limiting
    if (isRateLimited(ipHash)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Parse request body
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let formData: Record<string, any>;
    try {
      formData = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    // 4. Check honeypot field
    let isSpam = false;
    if (form.honeypotField && formData[form.honeypotField]) {
      // Honeypot field was filled - likely spam
      isSpam = true;
    }

    // 5. Prepare metadata
    const meta = {
      ipHash,
      userAgent: request.headers.get("user-agent") || "unknown",
      referrer: request.headers.get("referer") || null,
      origin: origin || null,
    };

    // 6. Save submission
    const submission = await prisma.submission.create({
      data: {
        formId: form.id,
        data: formData,
        meta,
        isSpam,
        status: "NEW",
      },
    });

    // 7. Queue email notification (async, don't block response)
    if (!isSpam && form.notifyEmails.length > 0) {
      queueEmailNotification(submission, form, site);
    }

    // 8. Return success
    return NextResponse.json(
      {
        success: true,
        id: submission.id,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
