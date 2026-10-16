import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSoleMembership } from "@/lib/data-access/memberships";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const membership = await getSoleMembership(session.user.id);
  if (!membership) return new NextResponse(null, { status: 401 });

  const form = await prisma.form.findFirst({
    where: { id: formId, accountId: membership.accountId },
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
