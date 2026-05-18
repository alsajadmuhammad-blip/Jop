export type CreateStoreOwnerPayload = {
  ownerEmail: string;
  ownerName: string;
  ownerPassword: string;
  storeName: string;
  whatsappNumber: string;
  marketType?: string;
  packageName?: string;
  storeType?: string;
  registeredByAgentId?: string;
  paymentProofUrl?: string | null;
};

export type CreateStoreOwnerResult = {
  success: boolean;
  ownerId?: string;
  store?: any;
  error?: string;
};

export type CreateRepresentativePayload = {
  name: string;
  email: string;
  password: string;
  paymentSystem: "salary" | "commission";
  monthlySalary?: number;
  requiredStoresCount?: number;
};

export type CreateRepresentativeResult = {
  success: boolean;
  userId?: string;
  representative?: any;
  error?: string;
};

import { supabase } from './supabase';

async function buildSupabaseFunctionHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    headers.apikey = anonKey;
  }

  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || data?.session?.provider_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Unable to attach Supabase auth header for function request:', error);
  }

  return headers;
}

export async function createStoreOwner(
  payload: CreateStoreOwnerPayload
): Promise<CreateStoreOwnerResult> {
  const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL;
  if (!functionUrl) {
    return {
      success: false,
      error: 'Missing NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL in environment',
    };
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: await buildSupabaseFunctionHeaders(),
    body: JSON.stringify(payload),
  });

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse response from function: ${err}`,
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: data?.error || `Function request failed with status ${response.status}`,
    };
  }

  return {
    success: true,
    ownerId: data?.ownerId,
    store: data?.store,
  };
}

export async function createRepresentative(
  payload: CreateRepresentativePayload
): Promise<CreateRepresentativeResult> {
  // Prefer calling the Supabase Function URL directly (same approach as createStoreOwner)
  const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL;
  if (!functionUrl) {
    return {
      success: false,
      error: 'Missing NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL in environment',
    };
  }

  // Build headers including anon key and user token when available
  const headers = await buildSupabaseFunctionHeaders();

  // Normalize payload to snake_case as server functions expect database column names
  const requestBody = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    payment_system: payload.paymentSystem,
    monthly_salary: payload.monthlySalary,
    required_stores_count: payload.requiredStoresCount,
    role: 'representative',
  };

  console.log('📤 [createRepresentative] إرسال بيانات المندوب إلى function URL', functionUrl, requestBody);

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    let data: any;
    try {
      data = await response.json();
    } catch (err) {
      const text = await response.text();
      console.warn('[createRepresentative] function response not JSON:', text);
      return {
        success: false,
        error: `Function returned non-JSON response: ${text}`,
      };
    }

    console.log('📦 [createRepresentative] رد الدالة:', response.status, data);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `Function request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      userId: data?.userId,
      representative: data?.representative,
    };
  } catch (error: any) {
    console.error('❌ [createRepresentative] خطأ في استدعاء الدالة:', error);
    return {
      success: false,
      error: `خطأ في الاتصال: ${error?.message || String(error)}`,
    };
  }
}
