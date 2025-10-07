"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CountdownTimer from "@/components/countdown-timer"

const ADMIN_USER = "Lakshman"
const ADMIN_PASS = "Lakshman_rlr"
const ADMIN_KEY = "cpl_admin_session"

export default function AdminPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLoggedIn(localStorage.getItem(ADMIN_KEY) === "true")
    }
  }, [])

  const login = () => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      localStorage.setItem(ADMIN_KEY, "true")
      setLoggedIn(true)
      setError(null)
    } else {
      setError("Invalid credentials")
    }
  }

  const logout = () => {
    localStorage.removeItem(ADMIN_KEY)
    setLoggedIn(false)
  }

  if (loggedIn) {
    return (
      <main className="min-h-dvh">
        <div className="mx-auto max-w-6xl w-full px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <CountdownTimer />
              <Button variant="outline" onClick={logout}>
                Log out
              </Button>
            </div>
          </div>
          {/* Render the dashboard as a client component */}
          <AdminDashboard />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-md w-full px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>{"Use the hardcoded credentials."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-end">
              <Button onClick={login}>Login</Button>
            </div>
            {/* <p className="text-xs text-muted-foreground">{"Username: Lakshman • Password: Lakshman_rlr"}</p> */}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

// Lazy import pattern is not needed here; bringing component below for clarity.
import AdminDashboard from "@/components/admin/admin-dashboard"
