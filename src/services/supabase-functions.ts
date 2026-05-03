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
    headers: {
      'Content-Type': 'application/json',
    },
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
