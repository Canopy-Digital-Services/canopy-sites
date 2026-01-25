import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateOrigin, getClientIP, hashIP } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";
import { handlePublicSubmit } from "@/lib/public-submit";

// This route is dynamic (DB-backed), but we still set short-lived HTTP caching
// headers for better perceived embed performance.
export const dynamic = "force-dynamic";

const GET_RATE_LIMIT = { max: 60, windowMs: 60 * 1000 };
const POST_RATE_LIMIT = { max: 10, windowMs: 60 * 1000 };

function jsonError(message: string, status: number, origin?: string | null) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteApiKey: string; formSlug: string }> }
) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  try {
    const { siteApiKey, formSlug } = await params;

    const site = await prisma.site.findUnique({
      where: { apiKey: siteApiKey },
    });

    if (!site) {
      return jsonError("Site not found", 404, origin);
    }

    if (!validateOrigin(origin, site.domain, referer)) {
      return jsonError("Origin not allowed", 403, origin);
    }

    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);
    if (isRateLimited(ipHash, GET_RATE_LIMIT.max, GET_RATE_LIMIT.windowMs)) {
      return jsonError("Rate limit exceeded", 429, origin);
    }

    const form = await prisma.form.findUnique({
      where: {
        siteId_slug: {
          siteId: site.id,
          slug: formSlug,
        },
      },
      include: {
        fields: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!form) {
      return jsonError("Form not found", 404, origin);
    }

    // Cache form definitions briefly to improve embed load times.
    // - short max-age avoids stale configs after edits
    // - stale-while-revalidate keeps it snappy under load
    const cacheControl = "public, max-age=60, stale-while-revalidate=300";

    return NextResponse.json(
      {
        formId: form.id,
        slug: form.slug,
        fields: form.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          label: field.label,
          placeholder: field.placeholder,
          required: field.required,
          options: field.options,
          validation: field.validation,
        })),
        successMessage: form.successMessage || undefined,
        redirectUrl: form.redirectUrl || undefined,
        defaultTheme: form.defaultTheme || undefined,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": cacheControl,
          Vary: "Origin",
        },
      }
    );
  } catch (error) {
    console.error("Embed fetch error:", error);
    return jsonError("Internal server error", 500, origin);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteApiKey: string; formSlug: string }> }
) {
  try {
    const { siteApiKey, formSlug } = await params;
    return await handlePublicSubmit({
      request,
      siteApiKey,
      formSlug,
      allowMethods: "GET, POST, OPTIONS",
      rateLimit: POST_RATE_LIMIT,
    });
  } catch (error) {
    const origin = request.headers.get("origin");
    console.error("Embed submit error:", error);
    return jsonError("Internal server error", 500, origin);
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
