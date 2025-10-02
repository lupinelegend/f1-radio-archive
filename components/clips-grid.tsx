import { ClipCard } from "@/components/clip-card"

type Clip = {
  id: string
  title: string
  audio_url: string
  transcript: string | null
  duration: number | null
  is_premium: boolean
  driver: { id: string; name: string; team: string; number: number | null } | null
  race: { id: string; name: string; location: string; season: number } | null
  clip_tags: { category: { id: string; name: string } | null }[] | null
}

export function ClipsGrid({ clips }: { clips: Clip[] }) {
  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-lg">No clips found</p>
        <p className="text-muted-foreground text-sm mt-2">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </div>
  )
}
