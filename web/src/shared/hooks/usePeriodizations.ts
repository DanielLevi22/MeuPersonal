"use client";

import { supabase } from "@meupersonal/supabase";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type PeriodizationObjective =
  | "hypertrophy"
  | "strength"
  | "endurance"
  | "weight_loss"
  | "conditioning"
  | "general_fitness";

export type PeriodizationStatus = "planned" | "active" | "completed" | "cancelled";

export interface Periodization {
  id: string;
  student_id: string;
  personal_id: string;
  professional_id?: string;
  name: string;
  objective: PeriodizationObjective;
  start_date: string;
  end_date: string;
  status: PeriodizationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
  training_plans_count?: number;
}

export function usePeriodizations() {
  const [userId, setUserId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", user.id)
          .single();
        if (profile) {
          setAccountType(profile.account_type);
        }
      }
    };
    getUser();
  }, []);

  return useQuery({
    queryKey: ["periodizations", userId, accountType],
    queryFn: async () => {
      if (!userId || !accountType) return [];

      // 1. Fetch periodizations
      let query = supabase
        .from("training_periodizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (accountType === "professional") {
        query = query.eq("professional_id", userId);
      } else {
        query = query.eq("student_id", userId);
      }

      const { data: periodizations, error } = await query;
      if (error) throw error;
      if (!periodizations || periodizations.length === 0) return [];

      // 2. Fetch student profiles separately (same as mobile)
      const studentIds = [...new Set(periodizations.map((p) => p.student_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // 3. Fetch training_plans counts per periodization
      const periodizationIds = periodizations.map((p) => p.id);
      const { data: plans } = await supabase
        .from("training_plans")
        .select("periodization_id")
        .in("periodization_id", periodizationIds);
      const countsMap = new Map<string, number>();
      plans?.forEach((plan) => {
        countsMap.set(plan.periodization_id, (countsMap.get(plan.periodization_id) ?? 0) + 1);
      });

      return periodizations.map((p) => ({
        ...p,
        student: profileMap.get(p.student_id),
        training_plans_count: countsMap.get(p.id) ?? 0,
      })) as Periodization[];
    },
    enabled: !!userId && !!accountType,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePeriodization(id: string) {
  return useQuery({
    queryKey: ["periodization", id],
    queryFn: async () => {
      // 1. Fetch periodization
      const { data, error } = await supabase
        .from("training_periodizations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // 2. Fetch student profile separately
      const { data: student } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", data.student_id)
        .maybeSingle();

      // 3. Count training plans
      const { count } = await supabase
        .from("training_plans")
        .select("*", { count: "exact", head: true })
        .eq("periodization_id", id);

      return {
        ...data,
        student: student ?? undefined,
        training_plans_count: count ?? 0,
      } as Periodization;
    },
    enabled: !!id,
  });
}

export function useActivePeriodization(studentId: string) {
  return useQuery({
    queryKey: ["active-periodization", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_periodizations")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "active")
        .order("start_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { data: student } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", data.student_id)
        .maybeSingle();

      const { count } = await supabase
        .from("training_plans")
        .select("*", { count: "exact", head: true })
        .eq("periodization_id", data.id);

      return {
        ...data,
        student: student ?? undefined,
        training_plans_count: count ?? 0,
      } as Periodization;
    },
    enabled: !!studentId,
  });
}
