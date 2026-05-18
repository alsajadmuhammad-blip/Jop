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
  const functionUrl =
    process.env.NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL ||
    'https://tjfogjumpyygftwwbmxb.supabase.co/functions/v1/create-representative';

  const requestBody = {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    paymentSystem: payload.paymentSystem,
    monthlySalary: payload.monthlySalary,
    requiredStoresCount: payload.requiredStoresCount,
    role: 'representative',
  };

  console.log('📤 [createRepresentative] محاولة الاتصال بالدالة السحابية...', {
    name: payload.name,
    email: payload.email,
    paymentSystem: payload.paymentSystem,
    url: functionUrl,
    url: functionUrl,
  });

  // Method 1: Try invoking via the Supabase client relay (avoids CORS/preflight issues)
  try {
    console.log('🔗 [createRepresentative] المحاولة الأولى: استخدام supabase.functions.invoke()');
    const invokeResult: any = await supabase.functions.invoke('create-representative', {
      body: requestBody,
    });

    console.log('✅ [createRepresentative] رد من invoke():', invokeResult);

    if (!invokeResult.error) {
      console.log('✨ [createRepresentative] نجاح! تم إنشاء المندوب:', invokeResult.data?.userId);
      return { 
        success: true, 
        userId: invokeResult.data?.userId, 
        representative: invokeResult.data?.representative 
      };
    }

    // Fall through to direct fetch fallback
    throw invokeResult.error;
  } catch (invokeErr: any) {
    const message = String(invokeErr?.message || invokeErr);
    console.warn('⚠️ [createRepresentative] فشل invoke():', message);

    // Method 2: Try direct fetch as fallback
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.error('❌ [createRepresentative] لا توجد متغيرات بيئية (SUPABASE_URL)');
      return { success: false, error: `لا يمكن الوصول إلى الدالة. تحقق من تكوين التطبيق.` };
    }

    try {
      const directUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-representative`;
      console.log('🔗 [createRepresentative] المحاولة الثانية: استخدام fetch مباشر إلى:', directUrl);

      const headers = await buildSupabaseFunctionHeaders();
      console.log('📋 [createRepresentative] الـ Headers المستخدمة:', Object.keys(headers));
      console.log('📋 [createRepresentative] جسم الطلب:', JSON.stringify(requestBody, null, 2));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const resp = await fetch(directUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 [createRepresentative] حالة الاستجابة:', resp.status, resp.statusText);

      const text = await resp.text();
      console.log('📦 [createRepresentative] جسم الاستجابة (نص):', text.substring(0, 500));

      let parsed: any = text;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        console.warn('⚠️ [createRepresentative] لم يتمكن من تحليل JSON:', e);
      }

      if (!resp.ok) {
        console.error('❌ [createRepresentative] الدالة أرجعت خطأ:', resp.status, parsed);
        return { 
          success: false, 
          error: parsed?.error || parsed?.message || `فشل الطلب: HTTP ${resp.status}` 
        };
      }

      console.log('✨ [createRepresentative] نجاح! تم إنشاء المندوب:', parsed?.userId);
      return { 
        success: true, 
        userId: parsed?.userId, 
        representative: parsed?.representative 
      };
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        console.error('❌ [createRepresentative] انتهت مهلة الاتصال (timeout) بعد 30 ثانية');
        return { 
          success: false, 
          error: 'انتهت مهلة الاتصال. قد تكون الدالة السحابية معطلة أو الإنترنت بطيء جداً.' 
        };
      }
      console.error('❌ [createRepresentative] خطأ في الاستدعاء المباشر:', fetchErr);
      return { 
        success: false, 
        error: `خطأ في الاتصال: ${fetchErr?.message || String(fetchErr)}` 
      };
    }
  }
}
