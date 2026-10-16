import { redirect } from "next/navigation";
import { getSignedInHomePath } from "@/lib/auth-utils";

export default async function Home() {
  redirect((await getSignedInHomePath()) ?? "/login");
}
