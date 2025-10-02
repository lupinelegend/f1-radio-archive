# Quick Start: OpenF1 Integration

Get your F1 Radio Archive connected to the OpenF1 API in 5 minutes!

## Step 1: Install Dependencies

```bash
pnpm install
# or
npm install
```

This will install `tsx` (TypeScript executor) needed to run the sync scripts.

## Step 2: Run Database Migration

You need to add OpenF1-specific fields to your database. Choose one method:

### Option A: Supabase Dashboard (Easiest)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `scripts/005_add_openf1_fields.sql`
4. Paste and click **Run**

### Option B: Command Line
```bash
psql -h <your-supabase-host> -U postgres -d postgres -f scripts/005_add_openf1_fields.sql
```

## Step 3: Set Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Sync Radio Messages

Now you can pull F1 radio messages from OpenF1!

```bash
# Sync 2024 season
pnpm run sync:openf1:2024

# Or sync 2023 season
pnpm run sync:openf1:2023

# Or sync all available data
pnpm run sync:openf1
```

The script will:
- ✅ Fetch sessions from OpenF1 API
- ✅ Sync drivers with team info and photos
- ✅ Sync races and sessions
- ✅ Download radio messages with audio URLs
- ✅ Skip duplicates automatically

## Step 5: View Your Data

Start your dev server and see the radio messages:

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your F1 radio archive!

## What's Next?

### Automatic Syncing
Set up automatic syncing to get new radio messages during race weekends:

```bash
# Add to crontab (runs every hour)
0 * * * * cd /path/to/f1-radio-archive && pnpm run sync:openf1:2024
```

### API Route
You can also trigger syncs via HTTP:

```bash
curl -X POST http://localhost:3000/api/sync-radio \
  -H "Content-Type: application/json" \
  -d '{"year": 2024}'
```

### Custom Integration
Use the OpenF1 client directly in your code:

```typescript
import { fetchTeamRadio, fetchSessions } from '@/lib/openf1-api'

const sessions = await fetchSessions({ year: 2024 })
const radio = await fetchTeamRadio({ session_key: 9158 })
```

## Troubleshooting

### "Cannot find module 'tsx'"
Run: `pnpm install` or `npm install -g tsx`

### "No sessions found"
OpenF1 only has data from 2023 onwards. Try: `pnpm run sync:openf1:2023`

### "Missing Supabase credentials"
Check your `.env.local` file has all required environment variables.

### "Duplicate key error"
This is normal! The system automatically skips duplicate radio messages.

## Data Info

- **Available Years**: 2023 onwards
- **Real-Time Data**: ~10-30 second delay during live sessions
- **Radio Messages**: Limited selection (not all team radio is public)
- **API Cost**: Free! OpenF1 is a free, open-source API

## Full Documentation

For more details, see:
- `docs/OPENF1_INTEGRATION.md` - Complete integration guide
- [OpenF1 API Docs](https://openf1.org) - Official API documentation

## Need Help?

- Check the [OpenF1 GitHub](https://github.com/br-g/openf1)
- Visit [r/F1DataAnalysis](https://www.reddit.com/r/F1DataAnalysis/)
- Review the code in `lib/openf1-api.ts`

---

**Happy Racing! 🏎️💨**
