import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json(
    { status: 'ok', service: 'alhazmi-web', database: 'not_checked', timestamp: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
