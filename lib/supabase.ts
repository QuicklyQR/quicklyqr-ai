// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on the schema mentioned in VersionREADME
export interface QRCodeRecord {
  id: string
  user_id?: string
  data_type: 'url' | 'text' | 'wifi' | 'vcard'
  content: string
  processing_options: {
    size: number
    foregroundColor: string
    backgroundColor: string
    errorCorrectionLevel: string
  }
  created_at: string
  updated_at: string
}

export interface BulkProcessingRecord {
  id: string
  user_id?: string
  filename: string
  total_rows: number
  processed_rows: number
  failed_rows: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

// Helper functions for database operations
export async function saveQRCodeGeneration(data: Omit<QRCodeRecord, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: result, error } = await supabase
      .from('qr_codes')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to save QR code generation:', error)
    return { success: false, error: error as Error }
  }
}

export async function saveBulkProcessing(data: Omit<BulkProcessingRecord, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data: result, error } = await supabase
      .from('bulk_processing')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to save bulk processing record:', error)
    return { success: false, error: error as Error }
  }
}

export async function updateBulkProcessing(id: string, updates: Partial<BulkProcessingRecord>) {
  try {
    const { data: result, error } = await supabase
      .from('bulk_processing')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to update bulk processing record:', error)
    return { success: false, error: error as Error }
  }
}

export async function getUserQRHistory(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Failed to get user QR history:', error)
    return { success: false, error: error as Error }
  }
}

export async function getUserBulkHistory(userId: string, limit: number = 20) {
  try {
    const { data, error } = await supabase
      .from('bulk_processing')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Failed to get user bulk history:', error)
    return { success: false, error: error as Error }
  }
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('count')
      .limit(1)
    
    if (error) throw error
    return { success: true, message: 'Supabase connection successful' }
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return { success: false, error: error as Error }
  }
}