/**
 * Remove clips with very short or useless transcripts
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

async function cleanShortTranscripts() {
  console.log('🧹 Cleaning short transcripts...\n')

  // Get total count first
  const { count: totalCount } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .not('transcript', 'is', null)
    .neq('transcript', '')

  console.log(`📊 Total clips with transcripts: ${totalCount}\n`)

  // Fetch all clips in batches
  const allClips: any[] = []
  const batchSize = 1000
  
  for (let offset = 0; offset < (totalCount || 0); offset += batchSize) {
    const { data: batch } = await supabase
      .from('clips')
      .select('id, transcript')
      .not('transcript', 'is', null)
      .neq('transcript', '')
      .range(offset, offset + batchSize - 1)
    
    if (batch) {
      allClips.push(...batch)
      console.log(`Fetched ${allClips.length}/${totalCount} clips...`)
    }
  }

  const clips = allClips
  console.log(`\n📋 Loaded ${clips.length} clips total\n`)

  // Filter clips with one-word transcripts (or very short ones)
  const shortClips = clips.filter(clip => {
    const words = clip.transcript?.trim().split(/\s+/) || []
    return words.length <= 1 // One word or less
  })

  console.log(`Found ${shortClips.length} clips with one-word transcripts\n`)

  if (shortClips.length === 0) {
    console.log('✅ No clips to remove!')
    return
  }

  // Show some examples
  console.log('Examples of clips to be removed:')
  shortClips.slice(0, 10).forEach(clip => {
    console.log(`  - "${clip.transcript}"`)
  })

  console.log(`\n⚠️  This will delete ${shortClips.length} clips. Continue? (Ctrl+C to cancel)`)
  console.log('Waiting 5 seconds...\n')

  await new Promise(resolve => setTimeout(resolve, 5000))

  // Delete the clips
  const clipIds = shortClips.map(c => c.id)
  
  // Delete in batches of 100
  let deleted = 0
  for (let i = 0; i < clipIds.length; i += 100) {
    const batch = clipIds.slice(i, i + 100)
    const { error } = await supabase
      .from('clips')
      .delete()
      .in('id', batch)

    if (error) {
      console.error(`❌ Error deleting batch: ${error.message}`)
    } else {
      deleted += batch.length
      console.log(`✅ Deleted ${deleted}/${clipIds.length} clips`)
    }
  }

  console.log(`\n🏁 Cleanup complete! Deleted ${deleted} clips with short transcripts`)
}

cleanShortTranscripts()
