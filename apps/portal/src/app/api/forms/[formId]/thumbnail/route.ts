import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { sessionAccountId } from "@/lib/data-access/memberships";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  const session = await getSession();
  // The session's account (a client's, while the operator acts as one); none, no thumbnail.
  const accountId = session ? sessionAccountId(session) : null;
  if (!accountId) return new NextResponse(null, { status: 401 });

  const form = await prisma.form.findFirst({
    where: { id: formId, accountId },
    select: { thumbnail: true },
  });

  if (!form?.thumbnail) return new NextResponse(null, { status: 404 });

  // Revalidate on every load: the editor recaptures thumbnails at the same
  // URL, and a max-age kept showing the old image after returning to the list.
  const etag = `"${createHash("sha1").update(form.thumbnail).digest("hex")}"`;
  const headers = { ETag: etag, "Cache-Control": "private, no-cache" };

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  return new NextResponse(form.thumbnail, {
    headers: { ...headers, "Content-Type": "image/jpeg" },
  });
}
