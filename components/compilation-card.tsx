"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Music } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AudioPlayer } from "@/components/audio-player"

type Compilation = {
  id: string
  title: string
  description: string | null
  is_featured: boolean
  compilation_clips: {
    clip: {
      id: string
      title: string
      audio_url: string
      duration: number | null
      driver: { name: string; number: number | null } | null
      race: { name: string; season: number } | null
    } | null
  }[]
}

export function CompilationCard({ compilation }: { compilation: Compilation }) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [currentClipIndex, setCurrentClipIndex] = useState(0)

  const clips = compilation.compilation_clips.map((cc) => cc.clip).filter(Boolean)
  const currentClip = clips[currentClipIndex]

  const handleNextClip = () => {
    if (currentClipIndex < clips.length - 1) {
      setCurrentClipIndex(currentClipIndex + 1)
    }
  }

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight text-balance">{compilation.title}</CardTitle>
            {compilation.is_featured && (
              <Badge variant="default" className="shrink-0">
                Featured
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Description */}
          {compilation.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{compilation.description}</p>
          )}

          {/* Clip Count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Music className="h-4 w-4" />
            <span>{clips.length} clips</span>
          </div>

          {/* Play Button */}
          <Button
            size="sm"
            onClick={() => {
              setCurrentClipIndex(0)
              setIsPlayerOpen(true)
            }}
            className="w-full gap-2"
            disabled={clips.length === 0}
          >
            <Play className="h-4 w-4" />
            Play Compilation
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-balance">{compilation.title}</DialogTitle>
            <DialogDescription>
              Track {currentClipIndex + 1} of {clips.length}
            </DialogDescription>
          </DialogHeader>

          {currentClip && (
            <div className="space-y-4">
              {/* Current Clip Info */}
              <div className="bg-muted rounded-lg p-4">
                <p className="font-medium text-sm mb-1">{currentClip.title}</p>
                <p className="text-xs text-muted-foreground">
                  {currentClip.driver?.name} - {currentClip.race?.name} {currentClip.race?.season}
                </p>
              </div>

              {/* Audio Player */}
              <AudioPlayer
                audioUrl={currentClip.audio_url}
                title={currentClip.title}
                autoPlay
                onEnded={handleNextClip}
              />

              {/* Playlist */}
              <div>
                <p className="text-sm font-medium mb-2">Playlist</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {clips.map((clip, index) => (
                    <button
                      key={clip.id}
                      onClick={() => setCurrentClipIndex(index)}
                      className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                        index === currentClipIndex ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <p className="font-medium line-clamp-1">{clip.title}</p>
                      <p className="text-xs opacity-80">
                        {clip.driver?.name} - {clip.race?.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
