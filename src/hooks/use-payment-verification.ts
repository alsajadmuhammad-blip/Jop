import { useCallback, useState } from 'react';
import { verifySubscriptionPayment } from '@/services/subscription-service';
import type { VerifyPaymentResponse } from '@/lib/subscription-types';

interface UsePaymentVerificationOptions {
  autoVerify?: boolean;
  retryInterval?: number;
  maxRetries?: number;
}

export function usePaymentVerification(options: UsePaymentVerificationOptions = {}) {
  const { autoVerify = false, retryInterval = 3000, maxRetries = 10 } = options;

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const verify = useCallback(
    async (transactionId: string, zaincashTransactionId?: string) => {
      setIsVerifying(true);
      setError(null);

      try {
        const response = await verifySubscriptionPayment(transactionId, zaincashTransactionId);

        if (response.success && response.status === 'completed') {
          setIsVerified(true);
          return response;
        } else {
          throw new Error(response.error || 'Payment verification failed');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Verification failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsVerifying(false);
      }
    },
    []
  );

  const verifyWithRetry = useCallback(
    async (transactionId: string, zaincashTransactionId?: string): Promise<VerifyPaymentResponse | null> => {
      let lastError: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          setRetryCount(i);
          const response = await verify(transactionId, zaincashTransactionId);
          return response;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error');

          if (i < maxRetries - 1) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, retryInterval));
          }
        }
      }

      if (lastError) {
        setError(lastError.message);
      }
      return null;
    },
    [verify, retryInterval, maxRetries]
  );

  return {
    verify,
    verifyWithRetry,
    isVerifying,
    isVerified,
    error,
    retryCount,
  };
}
