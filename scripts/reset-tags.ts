/**
 * Reset all tags - delete all clip_tags to start fresh
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function resetTags() {
  console.log('⚠️  WARNING: This will delete ALL tags from the database!\n')
  console.log('Waiting 5 seconds... Press Ctrl+C to cancel\n')
  
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  console.log('Deleting all tags...\n')
  
  const { error } = await supabase
    .from('clip_tags')
    .delete()
    .neq('clip_id', '00000000-0000-0000-0000-000000000000') // Delete all rows (using clip_id which exists)
  
  if (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
  
  console.log('✅ All tags deleted!\n')
  console.log('You can now run auto-tag from scratch.')
}

resetTags()
