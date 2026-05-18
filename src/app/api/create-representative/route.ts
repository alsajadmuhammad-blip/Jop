import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration missing Supabase URL or service role key.' },
        { status: 500 }
      );
    }

    const functionUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/create-representative`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.ok ? 200 : response.status });
  } catch (error: any) {
    console.error('[api/create-representative] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown server error.' },
      { status: 500 }
    );
  }
}
