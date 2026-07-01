import { supabase } from './supabase';
import type {
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  VerifyPaymentResponse,
  RenewSubscriptionResponse,
  SubscriptionTransaction,
  StorePackageAssignment,
} from '@/lib/subscription-types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    // Required by Supabase Edge Functions
    'apikey': SUPABASE_ANON_KEY || '',
  };

  try {
    const session = await supabase.auth.getSession();
    if (session.data.session?.access_token) {
      headers.Authorization = `Bearer ${session.data.session.access_token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth session:', error);
  }

  return headers;
}

/**
 * Get client IP address
 */
async function getClientIpAddress(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return undefined;
  }
}

/**
 * Process subscription payment for a store
 * Initiates a Zain Cash payment for the selected package
 */
export async function processSubscriptionPayment(
  payload: ProcessPaymentRequest
): Promise<ProcessPaymentResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('Missing Supabase URL configuration');
    }

    const headers = await getAuthHeaders();
    const functionUrl = `${SUPABASE_URL}/functions/v1/process-subscription-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ProcessPaymentResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process payment');
    }

    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Payment processing error:', errorMessage);
    throw error;
  }
}

/**
 * Verify payment status
 * Check with Zain Cash if payment has been completed
 */
export async function verifySubscriptionPayment(
  transactionId: string,
  zaincashTransactionId?: string
): Promise<VerifyPaymentResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('Missing Supabase URL configuration');
    }

    const headers = await getAuthHeaders();
    const functionUrl = `${SUPABASE_URL}/functions/v1/verify-subscription-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        transactionId,
        zaincashTransactionId,
      }),
    });

    const data = (await response.json()) as VerifyPaymentResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to verify payment');
    }

    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Payment verification error:', errorMessage);
    throw error;
  }
}

/**
 * Renew subscription for a store
 * Initiates payment for renewing the store's subscription
 */
export async function renewSubscription(
  storeId: string,
  packageId?: string
): Promise<RenewSubscriptionResponse> {
  try {
    if (!SUPABASE_URL) {
      throw new Error('Missing Supabase URL configuration');
    }

    const headers = await getAuthHeaders();
    const functionUrl = `${SUPABASE_URL}/functions/v1/renew-subscription`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        storeId,
        packageId,
      }),
    });

    const data = (await response.json()) as RenewSubscriptionResponse;

    if (!response.ok) {
      throw new Error(data.error || 'Failed to renew subscription');
    }

    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Subscription renewal error:', errorMessage);
    throw error;
  }
}

/**
 * Get subscription transaction status
 * Query the database for transaction details
 */
export async function getSubscriptionTransaction(
  transactionId: string
): Promise<SubscriptionTransaction | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching transaction:', errorMessage);
    throw error;
  }
}

/**
 * Get active subscription for a store
 */
export async function getStoreActiveSubscription(
  storeId: string
): Promise<StorePackageAssignment | null> {
  try {
    const { data, error } = await supabase
      .from('store_package_assignments')
      .select(
        `*,
        package:package_id(*)
      `
      )
      .eq('store_id', storeId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      throw error;
    }
    return data;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching subscription:', errorMessage);
    throw error;
  }
}

/**
 * Get subscription transaction history
 */
export async function getSubscriptionHistory(
  storeId: string,
  limit = 10
): Promise<SubscriptionTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_transactions')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching transaction history:', errorMessage);
    throw error;
  }
}

/**
 * Check if subscription is expired
 */
export async function isSubscriptionExpired(storeId: string): Promise<boolean> {
  try {
    const subscription = await getStoreActiveSubscription(storeId);
    if (!subscription || !subscription.expiresAt) {
      return true;
    }

    const expiresDate = new Date(subscription.expiresAt);
    const now = new Date();

    return now > expiresDate;
  } catch {
    return true;
  }
}

/**
 * Get days until subscription expiry
 */
export async function getDaysUntilExpiry(storeId: string): Promise<number | null> {
  try {
    const subscription = await getStoreActiveSubscription(storeId);
    if (!subscription || !subscription.expiresAt) {
      return null;
    }

    const expiresDate = new Date(subscription.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil(
      (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return Math.max(0, daysLeft);
  } catch {
    return null;
  }
}

/**
 * Cancel subscription for a store
 */
export async function cancelSubscription(storeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('store_package_assignments')
      .update({
        is_active: false,
        isActive: false,
      })
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (error) throw error;
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error cancelling subscription:', errorMessage);
    throw error;
  }
}

/**
 * Create subscription notification
 */
export async function createSubscriptionNotification(
  storeId: string,
  packageId: string,
  notificationType: string,
  title: string,
  message: string,
  emailAddress?: string,
  whatsappNumber?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('subscription_notifications').insert({
      store_id: storeId,
      storeId: storeId,
      package_id: packageId,
      packageId: packageId,
      notification_type: notificationType,
      notificationType: notificationType,
      title,
      message,
      email_address: emailAddress,
      whatsapp_number: whatsappNumber,
    });

    if (error) throw error;
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating notification:', errorMessage);
    throw error;
  }
}

/**
 * Initiate payment with IP address
 */
export async function initiateSubscriptionPayment(
  payload: Omit<ProcessPaymentRequest, 'ipAddress'>
): Promise<ProcessPaymentResponse> {
  const ipAddress = await getClientIpAddress();

  return processSubscriptionPayment({
    ...payload,
    ipAddress,
  });
}

/**
 * Public store registration and payment workflow
 * 1. Register store and create owner account
 * 2. Initiate payment for subscription
 */
export async function registerStoreAndInitiatePayment(payload: {
  ownerName: string;
  storeName: string;
  marketType?: string;
  whatsappNumber: string;
  ownerEmail: string;
  skipPayment?: boolean;
  password?: string;
  packageId: string;
  registeredByAgentId?: string;
}): Promise<{
  success: boolean;
  storeId?: string;
  ownerId?: string;
  transactionId?: string;
  paymentUrl?: string;
  amount?: number;
  error?: string;
  message: string;
}> {
  try {
    const REGISTER_STORE_URL = process.env.NEXT_PUBLIC_REGISTER_STORE_FUNCTION_URL;
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!REGISTER_STORE_URL || !SUPABASE_URL) {
      throw new Error('Missing function configuration URLs');
    }

    const headers = await getAuthHeaders();

    // Step 1: Register store and create owner account
    console.log('Step 1: Registering store...');
    const registerResponse = await fetch(REGISTER_STORE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const registerData = await registerResponse.json();

    if (!registerResponse.ok || !registerData.success) {
      throw new Error(
        registerData.error || 
        registerData.message || 
        'Failed to register store'
      );
    }

    const { storeId, ownerId, amountToPay } = registerData;

    if (!storeId) {
      throw new Error('Store registration failed: No storeId returned');
    }

    console.log('Step 1: Store registered successfully. StoreId:', storeId);

    // Step 2: Check if payment is required
    if (!payload.skipPayment && amountToPay && amountToPay > 0) {
      console.log('Step 2: Initiating payment for amount:', amountToPay);

      const ipAddress = await getClientIpAddress();
      const paymentPayload: ProcessPaymentRequest = {
        storeId,
        packageId: payload.packageId,
        storeEmail: payload.ownerEmail,
        storeName: payload.storeName,
        ownerName: payload.ownerName,
        whatsappNumber: payload.whatsappNumber,
        ipAddress,
      };

      const paymentResponse = await processSubscriptionPayment(paymentPayload);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Failed to initiate payment');
      }

      console.log('Step 2: Payment initiated successfully');

      return {
        success: true,
        storeId,
        ownerId,
        transactionId: paymentResponse.transactionId,
        paymentUrl: paymentResponse.paymentUrl,
        amount: paymentResponse.amount,
        message: 'Store registered and payment initiated successfully',
      };
    } else {
      // Free package: no payment required
      console.log('Step 2: Package is free, no payment required');

      return {
        success: true,
        storeId,
        ownerId,
        message: 'Store registered successfully. No payment required for this package.',
      };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Store registration and payment workflow error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
      message: 'Failed to complete store registration and payment',
    };
  }
}
