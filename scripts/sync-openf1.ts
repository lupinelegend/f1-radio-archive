/**
 * Script to sync F1 radio messages from OpenF1 API to Supabase
 * 
 * Usage:
 * npx tsx scripts/sync-openf1.ts [year]
 * 
 * Examples:
 * npx tsx scripts/sync-openf1.ts 2024
 * npx tsx scripts/sync-openf1.ts 2023
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { fetchTeamRadio, fetchSessions, fetchDrivers } from '../lib/openf1-api'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncRadioMessages(year?: number) {
  console.log(`🏎️  Starting F1 Radio Sync ${year ? `for year ${year}` : ''}...\n`)

  try {
    // Fetch sessions
    console.log('📡 Fetching sessions from OpenF1...')
    const sessions = await fetchSessions(year ? { year } : undefined)
    console.log(`✅ Found ${sessions.length} sessions\n`)

    if (sessions.length === 0) {
      console.log('No sessions found. Exiting.')
      return
    }

    let totalRadioMessages = 0
    let newRadioMessages = 0
    let skippedMessages = 0

    // Process each session
    for (const session of sessions) {
      console.log(`\n📍 Processing: ${session.session_name} - ${session.location} (${session.year})`)
      console.log(`   Session Key: ${session.session_key}`)

      // Fetch drivers for this session
      const drivers = await fetchDrivers({ session_key: session.session_key })
      console.log(`   Drivers: ${drivers.length}`)

      // Sync drivers to database
      for (const driver of drivers) {
        const { error: driverError } = await supabase
          .from('drivers')
          .upsert({
            number: driver.driver_number,
            name: driver.full_name,
            team: driver.team_name,
            team_color: driver.team_colour,
            country_code: driver.country_code,
            headshot_url: driver.headshot_url,
            name_acronym: driver.name_acronym,
          }, {
            onConflict: 'number',
            ignoreDuplicates: false,
          })

        if (driverError) {
          console.error(`   ❌ Error syncing driver ${driver.full_name}:`, driverError.message)
        }
      }

      // Sync race/session to database
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .upsert({
          name: session.session_name,
          location: session.location,
          season: session.year,
          race_date: session.date_start,
          session_key: session.session_key,
          meeting_key: session.meeting_key,
        }, {
          onConflict: 'session_key',
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (raceError) {
        console.error(`   ❌ Error syncing race:`, raceError.message)
        continue
      }

      // Fetch radio messages for this session
      const radioMessages = await fetchTeamRadio({ session_key: session.session_key })
      totalRadioMessages += radioMessages.length
      console.log(`   Radio Messages: ${radioMessages.length}`)

      // Sync radio messages to database
      for (const radio of radioMessages) {
        // Find driver in database
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('number', radio.driver_number)
          .single()

        if (!driverData) {
          console.warn(`   ⚠️  Driver not found for number ${radio.driver_number}`)
          skippedMessages++
          continue
        }

        // Check if radio message already exists
        const { data: existingClip } = await supabase
          .from('clips')
          .select('id')
          .eq('audio_url', radio.recording_url)
          .single()

        if (existingClip) {
          skippedMessages++
          continue
        }

        // Insert new radio message as a clip
        const { error: clipError } = await supabase
          .from('clips')
          .insert({
            title: `${session.session_name} - Driver ${radio.driver_number}`,
            audio_url: radio.recording_url,
            driver_id: driverData.id,
            race_id: raceData?.id,
            timestamp: radio.date,
            duration: 0,
            transcript: '',
          })

        if (clipError) {
          console.error(`   ❌ Error inserting clip:`, clipError.message)
        } else {
          newRadioMessages++
        }
      }

      console.log(`   ✅ Synced ${radioMessages.length} messages`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🏁 Sync Complete!')
    console.log('='.repeat(60))
    console.log(`Sessions Processed: ${sessions.length}`)
    console.log(`Total Radio Messages: ${totalRadioMessages}`)
    console.log(`New Messages Added: ${newRadioMessages}`)
    console.log(`Skipped (duplicates): ${skippedMessages}`)
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('\n❌ Error during sync:', error)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const year = args[0] ? parseInt(args[0]) : undefined

if (year && (isNaN(year) || year < 2023 || year > new Date().getFullYear())) {
  console.error('Invalid year. OpenF1 API has data from 2023 onwards.')
  process.exit(1)
}

// Run the sync
syncRadioMessages(year)
