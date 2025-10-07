"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { updateTranscript } from "@/app/actions/transcripts"
import { useState } from "react"

type Clip = {
  id: string
  title: string
  audio_url: string
  transcript: string | null
  driver: { id: string; name: string; team: string; number: number | null } | null
  race: { id: string; name: string; location: string; season: number } | null
}

export function TranscriptEditor({ clips }: { clips: Clip[] }) {
  const [editingClip, setEditingClip] = useState<string | null>(null)
  const [transcriptValue, setTranscriptValue] = useState("")
  const [saving, setSaving] = useState(false)

  const handleEdit = (clip: Clip) => {
    setEditingClip(clip.id)
    setTranscriptValue(clip.transcript || "")
  }

  const handleSave = async (clipId: string) => {
    setSaving(true)
    const result = await updateTranscript(clipId, transcriptValue)
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      setEditingClip(null)
      window.location.reload()
    }
    setSaving(false)
  }

  if (clips.length === 0) {
    return <p className="text-muted-foreground">All clips have transcripts!</p>
  }

  return (
    <div className="space-y-4">
      {clips.map((clip) => (
        <Card key={clip.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {clip.driver?.name} #{clip.driver?.number} - {clip.race?.location} {clip.race?.season}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{clip.race?.name}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Audio Player */}
            <audio controls className="w-full">
              <source src={clip.audio_url} type="audio/mpeg" />
            </audio>

            {/* Transcript Editor */}
            {editingClip === clip.id ? (
              <div className="space-y-2">
                <textarea
                  className="w-full min-h-[100px] p-3 text-sm rounded border bg-background"
                  value={transcriptValue}
                  onChange={(e) => setTranscriptValue(e.target.value)}
                  placeholder="Enter transcript..."
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingClip(null)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(clip.id)}
                    disabled={saving || !transcriptValue.trim()}
                  >
                    {saving ? "Saving..." : "Save Transcript"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground italic">
                  {clip.transcript || "No transcript"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(clip)}
                >
                  Add Transcript
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
