"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PlayerForm from "@/components/player-form"
import CountdownTimer from "@/components/countdown-timer"

function getDeadline(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("cpl_deadline")
}

export default function RegisterPage() {
  const router = useRouter()
  const [deadline, setDeadline] = useState<string | null>(null)
  const [isClosed, setIsClosed] = useState(false)

  useEffect(() => {
    const d = getDeadline()
    setDeadline(d)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cpl_deadline") {
        const d = getDeadline()
        setDeadline(d)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    if (!deadline) return
    const now = Date.now()
    const end = new Date(deadline).getTime()
    setIsClosed(now > end)

    const t = setInterval(() => {
      const nowTick = Date.now()
      setIsClosed(nowTick > end)
    }, 1000)
    return () => clearInterval(t)
  }, [deadline])

  const handleSuccess = () => {
    router.push("/thank-you")
  }

  const ClosureMessage = useMemo(
    () => (
      <Card>
        <CardHeader>
          <CardTitle>Registration Closed</CardTitle>
          <CardDescription>{"Thank you for your interest. The registration deadline has passed."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CountdownTimer />
          <Button onClick={() => router.push("/")} variant="secondary">
            Back to Home
          </Button>
        </CardContent>
      </Card>
    ),
    [router],
  )

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-3xl w-full px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">CPL Player Registration</h1>
          <CountdownTimer />
        </div>

        {isClosed ? ClosureMessage : <PlayerForm onSuccess={handleSuccess} />}
      </div>
    </main>
  )
}
