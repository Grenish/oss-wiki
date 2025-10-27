import { NextResponse } from 'next/server';

export function GET() {
  // Simple test response
  return NextResponse.json({
    message: "Contributor API is working!",
    timestamp: new Date().toISOString()
  });
}