# OpenF1 API Integration

This document explains how to use the OpenF1 API integration to fetch and sync F1 radio messages to your database.

## Overview

The F1 Radio Archive is now connected to the [OpenF1 API](https://openf1.org), which provides real-time and historical Formula 1 data, including team radio messages.

## Features

- **Automatic Radio Sync**: Fetch team radio messages from OpenF1 API
- **Driver Data**: Sync driver information including names, teams, and photos
- **Race/Session Data**: Import race weekends and sessions
- **Historical Data**: Access data from 2023 onwards

## Setup

### 1. Database Migration

First, run the migration to add OpenF1-specific fields to your database:

```bash
# Connect to your Supabase project and run:
psql -h <your-supabase-host> -U postgres -d postgres -f scripts/005_add_openf1_fields.sql
```

Or run it directly in the Supabase SQL Editor:
- Go to your Supabase Dashboard
- Navigate to SQL Editor
- Copy and paste the contents of `scripts/005_add_openf1_fields.sql`
- Click "Run"

### 2. Environment Variables

Ensure you have the following environment variables set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For scripts
```

## Usage

### Method 1: Using the Sync Script (Recommended)

The easiest way to sync radio messages is using the command-line script:

```bash
# Install tsx if you haven't already
npm install -g tsx

# Sync all available sessions
npx tsx scripts/sync-openf1.ts

# Sync a specific year (2023 onwards)
npx tsx scripts/sync-openf1.ts 2024
npx tsx scripts/sync-openf1.ts 2023
```

The script will:
1. Fetch sessions from OpenF1
2. Sync drivers to your database
3. Sync races/sessions to your database
4. Download and store radio messages
5. Skip duplicates automatically

### Method 2: Using the API Route

You can also trigger syncs via HTTP requests:

```bash
# Sync all sessions
curl -X POST http://localhost:3000/api/sync-radio \
  -H "Content-Type: application/json" \
  -d '{}'

# Sync a specific year
curl -X POST http://localhost:3000/api/sync-radio \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}'

# Sync a specific session
curl -X POST http://localhost:3000/api/sync-radio \
  -H "Content-Type: application/json" \
  -d '{"session_key": 9158}'

# Get available sessions
curl http://localhost:3000/api/sync-radio?year=2024
```

### Method 3: Using the OpenF1 API Client Directly

You can also use the API client in your own code:

```typescript
import { fetchTeamRadio, fetchSessions, fetchDrivers } from '@/lib/openf1-api'

// Fetch latest radio messages
const radioMessages = await fetchTeamRadio({ 
  session_key: 9158 
})

// Fetch sessions for a year
const sessions = await fetchSessions({ 
  year: 2024 
})

// Fetch drivers for a session
const drivers = await fetchDrivers({ 
  session_key: 9158 
})
```

## OpenF1 API Reference

### Team Radio Endpoint

```
GET https://api.openf1.org/v1/team_radio
```

**Parameters:**
- `session_key` - Filter by session
- `driver_number` - Filter by driver number
- `date>=` - Filter by start date
- `date<=` - Filter by end date

**Response:**
```json
[
  {
    "date": "2023-09-15T09:40:43.005000+00:00",
    "driver_number": 11,
    "meeting_key": 1219,
    "recording_url": "https://livetiming.formula1.com/static/.../TeamRadio/....mp3",
    "session_key": 9158
  }
]
```

### Other Available Endpoints

- `/v1/sessions` - Race sessions
- `/v1/drivers` - Driver information
- `/v1/meetings` - Race weekends
- `/v1/car_data` - Telemetry data
- `/v1/position` - Driver positions
- `/v1/laps` - Lap times

See [OpenF1 Documentation](https://openf1.org) for full API reference.

## Database Schema

### New Fields Added

**drivers table:**
- `team_color` - Team color hex code
- `country_code` - ISO country code
- `headshot_url` - Driver photo URL
- `name_acronym` - Three-letter acronym (e.g., "VER", "HAM")

**races table:**
- `session_key` - OpenF1 session identifier (unique)
- `meeting_key` - OpenF1 meeting identifier

**clips table:**
- `timestamp` - Radio message timestamp
- `audio_url` - Unique constraint to prevent duplicates

## Scheduling Automatic Syncs

To automatically sync new radio messages, you can:

### Option 1: Cron Job

Add a cron job to run the sync script periodically:

```bash
# Run every hour during race weekends
0 * * * * cd /path/to/f1-radio-archive && npx tsx scripts/sync-openf1.ts 2024
```

### Option 2: Vercel Cron (if deployed on Vercel)

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/sync-radio",
    "schedule": "0 * * * *"
  }]
}
```

### Option 3: GitHub Actions

Create `.github/workflows/sync-radio.yml`:

```yaml
name: Sync F1 Radio Messages
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx tsx scripts/sync-openf1.ts 2024
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

## Troubleshooting

### "No sessions found"
- OpenF1 API only has data from 2023 onwards
- Check if the year parameter is valid

### "Driver not found"
- Ensure drivers are synced before radio messages
- The sync script handles this automatically

### "Duplicate key error"
- This is normal - the system skips duplicates
- Use unique constraints to prevent duplicate data

### Rate Limiting
- OpenF1 API is free and has no strict rate limits
- Be considerate and don't hammer the API
- The sync script includes reasonable delays

## Data Availability

- **Historical Data**: 2023 onwards
- **Real-Time Data**: Available during live sessions
- **Radio Messages**: Limited selection (not all radio messages are public)
- **Update Frequency**: Real-time data has ~10-30 second delay

## Contributing

To add more OpenF1 endpoints or features:

1. Add new functions to `lib/openf1-api.ts`
2. Update the sync script in `scripts/sync-openf1.ts`
3. Add database migrations if needed
4. Update this documentation

## Resources

- [OpenF1 API Documentation](https://openf1.org)
- [OpenF1 GitHub](https://github.com/br-g/openf1)
- [F1 Data Analysis Community](https://www.reddit.com/r/F1DataAnalysis/)
