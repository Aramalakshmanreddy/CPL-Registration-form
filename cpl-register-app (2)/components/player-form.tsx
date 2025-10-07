"use client"

import type React from "react"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Player = {
  id: string
  name: string
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper"
  mobile: string
  imageDataUrl: string
  createdAt: string
}

const STORAGE_KEY = "cpl_players"

function loadPlayers(): Player[] {
  if (typeof window === "undefined") return []
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Player[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function savePlayers(players: Player[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

function duplicateMobileExists(mobile: string, players: Player[]): boolean {
  return players.some((p) => p.mobile === mobile)
}

const MAX_IMAGE_MB = 2
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export default function PlayerForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState<Player["role"] | "">("")
  const [mobile, setMobile] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const players = useMemo(loadPlayers, [])
  const phoneValid = useMemo(() => /^[0-9]{10}$/.test(mobile), [mobile])
  const formValid = name.trim() && role && phoneValid && imageFile

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const isTypeOk = ACCEPTED_TYPES.includes(imageFile.type)
    const isSizeOk = imageFile.size <= MAX_IMAGE_MB * 1024 * 1024
    if (!isTypeOk) {
      setError("Please upload a JPEG/PNG/WebP image.")
      setImagePreview(null)
      return
    }
    if (!isSizeOk) {
      setError(`Image must be ≤ ${MAX_IMAGE_MB}MB.`)
      setImagePreview(null)
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Hard guard: re-check deadline right before saving
    try {
      const dl = typeof window !== "undefined" ? localStorage.getItem("cpl_deadline") : null
      if (dl) {
        const now = Date.now()
        const end = new Date(dl).getTime()
        if (now > end) {
          setError("Registration is closed. The deadline has passed.")
          return
        }
      }
    } catch {
      // ignore read errors; proceed with other validations
    }

    if (!formValid || !imagePreview) {
      setError("Please complete all fields correctly.")
      return
    }
    const existing = loadPlayers()
    if (duplicateMobileExists(mobile, existing)) {
      setError("This mobile number is already registered.")
      return
    }
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role: role as Player["role"],
      mobile,
      imageDataUrl: imagePreview,
      createdAt: new Date().toISOString(),
    }
    setSubmitting(true)
    try {
      const all = [...existing, newPlayer]
      savePlayers(all)
      onSuccess?.()
      // reset only if staying on page
      setName("")
      setRole("")
      setMobile("")
      setImageFile(null)
      setImagePreview(null)
      fileInputRef.current?.value && (fileInputRef.current.value = "")
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Registration Form</CardTitle>
        <CardDescription>{"All fields are required. Duplicate mobile numbers are not allowed."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Player["role"])}>
              <SelectTrigger aria-label="Select role">
                <SelectValue placeholder="Choose your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Batsman">Batsman</SelectItem>
                <SelectItem value="Bowler">Bowler</SelectItem>
                <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
            />
            <p className={cn("text-xs", phoneValid ? "text-muted-foreground" : "text-destructive")}>
              {phoneValid ? "We'll use this to contact you." : "Enter a valid 10-digit number."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image">Profile Image</Label>
            <Input
              id="image"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              ref={fileInputRef}
              required
            />
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Image preview"
                  className="h-28 w-28 rounded-md object-cover border"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">{`Accepted: JPEG/PNG/WebP • Max ${MAX_IMAGE_MB}MB`}</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={submitting || !formValid}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
