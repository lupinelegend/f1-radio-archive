import { createClient } from "@/lib/supabase/server"
import { TranscriptEditor } from "@/components/admin/transcript-editor"
import { TranscriptSuggestions } from "@/components/admin/transcript-suggestions"
import { TagSuggestions } from "@/components/admin/tag-suggestions"
import { UpdateSection } from "@/components/admin/update-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
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
  const { data: pendingTranscriptSuggestions } = await supabase
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

  // Fetch pending tag suggestions
  const { data: pendingTagSuggestions } = await supabase
    .from("tag_suggestions")
    .select(`
      *,
      category:categories(id, name),
      clip:clips(
        id,
        title,
        audio_url,
        driver:drivers(name),
        race:races(name, location, season)
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  // Get stats
  const transcriptSuggestionsCount = pendingTranscriptSuggestions?.length || 0
  const tagSuggestionsCount = pendingTagSuggestions?.length || 0
  const clipsNeedingTranscriptsCount = clipsWithoutTranscripts?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage transcripts, tags, and user suggestions</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Transcript Suggestions</CardDescription>
              <CardTitle className="text-3xl">{transcriptSuggestionsCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Tag Suggestions</CardDescription>
              <CardTitle className="text-3xl">{tagSuggestionsCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Clips Without Transcripts</CardDescription>
              <CardTitle className="text-3xl">{clipsNeedingTranscriptsCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="update" className="space-y-4">
          <TabsList>
            <TabsTrigger value="update">
              Update
            </TabsTrigger>
            <TabsTrigger value="transcript-suggestions">
              Transcript Suggestions ({transcriptSuggestionsCount})
            </TabsTrigger>
            <TabsTrigger value="tag-suggestions">
              Tag Suggestions ({tagSuggestionsCount})
            </TabsTrigger>
            <TabsTrigger value="add-transcripts">
              Add Transcripts ({clipsNeedingTranscriptsCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Update Database</h2>
              <UpdateSection />
            </div>
          </TabsContent>

          <TabsContent value="transcript-suggestions" className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Pending Transcript Suggestions</h2>
              <TranscriptSuggestions suggestions={pendingTranscriptSuggestions || []} />
            </div>
          </TabsContent>

          <TabsContent value="tag-suggestions" className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Pending Tag Suggestions</h2>
              <TagSuggestions suggestions={pendingTagSuggestions || []} />
            </div>
          </TabsContent>

          <TabsContent value="add-transcripts" className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Clips Without Transcripts</h2>
              <TranscriptEditor clips={clipsWithoutTranscripts || []} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
