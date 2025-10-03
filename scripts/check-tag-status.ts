/**
 * Check tagging status
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

async function checkTagStatus() {
  // Get total clips
  const { count: totalClips } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })

  // Get unique clip IDs that have tags (fetch all with pagination)
  let allTaggedClipIds: any[] = []
  let offset = 0
  const batchSize = 1000
  
  while (true) {
    const { data: batch } = await supabase
      .from('clip_tags')
      .select('clip_id')
      .range(offset, offset + batchSize - 1)
    
    if (!batch || batch.length === 0) break
    
    allTaggedClipIds.push(...batch)
    offset += batchSize
    
    if (batch.length < batchSize) break // Last batch
  }

  const taggedCount = new Set(allTaggedClipIds.map(t => t.clip_id)).size
  const untaggedCount = (totalClips || 0) - taggedCount

  console.log('🏷️  Tagging Status\n')
  console.log(`Total Clips: ${totalClips}`)
  console.log(`✅ Tagged: ${taggedCount}`)
  console.log(`❌ Untagged: ${untaggedCount}`)
  console.log(`\nProgress: ${((taggedCount / (totalClips || 1)) * 100).toFixed(1)}%`)
  
  if (untaggedCount > 0) {
    const estimatedBatches = Math.ceil(untaggedCount / 500)
    console.log(`\nEstimated batches remaining: ${estimatedBatches}`)
  }
}

checkTagStatus()
