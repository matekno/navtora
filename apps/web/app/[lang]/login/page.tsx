import { connection } from "next/server";
import { LoginForm } from "@/components/LoginForm";
import { adminEnabled } from "@/lib/auth";

export default async function LoginPage() {
  // ADMIN_PASSWORD is read at runtime, not at build time
  await connection();
  return <LoginForm enabled={adminEnabled()} />;
}
