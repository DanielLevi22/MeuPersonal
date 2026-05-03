"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/modules/auth";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accountType, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (accountType !== "student" && accountType !== "member") {
      router.replace("/dashboard");
    }
  }, [accountType, isLoading, user, router]);

  if (isLoading || !user) return null;
  if (accountType !== "student" && accountType !== "member") return null;

  return <>{children}</>;
}
