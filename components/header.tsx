import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { UserMenu } from "@/components/user-menu"
import { Crown, Star } from "lucide-react"

export async function Header({ clipCount }: { clipCount: number }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <Image 
              src="/Logo.png" 
              alt="F1 Radio Archive" 
              width={60} 
              height={60}
              priority
              className="h-auto w-auto max-h-16"
            />
            <div>
              <h1 className="font-[family-name:var(--font-exo2)] text-3xl tracking-wider text-balance uppercase">
                F1 Radio Archive
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Relive the most iconic team radio moments</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            {clipCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {clipCount} clips
              </Badge>
            )}
            {user && (
              <>
                <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Link href="/favorites">
                    <Star className="h-4 w-4" />
                    Favorites
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Link href="/premium">
                    <Crown className="h-4 w-4" />
                    Premium
                  </Link>
                </Button>
              </>
            )}
            {user ? (
              <UserMenu user={user} />
            ) : (
              <Button asChild size="sm">
                <Link href="/auth/login">Sign in with Google</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
