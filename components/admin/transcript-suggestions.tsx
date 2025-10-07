"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { reviewSuggestion } from "@/app/actions/transcripts"
import { useState } from "react"
import { Check, X } from "lucide-react"

type Suggestion = {
  id: string
  suggested_transcript: string
  created_at: string
  user_id: string
  clip: {
    id: string
    title: string
    transcript: string | null
    audio_url: string
    driver: { name: string } | null
    race: { name: string; location: string; season: number } | null
  } | null
}

export function TranscriptSuggestions({ suggestions }: { suggestions: Suggestion[] }) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  const handleReview = async (suggestionId: string, action: 'approve' | 'reject') => {
    setProcessing(suggestionId)
    const result = await reviewSuggestion(suggestionId, action)
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      window.location.reload()
    }
    setProcessing(null)
  }

  const handleApproveAll = async () => {
    if (!confirm(`Are you sure you want to approve all ${suggestions.length} transcript suggestions?`)) {
      return
    }

    setApprovingAll(true)
    
    for (const suggestion of suggestions) {
      await reviewSuggestion(suggestion.id, 'approve')
    }
    
    window.location.reload()
  }

  if (suggestions.length === 0) {
    return <p className="text-muted-foreground">No pending suggestions</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleApproveAll}
          disabled={approvingAll}
          variant="default"
        >
          {approvingAll ? `Approving ${suggestions.length}...` : `Approve All (${suggestions.length})`}
        </Button>
      </div>
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {suggestion.clip?.driver?.name} - {suggestion.clip?.race?.location} {suggestion.clip?.race?.season}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  User ID: {suggestion.user_id}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(suggestion.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleReview(suggestion.id, 'approve')}
                  disabled={processing === suggestion.id}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReview(suggestion.id, 'reject')}
                  disabled={processing === suggestion.id}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Transcript */}
            <div>
              <p className="text-sm font-medium mb-1">Current Transcript:</p>
              <div className="bg-muted rounded p-3">
                <p className="text-sm italic">
                  {suggestion.clip?.transcript || <span className="text-muted-foreground">No transcript</span>}
                </p>
              </div>
            </div>

            {/* Suggested Transcript */}
            <div>
              <p className="text-sm font-medium mb-1">Suggested Transcript:</p>
              <div className="bg-green-50 dark:bg-green-950 rounded p-3 border border-green-200 dark:border-green-800">
                <p className="text-sm italic">{suggestion.suggested_transcript}</p>
              </div>
            </div>

            {/* Audio Player */}
            {suggestion.clip?.audio_url && (
              <audio controls className="w-full">
                <source src={suggestion.clip.audio_url} type="audio/mpeg" />
              </audio>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
