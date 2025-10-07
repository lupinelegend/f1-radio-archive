"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addExistingTag(clipId: string, categoryId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Check if tag already exists
  const { data: existing } = await supabase
    .from("clip_tags")
    .select("id")
    .eq("clip_id", clipId)
    .eq("category_id", categoryId)
    .single()

  if (existing) {
    return { error: "Tag already exists on this clip" }
  }

  const { error } = await supabase
    .from("clip_tags")
    .insert({
      clip_id: clipId,
      category_id: categoryId,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function suggestNewTag(clipId: string, categoryName: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("tag_suggestions")
    .insert({
      clip_id: clipId,
      user_id: user.id,
      suggested_category_name: categoryName,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function suggestExistingTag(clipId: string, categoryId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("tag_suggestions")
    .insert({
      clip_id: clipId,
      user_id: user.id,
      category_id: categoryId,
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function reviewTagSuggestion(suggestionId: string, action: 'approve' | 'reject') {
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
      .from("tag_suggestions")
      .select("clip_id, category_id, suggested_category_name")
      .eq("id", suggestionId)
      .single()

    if (!suggestion) {
      return { error: "Suggestion not found" }
    }

    if (suggestion.suggested_category_name) {
      // Create new category
      const { data: newCategory, error: categoryError } = await supabase
        .from("categories")
        .insert({ name: suggestion.suggested_category_name })
        .select()
        .single()

      if (categoryError) {
        return { error: categoryError.message }
      }

      // Add tag with new category
      await supabase
        .from("clip_tags")
        .insert({
          clip_id: suggestion.clip_id,
          category_id: newCategory.id,
        })
    } else if (suggestion.category_id) {
      // Add existing category tag
      await supabase
        .from("clip_tags")
        .insert({
          clip_id: suggestion.clip_id,
          category_id: suggestion.category_id,
        })
    }
  }

  // Update suggestion status
  const { error } = await supabase
    .from("tag_suggestions")
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", suggestionId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/", "layout")
  revalidatePath("/admin")
  
  return { success: true }
}
