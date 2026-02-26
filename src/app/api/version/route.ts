import { NextResponse } from 'next/server';

// This endpoint returns the current app version for PWA update checking
// The version should be updated during deployments

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const version = {
    version: '10.0.5',
    buildTimestamp: '20260226',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    environment: process.env.NODE_ENV || 'development',
    deployedAt: new Date().toISOString(),
  };

  return NextResponse.json(version, {
    headers: {
      // Prevent caching to ensure fresh version checks
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
    },
  });
}