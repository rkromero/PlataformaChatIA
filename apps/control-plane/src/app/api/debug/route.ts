import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        CHATWOOT_BASE_URL: process.env.CHATWOOT_BASE_URL,
        CW_PLATFORM_KEY: process.env.CW_PLATFORM_KEY,
        CHATWOOT_API_TOKEN: process.env.CHATWOOT_API_TOKEN,
    });
}
