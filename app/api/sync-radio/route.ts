import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTeamRadio, fetchSessions, fetchDrivers, fetchMeetings } from '@/lib/openf1-api'

/**
 * API Route to sync radio messages from OpenF1 to Supabase
 * 
 * Usage:
 * POST /api/sync-radio
 * Body: { session_key?: number, year?: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { session_key, year } = body

    const supabase = await createClient()

    // Fetch data from OpenF1
    console.log('Fetching data from OpenF1...')
    
    // Get sessions
    const sessions = await fetchSessions(
      session_key ? { session_key } : year ? { year } : undefined
    )
    
    if (sessions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No sessions found' 
      }, { status: 404 })
    }

    let totalRadioMessages = 0
    let newRadioMessages = 0

    // Process each session
    for (const session of sessions) {
      console.log(`Processing session: ${session.session_name} (${session.session_key})`)

      // Fetch drivers for this session
      const drivers = await fetchDrivers({ session_key: session.session_key })
      
      // Fetch radio messages for this session
      const radioMessages = await fetchTeamRadio({ session_key: session.session_key })
      totalRadioMessages += radioMessages.length

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
          console.error(`Error upserting driver ${driver.full_name}:`, driverError)
        }
      }

      // Sync race/meeting to database
      // Combine location and session name for better display
      const raceName = `${session.location} - ${session.session_name}`
      
      const { data: raceData, error: raceError } = await supabase
        .from('races')
        .upsert({
          name: raceName,
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
        console.error(`Error upserting race:`, raceError)
        continue
      }

      // Sync radio messages to database
      for (const radio of radioMessages) {
        // Find driver in database
        const { data: driverData } = await supabase
          .from('drivers')
          .select('id')
          .eq('number', radio.driver_number)
          .single()

        if (!driverData) {
          console.warn(`Driver not found for number ${radio.driver_number}`)
          continue
        }

        // Check if radio message already exists
        const { data: existingClip } = await supabase
          .from('clips')
          .select('id')
          .eq('audio_url', radio.recording_url)
          .single()

        if (existingClip) {
          console.log(`Radio message already exists: ${radio.recording_url}`)
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
            duration: 0, // Duration not provided by API
            transcript: '', // Transcript not provided by API
          })

        if (clipError) {
          console.error(`Error inserting clip:`, clipError)
        } else {
          newRadioMessages++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${newRadioMessages} new radio messages out of ${totalRadioMessages} total`,
      sessions_processed: sessions.length,
      total_radio_messages: totalRadioMessages,
      new_radio_messages: newRadioMessages,
    })

  } catch (error) {
    console.error('Error syncing radio messages:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to fetch available sessions
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    const sessions = await fetchSessions(
      year ? { year: parseInt(year) } : undefined
    )

    return NextResponse.json({
      success: true,
      sessions,
    })

  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
