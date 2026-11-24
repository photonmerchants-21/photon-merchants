import type { Metadata } from "next";
import { ForgotPasswordForm } from "../../../components/AuthForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
