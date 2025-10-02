import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CompilationCard } from "@/components/compilation-card"
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

          <div>
            <h2 className="font-bold text-2xl mb-2">Curated Compilations</h2>
            <p className="text-muted-foreground">Expertly curated collections of the best F1 radio moments</p>
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
