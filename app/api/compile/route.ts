import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const compilationId = request.nextUrl.searchParams.get('id')

  if (!compilationId) {
    return new NextResponse('Missing compilation ID', { status: 400 })
  }

  const supabase = await createClient()
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Fetch compilation with clips
  const { data: compilation, error } = await supabase
    .from('compilations')
    .select(`
      *,
      compilation_clips(
        position,
        clip:clips(
          id,
          audio_url
        )
      )
    `)
    .eq('id', compilationId)
    .eq('user_id', user.id)
    .single()

  if (error || !compilation) {
    return new NextResponse('Compilation not found', { status: 404 })
  }

  try {
    // Sort clips by position
    const sortedClips = compilation.compilation_clips
      .sort((a: any, b: any) => a.position - b.position)
      .map((cc: any) => cc.clip)

    // Fetch all audio files
    const audioBuffers = await Promise.all(
      sortedClips.map(async (clip: any) => {
        const response = await fetch(clip.audio_url)
        return response.arrayBuffer()
      })
    )

    // Simple concatenation (for MP3 files, this works reasonably well)
    // For production, you'd want to use ffmpeg for proper merging
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    const mergedBuffer = new Uint8Array(totalLength)
    
    let offset = 0
    for (const buffer of audioBuffers) {
      mergedBuffer.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    const filename = `${compilation.title.replace(/\s+/g, '_')}.mp3`

    return new NextResponse(mergedBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': totalLength.toString(),
      },
    })
  } catch (error) {
    console.error('Compilation error:', error)
    return new NextResponse('Failed to create compilation', { status: 500 })
  }
}
