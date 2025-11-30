import { useAuthStore } from '@/auth';
import { NutritionScreen, StudentNutritionScreen } from '@/modules/nutrition/routes/index';

export default function NutritionRoute() {
  const { accountType } = useAuthStore();

  if (accountType === 'professional') {
    return <NutritionScreen />;
  }

  return <StudentNutritionScreen />;
}
