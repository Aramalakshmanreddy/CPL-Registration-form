"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import CountdownTimer from "@/components/countdown-timer"

// Excel & PDF export libs (Next.js infers modules)
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

type Player = {
  id: string
  name: string
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper"
  mobile: string
  imageDataUrl: string
  createdAt: string
}

const STORAGE_KEY = "cpl_players"
const DEADLINE_KEY = "cpl_deadline"

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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
}

function loadDeadline(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEADLINE_KEY)
}

function saveDeadline(iso: string | null) {
  if (iso === null) {
    localStorage.removeItem(DEADLINE_KEY)
  } else {
    localStorage.setItem(DEADLINE_KEY, iso)
  }
}

function byRoleCounts(players: Player[]) {
  const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"] as const
  const map = Object.fromEntries(roles.map((r) => [r, 0])) as Record<Player["role"], number>
  for (const p of players) map[p.role] += 1
  return map
}

export default function AdminDashboard() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [deadline, setDeadline] = useState<string | null>(null)
  const [deadlineLocal, setDeadlineLocal] = useState<string>("")
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"All" | Player["role"]>("All")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [replaceImport, setReplaceImport] = useState(false)
  const [exportingJson, setExportingJson] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    setPlayers(loadPlayers())
    const d = loadDeadline()
    setDeadline(d)
    setDeadlineLocal(d ? toLocalInputValue(d) : "")
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPlayers(loadPlayers())
      if (e.key === DEADLINE_KEY) {
        const nd = loadDeadline()
        setDeadline(nd)
        setDeadlineLocal(nd ? toLocalInputValue(nd) : "")
      }
    }
    window.addEventListener("storage", storageHandler)
    return () => window.removeEventListener("storage", storageHandler)
  }, [])

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const term = search.trim().toLowerCase()
      const matchesTerm =
        !term || p.name.toLowerCase().includes(term) || p.mobile.includes(term) || p.role.toLowerCase().includes(term)
      const matchesRole = roleFilter === "All" ? true : p.role === roleFilter
      return matchesTerm && matchesRole
    })
  }, [players, search, roleFilter])

  const stats = useMemo(
    () => ({
      total: players.length,
      byRole: byRoleCounts(players),
    }),
    [players],
  )

  function toLocalInputValue(iso: string) {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }

  function fromLocalInputValue(local: string): string | null {
    if (!local) return null
    const d = new Date(local)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  }

  const handleDeadlineSave = () => {
    const iso = fromLocalInputValue(deadlineLocal)
    saveDeadline(iso)
    setDeadline(iso)
  }

  const copyFormLink = async () => {
    const link = `${window.location.origin}/register`
    await navigator.clipboard.writeText(link)
    alert("Registration form link copied!")
  }

  const deletePlayer = (id: string) => {
    const confirmed = confirm("Delete this entry?")
    if (!confirmed) return
    const next = players.filter((p) => p.id !== id)
    setPlayers(next)
    savePlayers(next)
  }

  const exportJSON = () => {
    setExportingJson(true)
    setTimeout(() => {
      try {
        const data = players
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `cpl-players-${new Date().toISOString()}.json`
        a.click()
        URL.revokeObjectURL(url)
      } finally {
        setExportingJson(false)
      }
    }, 0)
  }

  const exportExcel = () => {
    setExportingExcel(true)
    setTimeout(() => {
      try {
        const rows = players.map((p, i) => ({
          "S.No": i + 1,
          "Player Name": p.name,
          Role: p.role,
          "Mobile Number": p.mobile,
          "Submission Time": p.createdAt,
        }))
        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Players")
        XLSX.writeFile(wb, `cpl-players-${new Date().toISOString().slice(0, 19)}.xlsx`)
      } finally {
        setExportingExcel(false)
      }
    }, 0)
  }

  const exportPDF = () => {
    setExportingPdf(true)
    setTimeout(() => {
      try {
        const doc = new jsPDF({ compress: true, unit: "pt", format: "a4" })

        const imageColIndex = 4
        // IMPORTANT: leave image column empty to avoid printing huge base64 text
        const body = players.map((p, i) => [
          i + 1,
          p.name,
          p.role,
          p.mobile,
          "", // empty cell for image; we will draw it manually
          new Date(p.createdAt).toLocaleString(),
        ])

        const getImageFormat = (dataUrl: string): "PNG" | "JPEG" | "WEBP" => {
          if (dataUrl.startsWith("data:image/png")) return "PNG"
          if (dataUrl.startsWith("data:image/webp")) return "WEBP"
          return "JPEG"
        }

        autoTable(doc, {
          head: [["S.No", "Player Name", "Role", "Mobile Number", "Image", "Submission Time"]],
          body,
          styles: { fontSize: 9, cellPadding: 4 },
          theme: "grid",
          headStyles: { fillColor: [0, 0, 0], textColor: 255 },
          columnStyles: {
            [imageColIndex]: { cellWidth: 40 }, // wider cell for image
          },
          didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === imageColIndex) {
              const rowIdx = data.row.index
              const img = players[rowIdx]?.imageDataUrl
              if (typeof img === "string" && img.startsWith("data:image/")) {
                try {
                  const fmt = getImageFormat(img)
                  const padding = 2
                  const availableW = data.cell.width - padding * 2
                  const availableH = data.cell.height - padding * 2
                  const size = Math.max(0, Math.min(availableW, availableH, 32)) // show a reasonable thumbnail
                  if (size > 0) {
                    doc.addImage(img, fmt, data.cell.x + padding, data.cell.y + padding, size, size)
                  }
                } catch {
                  // ignore image errors to avoid breaking export
                }
              }
            }
          },
        })

        doc.save(`cpl-players-${new Date().toISOString().slice(0, 19)}.pdf`)
      } finally {
        setExportingPdf(false)
      }
    }, 0)
  }

  const importJSON = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Player[]
      const clean = (Array.isArray(data) ? data : []).filter(
        (p) => p && p.name && p.role && p.mobile && p.imageDataUrl && p.createdAt,
      )
      if (replaceImport) {
        savePlayers(clean)
        setPlayers(clean)
      } else {
        // merge by unique mobile (later file wins)
        const byMobile = new Map<string, Player>()
        for (const p of players) byMobile.set(p.mobile, p)
        for (const np of clean) byMobile.set(np.mobile, np)
        const merged = Array.from(byMobile.values())
        savePlayers(merged)
        setPlayers(merged)
      }
      alert("Import successful.")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (e) {
      alert("Invalid JSON file.")
    }
  }

  return (
    <div className="space-y-8">
      {/* Deadline & Link */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="deadline">Set/Update Registration Deadline</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadlineLocal}
              onChange={(e) => setDeadlineLocal(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleDeadlineSave}>Save Deadline</Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeadlineLocal("")
                  saveDeadline(null)
                  setDeadline(null)
                }}
              >
                Clear Deadline
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {deadline ? `Current deadline: ${new Date(deadline).toLocaleString()}` : "No deadline set"}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Share Registration Form</Label>
            <div className="flex items-center gap-3">
              <Button onClick={copyFormLink}>Copy Form Link</Button>
              <a href="/register" target="_blank" rel="noreferrer" className="inline-flex">
                <Button variant="outline">Open Form</Button>
              </a>
            </div>
            <div className="pt-2">
              <Label>Time Remaining</Label>
              <div className="mt-1">
                <CountdownTimer />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Batsmen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.byRole["Batsman"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bowlers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.byRole["Bowler"]}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All-Rounders/WK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between">
              <span>All-Rounders</span>
              <Badge variant="outline">{stats.byRole["All-Rounder"]}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Wicket-Keepers</span>
              <Badge variant="outline">{stats.byRole["Wicket-Keeper"]}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, mobile, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Filter by Role</Label>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as "All" | Player["role"])}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                  <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                  <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Import / Export</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportJSON} disabled={exportingJson || players.length === 0}>
                  {exportingJson ? "Exporting..." : "Export JSON"}
                </Button>
                <Button variant="outline" onClick={exportExcel} disabled={exportingExcel || players.length === 0}>
                  {exportingExcel ? "Exporting..." : "Export Excel"}
                </Button>
                <Button variant="outline" onClick={exportPDF} disabled={exportingPdf || players.length === 0}>
                  {exportingPdf ? "Exporting..." : "Export PDF"}
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) importJSON(file)
                  }}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={replaceImport} onChange={(e) => setReplaceImport(e.target.checked)} />
                Replace existing data (unchecked = merge)
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Player Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Submission Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No submissions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p, idx) => (
                    <TableRow key={p.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.role}</TableCell>
                      <TableCell>{p.mobile}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="p-0 bg-transparent border-none">
                              <img
                                src={p.imageDataUrl || "/placeholder.svg"}
                                alt={`Image of ${p.name}`}
                                className="h-12 w-12 rounded object-cover border cursor-zoom-in"
                              />
                              <span className="sr-only">{`Open image of ${p.name}`}</span>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Image Preview</DialogTitle>
                            </DialogHeader>
                            <img
                              src={p.imageDataUrl || "/placeholder.svg"}
                              alt={`Image of ${p.name}`}
                              className="w-full h-auto rounded border"
                            />
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                      <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" onClick={() => deletePlayer(p.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
