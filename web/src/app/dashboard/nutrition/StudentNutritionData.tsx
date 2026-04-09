'use client';

import { useDietPlans, useStudentNutritionStats } from '@/shared/hooks/useNutrition';

interface StudentNutritionDataProps {
  studentId: string;
  children: (data: {
    plans: any[];
    stats: any;
    activePlan: any;
  }) => React.ReactNode;
}

export function StudentNutritionData({ studentId, children }: StudentNutritionDataProps) {
  const { data: plans = [] } = useDietPlans(studentId);
  const { data: stats } = useStudentNutritionStats(studentId);
  
  const activePlan = plans.find(p => p.status === 'active');
  
  return <>{children({ plans, stats, activePlan })}</>;
}
