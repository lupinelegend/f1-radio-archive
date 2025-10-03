"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Lock, ThumbsUp, ThumbsDown } from "lucide-react"
import { useState, useEffect } from "react"
import { AudioPlayer } from "@/components/audio-player"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

type Clip = {
  id: string
  title: string
  audio_url: string
  transcript: string | null
  duration: number | null
  is_premium: boolean
  driver: { id: string; name: string; team: string; number: number | null } | null
  race: { id: string; name: string; location: string; season: number } | null
  clip_tags: { category: { id: string; name: string } | null }[] | null
}

export function ClipCard({ clip }: { clip: Clip }) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null)
  const [voteCount, setVoteCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndVotes()
  }, [])

  const checkAuthAndVotes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setIsAuthenticated(!!user)

    if (user) {
      // Check if user has voted
      const { data: vote } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("clip_id", clip.id)
        .eq("user_id", user.id)
        .single()

      if (vote) {
        setUserVote(vote.vote_type as "up" | "down")
      }
    }

    // Get vote count
    const { data: votes } = await supabase.from("votes").select("vote_type").eq("clip_id", clip.id)

    if (votes) {
      const upvotes = votes.filter((v) => v.vote_type === "up").length
      const downvotes = votes.filter((v) => v.vote_type === "down").length
      setVoteCount(upvotes - downvotes)
    }
  }

  const handleVote = async (voteType: "up" | "down") => {
    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (userVote === voteType) {
      // Remove vote
      await supabase.from("votes").delete().eq("clip_id", clip.id).eq("user_id", user.id)
      setUserVote(null)
    } else {
      // Add or update vote
      await supabase
        .from("votes")
        .upsert({ clip_id: clip.id, user_id: user.id, vote_type: voteType }, { onConflict: "clip_id,user_id" })
      setUserVote(voteType)
    }

    // Refresh vote count
    checkAuthAndVotes()
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const categories = clip.clip_tags?.map((tag) => tag.category).filter(Boolean) || []

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('category', categoryId)
    router.push(`/?${params.toString()}`)
  }

  return (
    <>
      <Card className="group hover:shadow-lg transition-shadow">
        <CardContent className="space-y-4 pt-6">
          {/* Premium Badge */}
          {clip.is_premium && (
            <div className="flex justify-end -mt-2">
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
          {/* Driver & Race Info */}
          <div className="space-y-1">
            {clip.driver && (
              <p className="text-foreground font-semibold text-base">
                {clip.driver.name} {clip.driver.number && `#${clip.driver.number}`}
              </p>
            )}
            {clip.race && (
              <p className="text-muted-foreground text-sm">
                {clip.race.location} - {clip.race.name?.split(' - ')[1] || clip.race.name} {clip.race.season}
              </p>
            )}
          </div>

          {/* Transcript Preview */}
          {clip.transcript && <p className="text-sm text-muted-foreground italic line-clamp-2">"{clip.transcript}"</p>}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {categories.map((category, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleCategoryClick(category!.id)}
                >
                  {category!.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Play Button & Votes */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {clip.duration && clip.duration > 0 && (
                <span className="text-xs text-muted-foreground">{formatDuration(clip.duration)}</span>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleVote("up")}
                  disabled={!isAuthenticated}
                >
                  <ThumbsUp className={`h-3 w-3 ${userVote === "up" ? "fill-current" : ""}`} />
                </Button>
                <span className="text-xs font-medium min-w-[20px] text-center">{voteCount}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleVote("down")}
                  disabled={!isAuthenticated}
                >
                  <ThumbsDown className={`h-3 w-3 ${userVote === "down" ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>
            <Button size="sm" onClick={() => setIsPlayerOpen(true)} className="gap-2">
              <Play className="h-4 w-4" />
              Play
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPlayerOpen} onOpenChange={setIsPlayerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-balance">{clip.title}</DialogTitle>
            <DialogDescription>
              {clip.driver?.name} - {clip.race?.name} {clip.race?.season}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Audio Player */}
            <AudioPlayer audioUrl={clip.audio_url} title={clip.title} autoPlay />

            {/* Full Transcript */}
            {clip.transcript && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Transcript</p>
                <p className="text-sm text-muted-foreground italic">"{clip.transcript}"</p>
              </div>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        setIsPlayerOpen(false)
                        handleCategoryClick(category!.id)
                      }}
                    >
                      {category!.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Vote Buttons */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => handleVote("up")}
                disabled={!isAuthenticated}
              >
                <ThumbsUp className={`h-4 w-4 ${userVote === "up" ? "fill-current" : ""}`} />
                Upvote
              </Button>
              <span className="font-medium">{voteCount}</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
                onClick={() => handleVote("down")}
                disabled={!isAuthenticated}
              >
                <ThumbsDown className={`h-4 w-4 ${userVote === "down" ? "fill-current" : ""}`} />
                Downvote
              </Button>
            </div>
            {!isAuthenticated && <p className="text-xs text-center text-muted-foreground">Login to vote on clips</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
