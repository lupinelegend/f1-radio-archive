import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"
import { Crown } from "lucide-react"

export async function Header({ clipCount }: { clipCount: number }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/">
              <h1 className="font-bold text-3xl tracking-tight text-balance hover:opacity-80 transition-opacity">
                F1 Radio Archive
              </h1>
            </Link>
            <p className="text-muted-foreground text-sm mt-1">Relive the most iconic team radio moments</p>
          </div>
          <div className="flex items-center gap-4">
            {clipCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {clipCount} clips
              </Badge>
            )}
            {user && (
              <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
                <Link href="/premium">
                  <Crown className="h-4 w-4" />
                  Premium
                </Link>
              </Button>
            )}
            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/sign-up">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
