"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "../../../components/AuthForm";

function ResetInner() {
  const params = useSearchParams();
  return (
    <ResetPasswordForm
      email={params.get("email") || ""}
      token={params.get("token") || ""}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-10 text-cream/60">Loading…</div>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
