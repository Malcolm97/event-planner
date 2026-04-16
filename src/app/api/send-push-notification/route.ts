import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(new URL('/api/notifications/send', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.headers.get('authorization')
          ? { authorization: request.headers.get('authorization') as string }
          : {}),
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json().catch(() => null);
    return NextResponse.json(responseData || { success: response.ok }, { status: response.status });
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
