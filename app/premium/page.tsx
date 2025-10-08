import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompilationCard } from "@/components/compilation-card"
import { CompilationBuilder } from "@/components/compilation-builder"
import { Header } from "@/components/header"
import { Crown } from "lucide-react"

export default async function PremiumPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all compilations (authenticated users can see all)
  const { data: compilations } = await supabase
    .from("compilations")
    .select(
      `
      *,
      compilation_clips(
        clip:clips(
          id,
          title,
          audio_url,
          duration,
          driver:drivers(name, number),
          race:races(name, season)
        )
      )
    `,
    )
    .order("created_at", { ascending: false })

  // Fetch all clips for the builder
  const { data: allClips } = await supabase
    .from("clips")
    .select(`
      id,
      title,
      audio_url,
      driver:drivers(name),
      race:races(name, location, season)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="min-h-screen bg-background">
      <Header clipCount={0} />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Premium Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
              <Crown className="h-5 w-5" />
              <span className="font-semibold">Premium Content</span>
            </div>
          </div>

          {/* Compilation Builder */}
          <div>
            <h2 className="font-bold text-2xl mb-2">Create Your Own Compilation</h2>
            <p className="text-muted-foreground mb-4">Select up to 10 clips and merge them into a single downloadable file</p>
            <CompilationBuilder availableClips={allClips || []} />
          </div>

          <div>
            <h2 className="font-bold text-2xl mb-2">Your Compilations</h2>
            <p className="text-muted-foreground">Previously created compilations</p>
          </div>

          {/* Compilations Grid */}
          {compilations && compilations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {compilations.map((compilation) => (
                <CompilationCard key={compilation.id} compilation={compilation} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-lg">No compilations available yet</p>
              <p className="text-muted-foreground text-sm mt-2">Check back soon for curated content</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
