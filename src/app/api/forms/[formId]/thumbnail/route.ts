import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  const session = await auth();
  if (!session?.user?.id) return new NextResponse(null, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { accountId: true },
  });
  if (!user) return new NextResponse(null, { status: 401 });

  const form = await prisma.form.findFirst({
    where: { id: formId, accountId: user.accountId },
    select: { thumbnail: true },
  });

  if (!form?.thumbnail) return new NextResponse(null, { status: 404 });

  return new NextResponse(form.thumbnail, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
