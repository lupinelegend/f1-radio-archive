"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Download, Play } from "lucide-react"
import { createCompilation } from "@/app/actions/compilations"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AudioPlayer } from "@/components/audio-player"
import { createClient } from "@/lib/supabase/client"

type Clip = {
  id: string
  title: string
  audio_url: string
  transcript: string | null
  driver: { name: string } | null
  race: { name: string; location: string; season: number } | null
}

type Driver = { id: string; name: string }
type Race = { id: string; name: string; location: string; season: number }
type Category = { id: string; name: string }

export function CompilationBuilder({ 
  drivers, 
  races, 
  categories 
}: { 
  drivers: Driver[]
  races: Race[]
  categories: Category[]
}) {
  const [selectedClips, setSelectedClips] = useState<Clip[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewClip, setPreviewClip] = useState<Clip | null>(null)
  const [availableClips, setAvailableClips] = useState<Clip[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Filters
  const [selectedDriver, setSelectedDriver] = useState<string>("all")
  const [selectedRace, setSelectedRace] = useState<string>("all")
  const [selectedSeason, setSelectedSeason] = useState<string>("all")
  const [selectedSession, setSelectedSession] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  const supabase = createClient()

  // Fetch clips based on filters
  useEffect(() => {
    if (showBuilder) {
      fetchClips()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriver, selectedRace, selectedSeason, selectedSession, selectedCategory, searchQuery, showBuilder])

  const fetchClips = async () => {
    setIsLoading(true)
    
    try {
      let query = supabase
        .from("clips")
        .select(`
          id,
          title,
          audio_url,
          transcript,
          driver:drivers(name),
          race:races(name, location, season)
        `)
        .order("created_at", { ascending: false })
        .limit(25)

      if (selectedDriver && selectedDriver !== "all") {
        query = query.eq("driver_id", selectedDriver)
      }
      if (selectedRace && selectedRace !== "all") {
        // selectedRace is now a location, so filter by location
        const locationRaces = races.filter(r => r.location === selectedRace).map(r => r.id)
        if (locationRaces.length > 0) {
          query = query.in("race_id", locationRaces)
        }
      }
      if (selectedSeason && selectedSeason !== "all") {
        const seasonRaces = races.filter(r => r.season.toString() === selectedSeason).map(r => r.id)
        if (seasonRaces.length > 0) {
          query = query.in("race_id", seasonRaces)
        }
      }
      if (selectedSession && selectedSession !== "all") {
        const sessionRaces = races.filter(r => r.name.includes(selectedSession)).map(r => r.id)
        if (sessionRaces.length > 0) {
          query = query.in("race_id", sessionRaces)
        }
      }
      if (selectedCategory && selectedCategory !== "all") {
        // Need to join with clip_tags to filter by category
        const { data: taggedClips } = await supabase
          .from("clip_tags")
          .select("clip_id")
          .eq("category_id", selectedCategory)
        
        if (taggedClips && taggedClips.length > 0) {
          const clipIds = taggedClips.map(t => t.clip_id)
          query = query.in("id", clipIds)
        }
      }
      if (searchQuery) {
        query = query.or(`transcript.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query
      
      if (error) {
        console.error("Error fetching clips:", error)
        setAvailableClips([])
      } else {
        setAvailableClips(data || [])
      }
    } catch (error) {
      console.error("Error in fetchClips:", error)
      setAvailableClips([])
    } finally {
      setIsLoading(false)
    }
  }

  const addClip = (clip: Clip) => {
    if (selectedClips.length >= 10) {
      alert("Maximum 10 clips per compilation")
      return
    }
    if (selectedClips.find(c => c.id === clip.id)) {
      alert("Clip already added")
      return
    }
    setSelectedClips([...selectedClips, clip])
  }

  const removeClip = (clipId: string) => {
    setSelectedClips(selectedClips.filter(c => c.id !== clipId))
  }

  const moveClip = (index: number, direction: 'up' | 'down') => {
    const newClips = [...selectedClips]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= newClips.length) return
    
    [newClips[index], newClips[newIndex]] = [newClips[newIndex], newClips[index]]
    setSelectedClips(newClips)
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Please enter a title")
      return
    }
    if (selectedClips.length === 0) {
      alert("Please add at least one clip")
      return
    }

    setIsCreating(true)
    const result = await createCompilation(
      title,
      description,
      selectedClips.map(c => c.id)
    )

    if (result.error) {
      alert("Error: " + result.error)
    } else {
      alert("Compilation created! Processing download...")
      // Trigger download
      window.location.href = `/api/compile?id=${result.compilationId}`
      
      // Reset form
      setTitle("")
      setDescription("")
      setSelectedClips([])
      setShowBuilder(false)
    }
    setIsCreating(false)
  }

  if (!showBuilder) {
    return (
      <Button onClick={() => setShowBuilder(true)} size="lg" className="w-full">
        <Plus className="mr-2 h-5 w-5" />
        Create New Compilation
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Compilation</CardTitle>
          <CardDescription>Select up to 10 clips to merge into a single audio file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              placeholder="My F1 Radio Compilation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Description (optional)</label>
            <Textarea
              placeholder="Best moments from..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Selected Clips ({selectedClips.length}/10)
            </label>
            {selectedClips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No clips selected yet</p>
            ) : (
              <div className="space-y-2">
                {selectedClips.map((clip, index) => (
                  <div key={clip.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-sm font-medium w-6">{index + 1}.</span>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{clip.driver?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {clip.race?.location} {clip.race?.season}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveClip(index, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveClip(index, 'down')}
                        disabled={index === selectedClips.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeClip(clip.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={isCreating || selectedClips.length === 0}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create & Download"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowBuilder(false)
                setSelectedClips([])
                setTitle("")
                setDescription("")
              }}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Clips</CardTitle>
          <CardDescription>Search, preview, and add clips to your compilation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                {[...new Set(races.map(r => r.season))].sort((a, b) => b - a).map(season => (
                  <SelectItem key={season} value={season.toString()}>{season} Season</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRace} onValueChange={setSelectedRace}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Grand Prix" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grand Prix</SelectItem>
                {[...new Set(races.map(r => r.location))].sort().map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Sessions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {[...new Set(races.map(r => {
                  const match = r.name.match(/(Practice|Qualifying|Sprint|Race)/i)
                  return match ? match[0] : null
                }).filter(Boolean))].sort().map(session => (
                  <SelectItem key={session} value={session!}>
                    {session}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {(selectedDriver !== "all" || selectedSeason !== "all" || selectedRace !== "all" || selectedSession !== "all" || selectedCategory !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedDriver("all")
                  setSelectedSeason("all")
                  setSelectedRace("all")
                  setSelectedSession("all")
                  setSelectedCategory("all")
                }} 
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Clips List */}
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {availableClips
              .filter(clip => {
                if (!searchQuery) return true
                const query = searchQuery.toLowerCase()
                return (
                  clip.driver?.name.toLowerCase().includes(query) ||
                  clip.race?.location.toLowerCase().includes(query) ||
                  clip.transcript?.toLowerCase().includes(query)
                )
              })
              .map((clip) => (
                <div
                  key={clip.id}
                  className={`p-3 rounded border transition-colors ${
                    selectedClips.find(c => c.id === clip.id)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1" onClick={() => addClip(clip)}>
                      <p className="font-medium text-sm">{clip.driver?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {clip.race?.location} - {clip.race?.name} {clip.race?.season}
                      </p>
                      {clip.transcript && (
                        <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                          "{clip.transcript}"
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewClip(clip)
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewClip !== null} onOpenChange={() => setPreviewClip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewClip?.driver?.name}</DialogTitle>
          </DialogHeader>
          {previewClip && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {previewClip.race?.location} - {previewClip.race?.name} {previewClip.race?.season}
              </p>
              {previewClip.transcript && (
                <p className="text-sm italic">"{previewClip.transcript}"</p>
              )}
              <AudioPlayer audioUrl={previewClip.audio_url} title={previewClip.title} autoPlay />
              <Button onClick={() => {
                addClip(previewClip)
                setPreviewClip(null)
              }} className="w-full">
                Add to Compilation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
