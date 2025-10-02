/**
 * Audio Transcription Service
 * Uses OpenAI Whisper API to transcribe F1 radio messages
 */

import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'

let openai: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openai = new OpenAI({ apiKey })
  }
  return openai
}

/**
 * Download audio file from URL to temporary location
 */
async function downloadAudio(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('No response body')
  }

  const fileStream = createWriteStream(outputPath)
  await pipeline(response.body as any, fileStream)
}

/**
 * Transcribe audio file using OpenAI Whisper
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const tempDir = path.join(process.cwd(), 'temp')
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  // Generate unique filename
  const filename = `audio-${Date.now()}.mp3`
  const tempFilePath = path.join(tempDir, filename)

  try {
    // Download audio file
    console.log(`Downloading audio from: ${audioUrl}`)
    await downloadAudio(audioUrl, tempFilePath)

    // Check if file was downloaded successfully
    const stats = fs.statSync(tempFilePath)
    console.log(`Audio file downloaded: ${stats.size} bytes`)

    if (stats.size === 0) {
      throw new Error('Downloaded audio file is empty')
    }

    // Transcribe using OpenAI Whisper
    console.log(`Transcribing audio...`)
    const client = getOpenAIClient()
    
    // Read file as buffer for more reliable upload
    const fileBuffer = fs.readFileSync(tempFilePath)
    const file = new File([fileBuffer], 'audio.mp3', { type: 'audio/mpeg' })
    
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en', // F1 radio is primarily in English
      response_format: 'text',
    })

    console.log(`Transcription complete: "${transcription}"`)
    return transcription as string

  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  } finally {
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
  }
}

/**
 * Transcribe audio with retry logic
 */
export async function transcribeAudioWithRetry(
  audioUrl: string,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transcribeAudio(audioUrl)
    } catch (error) {
      lastError = error as Error
      console.error(`Transcription attempt ${attempt}/${maxRetries} failed:`, error)
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`Waiting ${waitTime}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  throw lastError || new Error('Transcription failed after retries')
}

/**
 * Batch transcribe multiple audio URLs
 */
export async function batchTranscribe(
  audioUrls: Array<{ id: string; url: string }>,
  onProgress?: (completed: number, total: number, id: string) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const total = audioUrls.length

  for (let i = 0; i < audioUrls.length; i++) {
    const { id, url } = audioUrls[i]
    
    try {
      const transcript = await transcribeAudioWithRetry(url)
      results.set(id, transcript)
      
      if (onProgress) {
        onProgress(i + 1, total, id)
      }
    } catch (error) {
      console.error(`Failed to transcribe ${id}:`, error)
      results.set(id, '') // Store empty string for failed transcriptions
    }

    // Rate limiting: wait between requests to avoid hitting API limits
    if (i < audioUrls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}
