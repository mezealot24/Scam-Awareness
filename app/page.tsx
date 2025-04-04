import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MessageCircle, MessageSquare, Shield, AlertTriangle } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl w-full">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl sm:text-4xl font-bold text-blue-600">Scam Awareness Quiz</CardTitle>
            <CardDescription className="text-lg mt-2">
              Test your knowledge about online scams and learn how to stay safe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="md:w-1/2">
                <div className="relative h-64 w-full rounded-lg overflow-hidden shadow-md">
                  <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
                    <div className="bg-blue-100 rounded-lg p-3 flex flex-col">
                      <div className="bg-blue-500 text-white p-2 rounded-t-lg flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span className="text-xs">SMS</span>
                      </div>
                      <div className="flex-1 bg-white p-2 rounded-b-lg">
                        <div className="bg-green-400 text-black p-2 rounded-lg text-sm mb-2 max-w-[80%]">
                          Watch out for suspicious messages!
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-900 rounded-lg p-3 flex flex-col">
                      <div className="bg-blue-800 text-white p-2 rounded-t-lg flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <span className="text-xs">Chat</span>
                      </div>
                      <div className="flex-1 p-2 rounded-b-lg">
                        <div className="bg-green-400 text-black p-2 rounded-lg text-sm mb-2 max-w-[80%]">
                          Be careful with links!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 space-y-4">
                <h2 className="text-xl font-semibold">Why Take This Quiz?</h2>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Learn to identify common online scams</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Understand the tactics scammers use</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Protect yourself and your personal information</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Gain confidence in your online safety skills</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
                  <p>
                    You'll be presented with realistic scenarios and asked to determine if they're safe or scams. After
                    each answer, you'll receive feedback to help you learn.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-6">
            <Link href="/auth">
              <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700">
                Let's Play
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

