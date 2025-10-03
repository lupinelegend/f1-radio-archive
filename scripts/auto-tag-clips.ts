/**
 * AI Auto-Tagging Script
 * Uses GPT to automatically categorize F1 radio clips based on transcripts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const openai = new OpenAI({ apiKey: openaiKey })

interface Category {
  id: string
  name: string
  description: string
}

async function autoTagClips(limit?: number) {
  console.log('🤖 Starting AI Auto-Tagging...\n')

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (!categories || categories.length === 0) {
    console.error('❌ No categories found. Run seed-categories.ts first!')
    process.exit(1)
  }

  console.log(`📋 Found ${categories.length} categories\n`)

  // Get clips with transcripts - fetch in batches if limit > 1000
  const requestedLimit = limit || 1000
  const batchSize = 1000
  let allClips: any[] = []
  
  for (let offset = 0; offset < requestedLimit; offset += batchSize) {
    const { data: batch } = await supabase
      .from('clips')
      .select('id, transcript, driver:drivers(name), race:races(name, location)')
      .not('transcript', 'is', null)
      .neq('transcript', '')
      .order('created_at', { ascending: false }) // Process newest first to find untagged clips faster
      .range(offset, offset + batchSize - 1)
    
    if (!batch || batch.length === 0) break
    
    allClips.push(...batch)
    
    if (batch.length < batchSize) break // Last batch
  }
  
  const clips = allClips.slice(0, requestedLimit)

  console.log(`📝 Processing up to ${clips.length} clips (will skip already-tagged)...\n`)

  if (!clips || clips.length === 0) {
    console.log('✅ No clips to tag!')
    return
  }

  const categoryList = categories.map(c => `- ${c.name}: ${c.description}`).join('\n')

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i]
    const progress = `[${i + 1}/${clips.length}]`

    console.log(`${progress} Processing: ${clip.driver?.name} - ${clip.race?.location}`)
    
    // Check if already tagged BEFORE calling AI
    const { count } = await supabase
      .from('clip_tags')
      .select('*', { count: 'exact', head: true })
      .eq('clip_id', clip.id)

    if (count && count > 0) {
      console.log(`   ⏭️  Already tagged, skipping`)
      continue
    }

    console.log(`   Transcript: "${clip.transcript?.substring(0, 80)}..."`)

    try {
      // Use GPT to categorize
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an F1 radio expert. Analyze radio transcripts and assign appropriate categories.

Available categories:
${categoryList}

Return ONLY a JSON array of category names that apply. Example: ["Rage", "Complaint"]
Be selective - only choose categories that clearly apply. Maximum 3 categories per clip.`
          },
          {
            role: 'user',
            content: `Categorize this F1 radio message: "${clip.transcript}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 100,
      })

      const response = completion.choices[0]?.message?.content?.trim()
      if (!response) {
        console.log(`   ❌ No response from AI`)
        failCount++
        continue
      }

      // Parse the response
      let selectedCategories: string[] = []
      try {
        selectedCategories = JSON.parse(response)
      } catch {
        console.log(`   ❌ Invalid JSON response: ${response}`)
        failCount++
        continue
      }

      // Find category IDs
      const categoryIds = selectedCategories
        .map(name => categories.find(c => c.name === name)?.id)
        .filter(Boolean) as string[]

      if (categoryIds.length === 0) {
        console.log(`   ⚠️  No valid categories found`)
        continue
      }

      // Save tags to database
      const tags = categoryIds.map(categoryId => ({
        clip_id: clip.id,
        category_id: categoryId,
      }))

      const { data, error } = await supabase
        .from('clip_tags')
        .insert(tags)
        .select()

      if (error) {
        // Skip if duplicate (clip already tagged)
        if (error.message?.includes('duplicate key')) {
          console.log(`   ⏭️  Already tagged, skipping`)
          continue
        }
        console.log(`   ❌ Error saving tags: ${error.message}`)
        console.log(`   Error details:`, error)
        failCount++
      } else {
        console.log(`   ✅ Tagged with: ${selectedCategories.join(', ')} (${data?.length || 0} tags saved)`)
        successCount++
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`)
      failCount++
    }

    // Rate limiting
    if (i < clips.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('')
  }

  console.log('='.repeat(60))
  console.log('🏁 Auto-Tagging Complete!')
  console.log('='.repeat(60))
  console.log(`Total Clips: ${clips.length}`)
  console.log(`✅ Successfully Tagged: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(60) + '\n')
}

// Parse command line arguments
const args = process.argv.slice(2)
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined

autoTagClips(limit)
