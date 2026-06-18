import { useEffect, useState } from 'react';
import { getStoreActiveSubscription, getDaysUntilExpiry } from '@/services/subscription-service';
import type { StorePackageAssignment } from '@/lib/subscription-types';

interface UseSubscriptionStatusReturn {
  subscription: StorePackageAssignment | null;
  daysLeft: number | null;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean | null;
  isExpiringSoon: boolean;
}

export function useSubscriptionStatus(storeId?: string): UseSubscriptionStatusReturn {
  const [subscription, setSubscription] = useState<StorePackageAssignment | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }

    const storeIdValue = storeId; // Capture the value to avoid closure issues
    let isMounted = true;

    async function loadSubscription() {
      try {
        const subData = await getStoreActiveSubscription(storeIdValue);
        if (isMounted) {
          setSubscription(subData);

          if (subData) {
            const days = await getDaysUntilExpiry(storeIdValue);
            if (isMounted) {
              setDaysLeft(days);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription';
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSubscription();

    return () => {
      isMounted = false;
    };
  }, [storeId]);

  return {
    subscription,
    daysLeft,
    isLoading,
    error,
    isExpired: subscription ? new Date(subscription.expiresAt || '') < new Date() : null,
    isExpiringSoon: daysLeft !== null && daysLeft <= 7 && daysLeft > 0,
  };
}
