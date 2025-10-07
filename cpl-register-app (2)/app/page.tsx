import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import CountdownTimer from "@/components/countdown-timer"

export default function HomePage() {
  // Safely read deadline on client only via no-SSR patterns in child
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="w-full border-b">
        <div className="mx-auto max-w-5xl w-full px-4 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-pretty">{"🏏 CPL Player Registration"}</h1>
          <div className="flex items-center gap-2">
            <Link href="/register" className="inline-flex">
              <Button variant="default">Register</Button>
            </Link>
            <Link href="/admin" className="inline-flex">
              <Button variant="secondary">Admin</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="flex-1">
        <div className="mx-auto max-w-5xl w-full px-4 py-10 grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-balance">{"🏏 Welcome to CPL Player Registration!"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <p className="leading-relaxed text-pretty">
                {
                  "Register now to be part of the CPL. Please complete all details, upload a clear image, and ensure your mobile number is valid. The form will close automatically once the deadline is reached."
                }
              </p>
              <div className="flex items-center justify-start md:justify-end gap-3">
                <Link href="/register" className="inline-flex">
                  <Button>Go to Registration</Button>
                </Link>
                <Link href="/admin" className="inline-flex">
                  <Button variant="outline">Admin Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration Countdown</CardTitle>
            </CardHeader>
            <CardContent>
              <CountdownTimer />
              <p className="mt-3 text-sm text-muted-foreground">
                {"The registration form will automatically close when the deadline expires."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="leading-relaxed">{"• Fields required: Name, Role, Image, Mobile Number"}</p>
              <p className="leading-relaxed">{"• Image preview available before submission"}</p>
              <p className="leading-relaxed">{"• Duplicate mobile numbers are not allowed"}</p>
              <p className="leading-relaxed">{"• Thank you page after successful submission"}</p>
              <p className="leading-relaxed">{"• Responsive on mobile and desktop"}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="w-full border-t">
        <div className="mx-auto max-w-5xl w-full px-4 py-6 text-sm text-muted-foreground">
          {"© "} {new Date().getFullYear()} {" CPL Registration"}
        </div>
      </footer>
    </main>
  )
}
