import { NextResponse } from 'next/server';

export async function GET() {
  // Simple test response
  return NextResponse.json({
    message: "Contributor API is working!",
    timestamp: new Date().toISOString()
  });
}