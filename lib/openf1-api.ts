/**
 * OpenF1 API Client
 * Documentation: https://openf1.org
 */

const OPENF1_BASE_URL = 'https://api.openf1.org/v1'

export interface TeamRadioMessage {
  date: string
  driver_number: number
  meeting_key: number
  recording_url: string
  session_key: number
}

export interface Session {
  circuit_key: number
  circuit_short_name: string
  country_code: string
  country_key: number
  country_name: string
  date_end: string
  date_start: string
  gmt_offset: string
  location: string
  meeting_key: number
  session_key: number
  session_name: string
  session_type: string
  year: number
}

export interface Driver {
  broadcast_name: string
  country_code: string
  driver_number: number
  first_name: string
  full_name: string
  headshot_url: string
  last_name: string
  meeting_key: number
  name_acronym: string
  session_key: number
  team_colour: string
  team_name: string
}

export interface Meeting {
  circuit_key: number
  circuit_short_name: string
  country_code: string
  country_key: number
  country_name: string
  date_start: string
  gmt_offset: string
  location: string
  meeting_key: number
  meeting_name: string
  meeting_official_name: string
  year: number
}

/**
 * Fetch team radio messages from OpenF1 API
 */
export async function fetchTeamRadio(params: {
  session_key?: number
  driver_number?: number
  date_start?: string
  date_end?: string
}): Promise<TeamRadioMessage[]> {
  const queryParams = new URLSearchParams()
  
  if (params.session_key) queryParams.append('session_key', params.session_key.toString())
  if (params.driver_number) queryParams.append('driver_number', params.driver_number.toString())
  if (params.date_start) queryParams.append('date>=', params.date_start)
  if (params.date_end) queryParams.append('date<=', params.date_end)

  const url = `${OPENF1_BASE_URL}/team_radio?${queryParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch sessions from OpenF1 API
 */
export async function fetchSessions(params?: {
  session_key?: number
  meeting_key?: number
  year?: number
  session_name?: string
}): Promise<Session[]> {
  const queryParams = new URLSearchParams()
  
  if (params?.session_key) queryParams.append('session_key', params.session_key.toString())
  if (params?.meeting_key) queryParams.append('meeting_key', params.meeting_key.toString())
  if (params?.year) queryParams.append('year', params.year.toString())
  if (params?.session_name) queryParams.append('session_name', params.session_name)

  const url = `${OPENF1_BASE_URL}/sessions?${queryParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch drivers from OpenF1 API
 */
export async function fetchDrivers(params?: {
  session_key?: number
  driver_number?: number
}): Promise<Driver[]> {
  const queryParams = new URLSearchParams()
  
  if (params?.session_key) queryParams.append('session_key', params.session_key.toString())
  if (params?.driver_number) queryParams.append('driver_number', params.driver_number.toString())

  const url = `${OPENF1_BASE_URL}/drivers?${queryParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch meetings (race weekends) from OpenF1 API
 */
export async function fetchMeetings(params?: {
  meeting_key?: number
  year?: number
}): Promise<Meeting[]> {
  const queryParams = new URLSearchParams()
  
  if (params?.meeting_key) queryParams.append('meeting_key', params.meeting_key.toString())
  if (params?.year) queryParams.append('year', params.year.toString())

  const url = `${OPENF1_BASE_URL}/meetings?${queryParams.toString()}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch latest team radio messages
 */
export async function fetchLatestTeamRadio(): Promise<TeamRadioMessage[]> {
  const url = `${OPENF1_BASE_URL}/team_radio?date>=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}`
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`OpenF1 API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
