import { NextRequest, NextResponse } from 'next/server';
import { assertValidAdminCredentials, createAdminSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('Attempting login with username:', username);
    assertValidAdminCredentials(username, password);
    console.log('Credentials validated successfully');

    await createAdminSession();
    console.log('Session created successfully');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
