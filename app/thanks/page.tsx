import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

export default function ThanksPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Image
                src="/placeholder.svg?height=40&width=40"
                alt="Check mark"
                width={40}
                height={40}
                className="text-primary"
              />
            </div>
          </div>
          <CardTitle className="text-2xl">Thank You!</CardTitle>
          <CardDescription>Your participation helps us improve online safety awareness.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            You've completed the Scam Awareness Quiz. We hope you learned something valuable about staying safe online.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-left">
            <h3 className="font-medium text-blue-800 mb-2">Remember these safety tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Never share personal information with unknown contacts</li>
              <li>Be suspicious of urgent requests or threats</li>
              <li>Check URLs carefully before clicking links</li>
              <li>When in doubt, contact the company directly using official channels</li>
              <li>Keep your software and devices updated</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

