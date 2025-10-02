"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"

type Driver = { id: string; name: string; team: string }
type Race = { id: string; name: string; location: string; season: number }
type Category = { id: string; name: string }

interface FilterBarProps {
  drivers: Driver[]
  races: Race[]
  categories: Category[]
  locations: string[]
  sessions: string[]
  selectedDriver?: string
  selectedRace?: string
  selectedCategory?: string
  selectedSeason?: string
  selectedLocation?: string
  selectedSession?: string
}

export function FilterBar({
  drivers,
  races,
  categories,
  locations,
  sessions,
  selectedDriver,
  selectedRace,
  selectedCategory,
  selectedSeason,
  selectedLocation,
  selectedSession,
}: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const seasons = useMemo(() => {
    const uniqueSeasons = Array.from(new Set(races.map((race) => race.season)))
    return uniqueSeasons.sort((a, b) => b - a)
  }, [races])

  const filteredRaces = useMemo(() => {
    if (!selectedSeason) return races
    return races.filter((race) => race.season.toString() === selectedSeason)
  }, [races, selectedSeason])

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    if (key === "season") {
      params.delete("race")
    }

    router.push(`/?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("driver")
    params.delete("race")
    params.delete("category")
    params.delete("season")
    params.delete("location")
    params.delete("session")
    router.push(`/?${params.toString()}`)
  }

  const hasActiveFilters = selectedDriver || selectedRace || selectedCategory || selectedSeason || selectedLocation || selectedSession

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Driver Filter */}
        <Select
          value={selectedDriver || "all"}
          onValueChange={(value) => updateFilter("driver", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map((driver) => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedSeason || "all"}
          onValueChange={(value) => updateFilter("season", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Seasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            {seasons.map((season) => (
              <SelectItem key={season} value={season.toString()}>
                {season} Season
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location (Grand Prix) Filter */}
        <Select
          value={selectedLocation || "all"}
          onValueChange={(value) => updateFilter("location", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Grand Prix" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Grand Prix</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Session Type Filter */}
        <Select
          value={selectedSession || "all"}
          onValueChange={(value) => updateFilter("session", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Sessions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((session) => (
              <SelectItem key={session} value={session}>
                {session}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) => updateFilter("category", value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedDriver && (
            <Badge variant="secondary" className="gap-1">
              Driver: {drivers.find((d) => d.id === selectedDriver)?.name || "Unknown"}
              <button onClick={() => updateFilter("driver", null)} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedSeason && (
            <Badge variant="secondary" className="gap-1">
              Season: {selectedSeason}
              <button onClick={() => updateFilter("season", null)} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedRace && (
            <Badge variant="secondary" className="gap-1">
              Race: {races.find((r) => r.id === selectedRace)?.name || "Unknown"}
              <button onClick={() => updateFilter("race", null)} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.find((c) => c.id === selectedCategory)?.name || "Unknown"}
              <button onClick={() => updateFilter("category", null)} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedLocation && (
            <Badge variant="secondary" className="gap-1">
              Grand Prix: {selectedLocation}
              <button onClick={() => updateFilter("location", null)} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedSession && (
            <Badge variant="secondary" className="gap-1">
              Session: {selectedSession}
              <button onClick={() => updateFilter("session", null)} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
