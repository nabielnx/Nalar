import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        // cookies harus dipanggil biar session tersimpan di browser
        const supabase = await createClient();
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Balikin ke home/editor setelah login sukses
    return NextResponse.redirect(requestUrl.origin);
}
