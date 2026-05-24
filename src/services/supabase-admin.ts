const SUPABASE_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

function buildSupabaseFunctionUrl(path: string): string | undefined {
  if (!SUPABASE_BASE_URL) return undefined;
  return `${SUPABASE_BASE_URL.replace(/\/$/, '')}/${path}`;
}

const SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL ??
  buildSupabaseFunctionUrl('functions/v1/create-store-owner');
const SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL =
  process.env.NEXT_PUBLIC_SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL ??
  buildSupabaseFunctionUrl('functions/v1/create-representative');
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fetchSupabaseFunction(url: string | undefined, payload: unknown) {
  if (!url) {
    throw new Error('Missing Supabase function URL.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Invalid JSON response from Supabase function: ${text}`);
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || `Function request failed with status ${response.status}`);
  }

  return data;
}

export async function createRepresentative(payload: {
  name: string;
  email: string;
  password: string;
  paymentSystem: 'salary' | 'commission';
  monthlySalary?: number;
  requiredStoresCount?: number;
}) {
  return fetchSupabaseFunction(SUPABASE_CREATE_REPRESENTATIVE_FUNCTION_URL, {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    payment_system: payload.paymentSystem,
    monthly_salary: payload.monthlySalary,
    required_stores_count: payload.requiredStoresCount,
    role: 'representative',
  });
}

export async function createStoreOwner(payload: {
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
}) {
  return fetchSupabaseFunction(SUPABASE_CREATE_STORE_OWNER_FUNCTION_URL, {
    owner_email: payload.ownerEmail,
    owner_name: payload.ownerName,
    owner_password: payload.ownerPassword,
    store_name: payload.storeName,
    whatsapp_number: payload.whatsappNumber,
    market_type: payload.marketType,
    package_name: payload.packageName,
    store_type: payload.storeType,
    registered_by_agent_id: payload.registeredByAgentId,
    payment_proof_url: payload.paymentProofUrl,
  });
}
