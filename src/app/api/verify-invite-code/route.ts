import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    const validCodes =
      process.env.VALID_INVITE_CODES?.split(',').map((c) => c.trim().toUpperCase()) || [];

    const isValid = validCodes.includes(code.trim().toUpperCase());

    return NextResponse.json({ valid: isValid });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
