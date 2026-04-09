"use client";

import { supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";

export interface AnalyticsData {
  userMetrics: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
    usersByType: {
      admin: number;
      professional: number;
      managed_student: number;
      autonomous_student: number;
    };
  };
  growthMetrics: {
    dailyGrowth: Array<{ date: string; count: number }>;
    monthlyGrowth: Array<{ month: string; count: number }>;
  };
  engagementMetrics: {
    totalWorkouts: number;
    totalDietPlans: number;
    avgWorkoutsPerProfessional: number;
    avgStudentsPerProfessional: number;
  };
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      // 1. Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 2. Get new users this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth.toISOString());

      // 3. Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: activeUsersLast7Days } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_login_at", sevenDaysAgo.toISOString());

      // 4. Get active users (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsersLast30Days } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("last_login_at", thirtyDaysAgo.toISOString());

      // 5. Get users by type
      const fetchCountByType = async (type: string) => {
        const { count } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_type", type);
        return count || 0;
      };

      const [adminCount, professionalCount, managedCount, autonomousCount] = await Promise.all([
        fetchCountByType("admin"),
        fetchCountByType("professional"),
        fetchCountByType("managed_student"),
        fetchCountByType("autonomous_student"),
      ]);

      // 6. Get workout and diet plan counts
      const { count: totalWorkoutsQuery } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true });

      const { count: totalDietPlansQuery } = await supabase
        .from("diet_plans")
        .select("*", { count: "exact", head: true });

      const totalWorkouts = totalWorkoutsQuery || 0;
      const totalDietPlans = totalDietPlansQuery || 0;

      return {
        userMetrics: {
          totalUsers: totalUsers || 0,
          newUsersThisMonth: newUsersThisMonth || 0,
          activeUsersLast7Days: activeUsersLast7Days || 0,
          activeUsersLast30Days: activeUsersLast30Days || 0,
          usersByType: {
            admin: adminCount,
            professional: professionalCount,
            managed_student: managedCount,
            autonomous_student: autonomousCount,
          },
        },
        growthMetrics: {
          dailyGrowth: [], // Placeholder for now
          monthlyGrowth: [], // Placeholder for now
        },
        engagementMetrics: {
          totalWorkouts,
          totalDietPlans,
          avgWorkoutsPerProfessional: professionalCount
            ? Math.round(totalWorkouts / professionalCount)
            : 0,
          avgStudentsPerProfessional: professionalCount
            ? Math.round(managedCount / professionalCount)
            : 0,
        },
      };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
