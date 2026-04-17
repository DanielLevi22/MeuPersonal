import type { UserContext } from "./abilities";
import { supabase } from "./client";
import type { AccountStatus, AccountType, ServiceType } from "./types";

export async function getUserContextJWT(userId: string): Promise<UserContext> {
  // Check JWT claims first — avoids RLS issues for admin fast path
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const jwtClaims = session?.user?.app_metadata || {};

  if (jwtClaims.account_type === "admin") {
    return { accountType: "admin" as AccountType };
  }

  // Fetch profile with retry — handles race condition on fresh signup
  let user = null;
  let userError = null;
  let attempts = 0;

  while (!user && attempts < 8) {
    attempts++;
    const result = await supabase
      .from("profiles")
      .select("account_type, account_status")
      .eq("id", userId)
      .single();

    user = result.data;
    userError = result.error;

    if (!user && attempts < 8) {
      await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
    }
  }

  if (userError || !user) throw new Error("User not found");

  const context: UserContext = {
    accountType: user.account_type as AccountType,
    accountStatus: user.account_status as AccountStatus,
  };

  if (user.account_type === "specialist") {
    const { data: services } = await supabase
      .from("specialist_services")
      .select("service_type")
      .eq("specialist_id", userId);

    context.services = (services?.map((s) => s.service_type) || []) as ServiceType[];
  }

  return context;
}
