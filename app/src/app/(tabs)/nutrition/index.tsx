import { useAuthStore } from '@/auth';
import {
  MemberNutritionScreen,
  NutritionScreen,
  StudentNutritionScreen,
} from '@/modules/nutrition/routes/index';

export default function NutritionRoute() {
  const { accountType } = useAuthStore();

  if (accountType === 'specialist') return <NutritionScreen />;
  if (accountType === 'member') return <MemberNutritionScreen />;
  return <StudentNutritionScreen />;
}
