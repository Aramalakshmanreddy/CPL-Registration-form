import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ThankYouPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle>{"Thanks for registering for CPL!"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="leading-relaxed">
            {"Your registration has been received. We'll be in touch with updates. Best of luck!"}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex">
              <Button variant="secondary">Back to Home</Button>
            </Link>
            <Link href="/register" className="inline-flex">
              <Button>Register Another Player</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
