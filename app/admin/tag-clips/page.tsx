'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { AudioPlayer } from '@/components/audio-player'

export default function TagClipsPage() {
  const [clips, setClips] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (clips[currentIndex]) {
      loadClipTags()
    }
  }, [currentIndex, clips])

  const loadData = async () => {
    // Load categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    setCategories(categoriesData || [])

    // Load clips without tags (or all clips)
    const { data: clipsData } = await supabase
      .from('clips')
      .select(`
        *,
        driver:drivers(name, number),
        race:races(name, location, season),
        clip_tags(category_id)
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    setClips(clipsData || [])
    setLoading(false)
  }

  const loadClipTags = async () => {
    const clip = clips[currentIndex]
    if (!clip) return

    const { data } = await supabase
      .from('clip_tags')
      .select('category_id')
      .eq('clip_id', clip.id)

    setSelectedCategories(data?.map(t => t.category_id) || [])
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const saveTags = async () => {
    const clip = clips[currentIndex]
    if (!clip) return

    // Delete existing tags
    await supabase
      .from('clip_tags')
      .delete()
      .eq('clip_id', clip.id)

    // Insert new tags
    if (selectedCategories.length > 0) {
      const tags = selectedCategories.map(categoryId => ({
        clip_id: clip.id,
        category_id: categoryId,
      }))

      await supabase.from('clip_tags').insert(tags)
    }

    // Move to next clip
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const skip = () => {
    if (currentIndex < clips.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  const currentClip = clips[currentIndex]

  if (!currentClip) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>All Done!</CardTitle>
            <CardDescription>No more clips to tag</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Tag Radio Clips</CardTitle>
          <CardDescription>
            Clip {currentIndex + 1} of {clips.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clip Info */}
          <div>
            <h3 className="font-semibold text-lg mb-2">
              {currentClip.driver?.name} #{currentClip.driver?.number}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentClip.race?.location} - {currentClip.race?.name?.split(' - ')[1]} {currentClip.race?.season}
            </p>
          </div>

          {/* Audio Player */}
          <AudioPlayer audioUrl={currentClip.audio_url} title={currentClip.title} />

          {/* Transcript */}
          {currentClip.transcript && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Transcript</p>
              <p className="text-sm italic">"{currentClip.transcript}"</p>
            </div>
          )}

          {/* Categories */}
          <div>
            <Label className="text-base mb-4 block">Select Categories</Label>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                  <label
                    htmlFor={category.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={saveTags} className="flex-1">
              Save & Next
            </Button>
            <Button onClick={skip} variant="outline">
              Skip
            </Button>
          </div>

          {/* Progress */}
          <div className="text-center text-sm text-muted-foreground">
            {selectedCategories.length} categories selected
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
