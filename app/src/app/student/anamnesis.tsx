import { useAuthStore } from '@/modules/auth/store/authStore';
import AdaptiveAnamnesisScreen from '../../modules/assessment/screens/AdaptiveAnamnesisScreen';
import AnamnesisWizardScreen from '../../modules/assessment/screens/AnamnesisWizardScreen';

export default function AnamnesisRoute() {
  const accountType = useAuthStore((s) => s.accountType);
  return accountType === 'member' ? <AdaptiveAnamnesisScreen /> : <AnamnesisWizardScreen />;
}
