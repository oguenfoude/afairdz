import { NextResponse } from 'next/server';

export async function POST() {
  // Abandoned leads disabled as requested: only real confirmed orders are processed
  return NextResponse.json({ success: true, disabled: true });
}
