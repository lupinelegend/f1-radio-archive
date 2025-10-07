"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateTranscript(clipId: string, transcript: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("clips")
    .update({ transcript })
    .eq("id", clipId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath("/admin")
  return { success: true }
}

export async function suggestTranscript(clipId: string, suggestedTranscript: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("transcript_suggestions")
    .insert({
      clip_id: clipId,
      user_id: user.id,
      suggested_transcript: suggestedTranscript,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function reviewSuggestion(suggestionId: string, action: 'approve' | 'reject') {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (action === 'approve') {
    // Get the suggestion
    const { data: suggestion } = await supabase
      .from("transcript_suggestions")
      .select("clip_id, suggested_transcript")
      .eq("id", suggestionId)
      .single()

    if (!suggestion) {
      return { error: "Suggestion not found" }
    }

    // Update the clip transcript
    const { error: updateError } = await supabase
      .from("clips")
      .update({ transcript: suggestion.suggested_transcript })
      .eq("id", suggestion.clip_id)

    if (updateError) {
      return { error: updateError.message }
    }
  }

  // Update suggestion status
  const { error } = await supabase
    .from("transcript_suggestions")
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", suggestionId)

  if (error) {
    return { error: error.message }
  }

  // Revalidate all pages that might show clips
  revalidatePath("/", "layout")
  revalidatePath("/admin")
  revalidatePath("/favorites")
  
  return { success: true }
}
