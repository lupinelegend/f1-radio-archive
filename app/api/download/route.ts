import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const filename = request.nextUrl.searchParams.get('filename')

  if (!url) {
    return new NextResponse('Missing URL parameter', { status: 400 })
  }

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      return new NextResponse('Failed to fetch audio file', { status: response.status })
    }

    const blob = await response.blob()
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename || 'clip.mp3'}"`,
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse('Download failed', { status: 500 })
  }
}
