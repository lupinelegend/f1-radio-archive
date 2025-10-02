/**
 * Test OpenAI API connection
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import OpenAI from 'openai'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env.local')
  process.exit(1)
}

console.log('✅ API Key found:', apiKey.substring(0, 10) + '...')
console.log('\n🔍 Testing OpenAI API connection...\n')

const openai = new OpenAI({ apiKey })

async function testConnection() {
  try {
    console.log('Attempting to list models...')
    const models = await openai.models.list()
    console.log('✅ Connection successful!')
    console.log(`Found ${models.data.length} models`)
    console.log('\nFirst few models:')
    models.data.slice(0, 5).forEach(model => {
      console.log(`  - ${model.id}`)
    })
  } catch (error) {
    console.error('❌ Connection failed:', error)
    if (error instanceof Error) {
      console.error('\nError details:', error.message)
    }
  }
}

testConnection()
