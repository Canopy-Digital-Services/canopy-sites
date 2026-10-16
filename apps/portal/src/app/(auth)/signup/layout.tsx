import { redirect } from "next/navigation";
import { signupElsewhere } from "@/lib/product";

/** Signup makes a Forms account, so on the Sites host it moves to the Forms host (PRD D22). */
export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const formsSignup = await signupElsewhere();
  if (formsSignup) redirect(formsSignup);
  return children;
}
