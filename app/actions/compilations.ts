"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCompilation(title: string, description: string, clipIds: string[]) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (clipIds.length === 0 || clipIds.length > 10) {
    return { error: "Compilation must have between 1 and 10 clips" }
  }

  // Create compilation
  const { data: compilation, error: compError } = await supabase
    .from("compilations")
    .insert({
      user_id: user.id,
      title,
      description,
    })
    .select()
    .single()

  if (compError) {
    return { error: compError.message }
  }

  // Add clips to compilation
  const compilationClips = clipIds.map((clipId, index) => ({
    compilation_id: compilation.id,
    clip_id: clipId,
    position: index,
  }))

  const { error: clipsError } = await supabase
    .from("compilation_clips")
    .insert(compilationClips)

  if (clipsError) {
    // Rollback: delete the compilation
    await supabase.from("compilations").delete().eq("id", compilation.id)
    return { error: clipsError.message }
  }

  revalidatePath("/premium")
  return { success: true, compilationId: compilation.id }
}

export async function getUserCompilations() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("compilations")
    .select(`
      *,
      compilation_clips(
        position,
        clip:clips(
          id,
          title,
          audio_url,
          driver:drivers(name),
          race:races(name, location, season)
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function deleteCompilation(compilationId: string) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("compilations")
    .delete()
    .eq("id", compilationId)
    .eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/premium")
  return { success: true }
}
