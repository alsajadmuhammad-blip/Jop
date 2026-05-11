import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateStoreOwnerPayload {
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
}

interface CreateStoreOwnerResult {
  success: boolean;
  ownerId?: string;
  store?: any;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: CreateStoreOwnerPayload = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: payload.ownerEmail,
      password: payload.ownerPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: payload.ownerName,
      },
    });

    if (authError) {
      return new Response(JSON.stringify({ success: false, error: authError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ownerId = authData.user.id;

    // Create store with EXACT column names from schema
    const storeData = {
      name: payload.storeName,
      owner_id: ownerId,
      owner_email: payload.ownerEmail,
      whatsapp_number: payload.whatsappNumber,
      market_type: payload.marketType || 'general',
      type: payload.storeType || 'إلكتروني',
      is_active: false, // Pending activation
      product_limit: 50, // Default from schema
      subscription_duration: 30, // Default from schema (30 days)
      activation_date: null,
      registered_by_agent_id: payload.registeredByAgentId || null,
      payment_proof_url: payload.paymentProofUrl || null,
      package_name: payload.packageName || null,
    };

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert([storeData])
      .select()
      .single();

    if (storeError) {
      // Cleanup auth user if store creation fails
      await supabase.auth.admin.deleteUser(ownerId);
      return new Response(JSON.stringify({ success: false, error: storeError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user record with EXACT column names
    const userData = {
      id: ownerId,
      name: payload.ownerName,
      email: payload.ownerEmail,
      role: 'store',
      store_id: store.id,
      first_login: true,
    };

    const { error: userError } = await supabase
      .from('users')
      .insert([userData]);

    if (userError) {
      // Cleanup
      await supabase.from('stores').delete().eq('id', store.id);
      await supabase.auth.admin.deleteUser(ownerId);
      return new Response(JSON.stringify({ success: false, error: userError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result: CreateStoreOwnerResult = {
      success: true,
      ownerId,
      store,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});