"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

export function SearchBar({ initialSearch }: { initialSearch?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch || "")
  const [isPending, startTransition] = useTransition()

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams(searchParams.toString())

    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search clips by title or transcript..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
