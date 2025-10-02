import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transcribeAudioWithRetry } from '@/lib/transcription-service'

/**
 * API Route to transcribe clips
 * 
 * Usage:
 * POST /api/transcribe
 * Body: { clipId?: string, limit?: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clipId, limit = 10 } = body

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('clips')
      .select('id, title, audio_url, transcript')
      .order('created_at', { ascending: false })

    // Filter by clip ID if provided
    if (clipId) {
      query = query.eq('id', clipId)
    } else {
      // Only get clips without transcripts
      query = query.or('transcript.is.null,transcript.eq.')
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data: clips, error } = await query

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!clips || clips.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No clips found that need transcription',
        processed: 0,
      })
    }

    let successCount = 0
    let failCount = 0
    const results = []

    // Process each clip
    for (const clip of clips) {
      try {
        // Transcribe the audio
        const transcript = await transcribeAudioWithRetry(clip.audio_url)

        // Update the database
        const { error: updateError } = await supabase
          .from('clips')
          .update({ transcript })
          .eq('id', clip.id)

        if (updateError) {
          failCount++
          results.push({
            id: clip.id,
            title: clip.title,
            success: false,
            error: updateError.message,
          })
        } else {
          successCount++
          results.push({
            id: clip.id,
            title: clip.title,
            success: true,
            transcript: transcript.substring(0, 100),
          })
        }
      } catch (error) {
        failCount++
        results.push({
          id: clip.id,
          title: clip.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Rate limiting between clips
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return NextResponse.json({
      success: true,
      message: `Transcribed ${successCount}/${clips.length} clips`,
      total: clips.length,
      successful: successCount,
      failed: failCount,
      results,
    })

  } catch (error) {
    console.error('Error in transcribe API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
