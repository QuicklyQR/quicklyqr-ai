// app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { testSupabaseConnection } from '../../../lib/supabase'

export async function GET() {
  try {
    const connectionTest = await testSupabaseConnection()
    
    if (connectionTest.success) {
      return NextResponse.json({
        success: true,
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database connection failed',
        error: connectionTest.error?.message
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'API route error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET method to test database connection'
  }, { status: 405 })
}