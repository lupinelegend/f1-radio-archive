import { createClient } from "@/lib/supabase/server"
import { ClipsGrid } from "@/components/clips-grid"
import { Header } from "@/components/header"
import { Star } from "lucide-react"
import { redirect } from "next/navigation"

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's favorited clips
  const { data: favorites } = await supabase
    .from("favorites")
    .select("clip_id")
    .eq("user_id", user.id)

  const favoriteClipIds = favorites?.map((f) => f.clip_id) || []

  // Fetch clips
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
    .in("id", favoriteClipIds)
    .order("created_at", { ascending: false })

  const { data: clips } = await clipsQuery

  return (
    <div className="min-h-screen bg-background">
      <Header clipCount={clips?.length || 0} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Favorites Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
              <Star className="h-5 w-5" />
              <span className="font-semibold">My Favorites</span>
            </div>
          </div>

          {clips && clips.length > 0 ? (
            <ClipsGrid clips={clips} />
          ) : (
            <div className="text-center py-12">
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
              <p className="text-muted-foreground">
                Click the star icon on any clip to add it to your favorites
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
