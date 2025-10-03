/**
 * Script to seed categories for F1 radio clips
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const categories = [
  { name: 'Overtake', description: 'Radio messages about overtaking maneuvers' },
  { name: 'Strategy', description: 'Pit stop strategy and race tactics' },
  { name: 'Rage', description: 'Frustrated or angry radio messages' },
  { name: 'Celebration', description: 'Victory celebrations and achievements' },
  { name: 'Team Orders', description: 'Team instructions to drivers' },
  { name: 'Technical Issue', description: 'Car problems and technical difficulties' },
  { name: 'Safety Car', description: 'Safety car and VSC related messages' },
  { name: 'Pit Stop', description: 'Pit stop communications' },
  { name: 'Weather', description: 'Weather conditions and tire choices' },
  { name: 'Incident', description: 'Crashes, penalties, and incidents' },
  { name: 'Funny', description: 'Humorous or entertaining moments' },
  { name: 'Motivational', description: 'Encouraging and motivational messages' },
  { name: 'Complaint', description: 'Complaints about other drivers or conditions' },
  { name: 'Information', description: 'General race information and updates' },
  { name: 'Viral', description: 'Super popular and widely shared radio moments' },
]

async function seedCategories() {
  console.log('🏷️  Seeding Categories...\n')

  for (const category of categories) {
    const { error } = await supabase
      .from('categories')
      .upsert(category, {
        onConflict: 'name',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error(`❌ Error adding ${category.name}:`, error.message)
    } else {
      console.log(`✅ Added: ${category.name}`)
    }
  }

  console.log('\n✨ Categories seeded successfully!')
}

seedCategories()
