/**
 * Check transcription status
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

async function checkTranscripts() {
  // Get total clips
  const { count: totalClips } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })

  // Get clips without transcripts
  const { count: withoutTranscripts } = await supabase
    .from('clips')
    .select('*', { count: 'exact', head: true })
    .or('transcript.is.null,transcript.eq.')

  // Get clips with transcripts
  const withTranscripts = (totalClips || 0) - (withoutTranscripts || 0)

  console.log('📊 Transcription Status\n')
  console.log(`Total Clips: ${totalClips}`)
  console.log(`✅ With Transcripts: ${withTranscripts}`)
  console.log(`❌ Without Transcripts: ${withoutTranscripts}`)
  console.log(`\nProgress: ${((withTranscripts / (totalClips || 1)) * 100).toFixed(1)}%`)
}

checkTranscripts()
