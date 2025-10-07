"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { reviewTagSuggestion } from "@/app/actions/tags"
import { useState } from "react"
import { Check, X } from "lucide-react"

type TagSuggestion = {
  id: string
  suggested_category_name: string | null
  created_at: string
  user_id: string
  category: { id: string; name: string } | null
  clip: {
    id: string
    title: string
    audio_url: string
    driver: { name: string } | null
    race: { name: string; location: string; season: number } | null
  } | null
}

export function TagSuggestions({ suggestions }: { suggestions: TagSuggestion[] }) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [approvingAll, setApprovingAll] = useState(false)

  const handleReview = async (suggestionId: string, action: 'approve' | 'reject') => {
    setProcessing(suggestionId)
    const result = await reviewTagSuggestion(suggestionId, action)
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      window.location.reload()
    }
    setProcessing(null)
  }

  const handleApproveAll = async () => {
    if (!confirm(`Are you sure you want to approve all ${suggestions.length} tag suggestions?`)) {
      return
    }

    setApprovingAll(true)
    
    for (const suggestion of suggestions) {
      await reviewTagSuggestion(suggestion.id, 'approve')
    }
    
    window.location.reload()
  }

  if (suggestions.length === 0) {
    return <p className="text-muted-foreground">No pending tag suggestions</p>
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
            {/* Suggested Tag */}
            <div>
              <p className="text-sm font-medium mb-2">Suggested Tag:</p>
              {suggestion.suggested_category_name ? (
                <Badge variant="default" className="text-sm">
                  {suggestion.suggested_category_name} <span className="ml-1 text-xs">(New)</span>
                </Badge>
              ) : suggestion.category ? (
                <Badge variant="secondary" className="text-sm">
                  {suggestion.category.name}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Unknown tag</span>
              )}
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
