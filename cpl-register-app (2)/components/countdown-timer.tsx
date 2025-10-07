"use client"

import { useEffect, useMemo, useState } from "react"

function getDeadline(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("cpl_deadline")
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "00d 00:00:00"
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / (24 * 3600))
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${pad(days)}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export default function CountdownTimer() {
  const [deadline, setDeadline] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setDeadline(getDeadline())
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cpl_deadline") setDeadline(getDeadline())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const display = useMemo(() => {
    if (!deadline) return "No deadline set"
    const diff = new Date(deadline).getTime() - Date.now()
    return formatRemaining(diff)
  }, [deadline, tick])

  return (
    <div aria-live="polite" className="text-sm text-muted-foreground">
      {display}
    </div>
  )
}
