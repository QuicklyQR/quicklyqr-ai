# API Endpoints Documentation

## Database Connection Test

### GET /api/test-db

Tests the Supabase database connection.

**Response:**
```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2025-01-XX...."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Database connection failed",
  "error": "Error details..."
}
```

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

### qr_codes table
- `id` (uuid, primary key)
- `user_id` (uuid, optional)
- `data_type` (text: 'url' | 'text' | 'wifi' | 'vcard')
- `content` (text)
- `processing_options` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### bulk_processing table
- `id` (uuid, primary key)
- `user_id` (uuid, optional)
- `filename` (text)
- `total_rows` (integer)
- `processed_rows` (integer)
- `failed_rows` (integer)
- `status` (text: 'pending' | 'processing' | 'completed' | 'failed')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)