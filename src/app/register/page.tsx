import type { Metadata } from "next";

import AuthForm from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join BookNook to discover, borrow, and share meaningful reads.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
