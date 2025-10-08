"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Download } from "lucide-react"
import { createCompilation } from "@/app/actions/compilations"

type Clip = {
  id: string
  title: string
  audio_url: string
  driver: { name: string } | null
  race: { name: string; location: string; season: number } | null
}

export function CompilationBuilder({ availableClips }: { availableClips: Clip[] }) {
  const [selectedClips, setSelectedClips] = useState<Clip[]>([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showBuilder, setShowBuilder] = useState(false)

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
          <CardDescription>Click on clips to add them to your compilation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {availableClips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => addClip(clip)}
                disabled={selectedClips.find(c => c.id === clip.id) !== undefined}
                className="text-left p-3 rounded border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="font-medium text-sm">{clip.driver?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {clip.race?.location} - {clip.race?.name} {clip.race?.season}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
