import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentAccountId } from "@/lib/auth-utils";
import { getHomePath } from "@/lib/product";

export default async function Home() {
  const session = await auth();
  
  if (session?.user?.id) {
    redirect(await getHomePath(await getCurrentAccountId()));
  } else {
    redirect("/login");
  }
}
