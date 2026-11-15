import { NextResponse } from 'next/server';

// Fail closed: database-backed, reviewed and authorized records only in a later milestone.
export function GET() {
  return NextResponse.json(
    { data: [], meta: { status: 'not_connected', publishedOnly: true }, error: null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
