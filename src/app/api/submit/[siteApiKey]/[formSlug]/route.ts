import { NextRequest, NextResponse } from "next/server";
import { handlePublicSubmit } from "@/lib/public-submit";

const POST_RATE_LIMIT = { max: 10, windowMs: 60 * 1000 };

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
      allowMethods: "POST, OPTIONS",
      rateLimit: POST_RATE_LIMIT,
    });
  } catch (error) {
    const origin = request.headers.get("origin");
    console.error("Manual submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

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
