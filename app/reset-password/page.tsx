import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Loader2 } from "lucide-react";

// Mark the page as dynamic to prevent static generation issues
export const dynamic = "force-dynamic";

function ResetPasswordContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="mr-2 h-4 w-4 animate-spin" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}