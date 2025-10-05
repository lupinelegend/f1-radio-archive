"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(clipId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if already favorited
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("clip_id", clipId)
    .eq("user_id", user.id)
    .single()

  if (existing) {
    // Remove favorite
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("clip_id", clipId)
      .eq("user_id", user.id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/favorites")
    return { success: true, isFavorited: false }
  } else {
    // Add favorite
    const { error } = await supabase
      .from("favorites")
      .insert({ clip_id: clipId, user_id: user.id })

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/")
    revalidatePath("/favorites")
    return { success: true, isFavorited: true }
  }
}

export async function checkFavoriteStatus(clipId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { isFavorited: false }
  }

  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("clip_id", clipId)
    .eq("user_id", user.id)
    .single()

  return { isFavorited: !!data }
}
