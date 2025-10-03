/**
 * Continuously auto-tag all clips in batches
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function autoTagAll() {
  console.log('🚀 Starting continuous auto-tagging...\n')
  
  let batchNumber = 1
  
  while (true) {
    console.log(`\n📦 Running batch ${batchNumber}...\n`)
    
    try {
      const { stdout } = await execAsync('npx tsx scripts/auto-tag-clips.ts --limit=100')
      console.log(stdout)
      
      // Check if we're done (no more clips to tag)
      if (stdout.includes('No clips to tag!')) {
        console.log('\n✅ All clips have been tagged!')
        break
      }
      
      batchNumber++
      
      // Wait 2 seconds between batches
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.error('Error:', error)
      break
    }
  }
  
  console.log('\n🏁 Auto-tagging complete!')
}

autoTagAll()
