import "@/styles/auth.css";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

function AuthFormFallback() {
  return (
    <div className="auth-shell">
      <div className="auth-form-column">
        <p className="auth-muted">Chargement…</p>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AuthFormFallback />}>
      <AuthShell>{children}</AuthShell>
    </Suspense>
  );
}
