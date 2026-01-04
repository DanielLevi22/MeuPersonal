import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AppleHealthKit, {
    HealthKitPermissions,
    HealthValue,
} from 'react-native-health';
import {
    getGrantedPermissions,
    initialize,
    readRecords,
    requestPermission
} from 'react-native-health-connect';

export interface HealthData {
  steps: number;
  calories: number;
  loading: boolean;
  error: string | null;
}

export function useHealthData() {
  const [data, setData] = useState<HealthData>({
    steps: 0,
    calories: 0,
    loading: true,
    error: null,
  });

  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    initHealthKit();

    // Refetch when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refetch();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const initHealthKit = async () => {
    if (Platform.OS === 'ios') {
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          ],
          write: [],
        },
      } as HealthKitPermissions;

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.log('[HealthKit] Error initializing:', error);
          setData((prev) => ({ ...prev, error, loading: false }));
          return;
        }
        setHasPermissions(true);
        fetchIOSData();
      });
    } else if (Platform.OS === 'android') {
      try {
        const isInitialized = await initialize();
        if (!isInitialized) {
            if (__DEV__) {
              console.log('[HealthConnect] Not initialized. Using MOCK data for development.');
              setData({ steps: 7543, calories: 450, loading: false, error: null });
              setHasPermissions(true);
            } else {
              setData((prev) => ({ ...prev, error: 'Health Connect not initialized', loading: false }));
            }
            return;
        }
        
        await requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
        ]);

        const granted = await getGrantedPermissions();
        const hasSteps = granted.some(p => p.recordType === 'Steps' && p.accessType === 'read');
        const hasCalories = granted.some(p => p.recordType === 'ActiveCaloriesBurned' && p.accessType === 'read');

        if (hasSteps && hasCalories) {
          setHasPermissions(true);
          fetchAndroidData();
        } else {
          console.log('[HealthConnect] Permissions denied');
          if (__DEV__) {
             console.log('[HealthConnect] Permissions denied. Using MOCK data for development.');
             setData({ steps: 7543, calories: 450, loading: false, error: null });
             setHasPermissions(true);
          } else {
             setData((prev) => ({ ...prev, error: 'Permissions denied', loading: false }));
          }
        }
      } catch (err: any) {
        console.log('[HealthConnect] Error initializing:', err);
        setData((prev) => ({ ...prev, error: err.message, loading: false }));
      }
    }
  };

  const fetchIOSData = () => {
    const options = {
      date: new Date().toISOString(), // today
      includeManuallyAdded: true,
    };

    AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
      if (err) {
        console.log('[HealthKit] Error fetching steps:', err);
        return;
      }
      setData((prev) => ({ ...prev, steps: results.value }));
    });

    AppleHealthKit.getActiveEnergyBurned(
      options,
      (err: string, results: HealthValue[]) => {
        if (err) {
          console.log('[HealthKit] Error fetching calories:', err);
          return;
        }
        // results is an array of samples, we need to sum them up or if it's aggregated, check the structure.
        // Usually for daily aggregate, we might want to use getActiveEnergyBurned with different options or sum up.
        // However, if results is HealthValue[], let's sum it.
        const totalCalories = results.reduce((acc, curr) => acc + curr.value, 0);
        setData((prev) => ({ ...prev, calories: totalCalories, loading: false }));
      }
    );
  };

  const fetchAndroidData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stepsResult = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: today.toISOString(),
          endTime: tomorrow.toISOString(),
        },
      });

      const totalSteps = stepsResult.records.reduce((acc, record) => acc + record.count, 0);

      const caloriesResult = await readRecords('ActiveCaloriesBurned', {
        timeRangeFilter: {
          operator: 'between',
          startTime: today.toISOString(),
          endTime: tomorrow.toISOString(),
        },
      });

      const totalCalories = caloriesResult.records.reduce(
        (acc, record) => acc + record.energy.inKilocalories,
        0
      );

      setData({
        steps: totalSteps,
        calories: Math.round(totalCalories),
        loading: false,
        error: null,
      });
    } catch (err: any) {
      console.log('[HealthConnect] Error fetching data:', err);
      setData((prev) => ({ ...prev, error: err.message, loading: false }));
    }
  };

  const refetch = async () => {
    setData((prev) => ({ ...prev, loading: true }));
    if (Platform.OS === 'ios') {
      fetchIOSData();
    } else {
      const granted = await getGrantedPermissions();
      const hasSteps = granted.some(p => p.recordType === 'Steps' && p.accessType === 'read');
      const hasCalories = granted.some(p => p.recordType === 'ActiveCaloriesBurned' && p.accessType === 'read');

      if (hasSteps && hasCalories) {
        fetchAndroidData();
      } else {
        setData((prev) => ({ ...prev, loading: false }));
      }
    }
  };

  return { ...data, refetch, hasPermissions };
}
