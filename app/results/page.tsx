"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { hasCompletedQuiz } from "@/lib/device-fingerprint"

interface ResultData {
  totalScenarios: number
  correctAnswers: number
  incorrectAnswers: number
  scenarioResults: {
    id: number
    title: string
    isCorrect: boolean
    userAnswer: string
    correctAnswer: string
  }[]
}

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [results, setResults] = useState<ResultData | null>(null)
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    // Check if this device has completed the quiz
    const completed = hasCompletedQuiz()
    setQuizCompleted(completed)

    const checkAuth = async () => {
      // Check for authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
      } else {
        // Check for guest ID
        const guestId = localStorage.getItem("guestId")
        if (guestId) {
          setUserId(guestId)
        } else {
          // No authentication, redirect to auth page
          router.push("/auth")
          return
        }
      }
    }

    const fetchResults = async () => {
      if (!userId) return

      try {
        // Get user responses
        const { data: userResponses, error: responsesError } = await supabase
          .from("user_responses")
          .select("*, scenarios(id, title, correct_answer)")
          .eq("user_id", userId)

        if (responsesError) throw responsesError

        if (!userResponses || userResponses.length === 0) {
          // No results yet, redirect to quiz if not completed
          if (!quizCompleted) {
            router.push("/quiz")
          }
          return
        }

        // Process results
        const correctAnswers = userResponses.filter((r) => r.is_correct).length
        const scenarioResults = userResponses.map((response) => ({
          id: response.scenario_id,
          title: response.scenarios.title,
          isCorrect: response.is_correct,
          userAnswer: response.user_answer,
          correctAnswer: response.scenarios.correct_answer,
        }))

        setResults({
          totalScenarios: userResponses.length,
          correctAnswers,
          incorrectAnswers: userResponses.length - correctAnswers,
          scenarioResults,
        })
      } catch (error) {
        console.error("Error fetching results:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth().then(() => {
      if (userId) {
        fetchResults()
      }
    })
  }, [userId, router, quizCompleted])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Results Available</CardTitle>
            <CardDescription>
              {quizCompleted
                ? "You've completed the quiz, but we couldn't find your results."
                : "You haven't completed any scenarios yet."}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/quiz")} className="w-full">
              {quizCompleted ? "Retake Quiz" : "Start Quiz"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const score = Math.round((results.correctAnswers / results.totalScenarios) * 100)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Your Results</CardTitle>
            <CardDescription>You completed {results.totalScenarios} scenarios</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <p className="text-muted-foreground">
                {score >= 80 ? "Excellent!" : score >= 60 ? "Good job!" : "Keep learning!"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score</span>
                <span>
                  {results.correctAnswers} of {results.totalScenarios} correct
                </span>
              </div>
              <Progress value={score} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600 mb-1">{results.correctAnswers}</div>
                <div className="text-sm text-green-800">Correct</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-600 mb-1">{results.incorrectAnswers}</div>
                <div className="text-sm text-red-800">Incorrect</div>
              </div>
            </div>

            {quizCompleted && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800">
                      You've already completed this quiz on this device. To take it again, please use a different device
                      or sign in with a different account.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full flex-1">
          <CardHeader>
            <CardTitle>Scenario Results</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {results.scenarioResults.map((result) => (
                <div
                  key={result.id}
                  className={`p-4 rounded-lg border ${
                    result.isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                  }`}
                >
                  <div className="flex items-start">
                    {result.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-medium">{result.title}</div>
                      <div className="text-sm mt-1">
                        Your answer:{" "}
                        <span className={result.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {result.userAnswer}
                        </span>
                        {!result.isCorrect && (
                          <span className="text-sm ml-2">
                            (Correct: <span className="text-green-600 font-medium">{result.correctAnswer}</span>)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/")}>
              Return Home
            </Button>
            {!quizCompleted && <Button onClick={() => router.push("/quiz")}>Retake Quiz</Button>}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

