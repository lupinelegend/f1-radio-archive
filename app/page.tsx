import { createClient } from "@/lib/supabase/server"
import { ClipsGrid } from "@/components/clips-grid"
import { SearchBar } from "@/components/search-bar"
import { FilterBar } from "@/components/filter-bar"
import { Header } from "@/components/header"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    driver?: string
    race?: string
    category?: string
    season?: string
    location?: string
    session?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch filters data
  const [driversResult, racesResult, categoriesResult] = await Promise.all([
    supabase.from("drivers").select("id, name, team").order("name"),
    supabase.from("races").select("id, name, location, season").order("race_date", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
  ])

  // Build clips query with filters
  let clipsQuery = supabase
    .from("clips")
    .select(
      `
      *,
      driver:drivers(id, name, team, number),
      race:races(id, name, location, season),
      clip_tags(category:categories(id, name))
    `,
    )
    .order("created_at", { ascending: false })

  // Apply search filter
  if (params.search) {
    clipsQuery = clipsQuery.or(`title.ilike.%${params.search}%,transcript.ilike.%${params.search}%`)
  }

  // Apply driver filter
  if (params.driver) {
    clipsQuery = clipsQuery.eq("driver_id", params.driver)
  }

  // Apply race filter
  if (params.race) {
    clipsQuery = clipsQuery.eq("race_id", params.race)
  }

  // Increase limit to get all clips
  clipsQuery = clipsQuery.limit(10000)

  const { data: clips } = await clipsQuery

  // Filter by category if needed (post-query since it's in junction table)
  let filteredClips = clips || []
  if (params.category) {
    filteredClips = filteredClips.filter((clip) =>
      clip.clip_tags?.some((tag: any) => tag.category?.id === params.category),
    )
  }

  if (params.season) {
    filteredClips = filteredClips.filter((clip) => clip.race?.season.toString() === params.season)
  }

  // Filter by location (Grand Prix)
  if (params.location) {
    filteredClips = filteredClips.filter((clip) => clip.race?.location === params.location)
  }

  // Filter by session type
  if (params.session) {
    filteredClips = filteredClips.filter((clip) => {
      const sessionName = clip.race?.name?.split(' - ')[1] // Extract session from "Location - Session"
      return sessionName === params.session
    })
  }

  // Get unique locations and sessions for filters
  const uniqueLocations = [...new Set(racesResult.data?.map(r => r.location).filter(Boolean))]
  const uniqueSessions = [...new Set(racesResult.data?.map(r => {
    const parts = r.name?.split(' - ')
    return parts && parts.length > 1 ? parts[1] : null
  }).filter(Boolean))]

  return (
    <div className="min-h-screen bg-background">
      <Header clipCount={filteredClips.length} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Search Bar */}
          <SearchBar initialSearch={params.search} />

          {/* Filter Bar */}
          <FilterBar
            drivers={driversResult.data || []}
            races={racesResult.data || []}
            categories={categoriesResult.data || []}
            locations={uniqueLocations}
            sessions={uniqueSessions}
            selectedDriver={params.driver}
            selectedRace={params.race}
            selectedCategory={params.category}
            selectedSeason={params.season}
            selectedLocation={params.location}
            selectedSession={params.session}
          />

          {/* Clips Grid */}
          <ClipsGrid clips={filteredClips} />
        </div>
      </main>
    </div>
  )
}
