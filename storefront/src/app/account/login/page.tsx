import type { Metadata } from "next";
import { LoginForm } from "../../../components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return <LoginForm />;
}
