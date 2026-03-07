import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  // If already logged in, redirect to admin
  if (session?.user) {
    redirect("/forms");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Forms%20Background.png')" }}
    >
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
