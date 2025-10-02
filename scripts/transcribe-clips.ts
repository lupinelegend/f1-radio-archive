/**
 * Script to transcribe F1 radio clips using OpenAI Whisper
 * 
 * Usage:
 * npx tsx scripts/transcribe-clips.ts [--limit=10] [--clip-id=uuid]
 * 
 * Examples:
 * npx tsx scripts/transcribe-clips.ts --limit=10
 * npx tsx scripts/transcribe-clips.ts --clip-id=123e4567-e89b-12d3-a456-426614174000
 * npx tsx scripts/transcribe-clips.ts  # Transcribe all clips without transcripts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { transcribeAudioWithRetry } from '../lib/transcription-service'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

if (!openaiKey) {
  console.error('Missing OpenAI API key. Please set OPENAI_API_KEY in your .env.local')
  console.error('Get your API key from: https://platform.openai.com/api-keys')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface TranscribeOptions {
  limit?: number
  clipId?: string
}

async function transcribeClips(options: TranscribeOptions = {}) {
  console.log('🎙️  Starting F1 Radio Transcription...\n')

  try {
    // Build query
    let query = supabase
      .from('clips')
      .select('id, title, audio_url, transcript')
      .order('created_at', { ascending: false })

    // Filter by clip ID if provided
    if (options.clipId) {
      query = query.eq('id', options.clipId)
    } else {
      // Only get clips without transcripts
      query = query.or('transcript.is.null,transcript.eq.')
    }

    // Apply limit if provided
    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data: clips, error } = await query

    if (error) {
      console.error('❌ Error fetching clips:', error.message)
      process.exit(1)
    }

    if (!clips || clips.length === 0) {
      console.log('✅ No clips found that need transcription!')
      return
    }

    console.log(`📋 Found ${clips.length} clip(s) to transcribe\n`)

    let successCount = 0
    let failCount = 0

    // Process each clip
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const progress = `[${i + 1}/${clips.length}]`

      console.log(`${progress} Processing: ${clip.title}`)
      console.log(`   Clip ID: ${clip.id}`)
      console.log(`   Audio URL: ${clip.audio_url}`)

      try {
        // Transcribe the audio
        const transcript = await transcribeAudioWithRetry(clip.audio_url)

        // Update the database
        const { error: updateError } = await supabase
          .from('clips')
          .update({ transcript })
          .eq('id', clip.id)

        if (updateError) {
          console.error(`   ❌ Error updating database:`, updateError.message)
          failCount++
        } else {
          console.log(`   ✅ Transcription saved: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`)
          successCount++
        }

      } catch (error) {
        console.error(`   ❌ Transcription failed:`, error instanceof Error ? error.message : error)
        failCount++
      }

      console.log('') // Empty line for readability

      // Rate limiting between clips
      if (i < clips.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Summary
    console.log('='.repeat(60))
    console.log('🏁 Transcription Complete!')
    console.log('='.repeat(60))
    console.log(`Total Clips: ${clips.length}`)
    console.log(`✅ Successful: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Error during transcription:', error)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: TranscribeOptions = {}

for (const arg of args) {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1])
  } else if (arg.startsWith('--clip-id=')) {
    options.clipId = arg.split('=')[1]
  }
}

// Run the transcription
transcribeClips(options)
