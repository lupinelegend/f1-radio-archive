import { createClient } from "@/lib/supabase/server"
import { TranscriptEditor } from "@/components/admin/transcript-editor"
import { TranscriptSuggestions } from "@/components/admin/transcript-suggestions"

export default async function AdminTranscriptsPage() {
  const supabase = await createClient()

  // Fetch clips without transcripts
  const { data: clipsWithoutTranscripts } = await supabase
    .from("clips")
    .select(`
      *,
      driver:drivers(id, name, team, number),
      race:races(id, name, location, season)
    `)
    .is("transcript", null)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch pending transcript suggestions
  const { data: pendingSuggestions } = await supabase
    .from("transcript_suggestions")
    .select(`
      *,
      clip:clips(
        id,
        title,
        transcript,
        audio_url,
        driver:drivers(name),
        race:races(name, location, season)
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Transcript Management</h1>

        {/* Pending Suggestions */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Pending Suggestions ({pendingSuggestions?.length || 0})</h2>
          <TranscriptSuggestions suggestions={pendingSuggestions || []} />
        </div>

        {/* Clips Without Transcripts */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Clips Without Transcripts ({clipsWithoutTranscripts?.length || 0})</h2>
          <TranscriptEditor clips={clipsWithoutTranscripts || []} />
        </div>
      </div>
    </div>
  )
}
