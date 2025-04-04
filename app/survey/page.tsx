"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export default function SurveyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    ageGroup: "",
    gender: "",
    educationLevel: "",
    techFamiliarity: 3,
    feedback: "",
  })

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)

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

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleRadioChange = (value: string) => {
    setFormData({
      ...formData,
      techFamiliarity: Number.parseInt(value),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) return

    setSubmitting(true)

    try {
      // Save survey response
      await supabase.from("survey_responses").upsert([
        {
          user_id: userId,
          age_group: formData.ageGroup,
          gender: formData.gender,
          education_level: formData.educationLevel,
          tech_familiarity: formData.techFamiliarity,
          feedback: formData.feedback,
        },
      ])

      // Redirect to results page
      router.push("/results")
    } catch (error) {
      console.error("Error submitting survey:", error)
      alert("Failed to submit survey. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading survey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Survey</CardTitle>
          <CardDescription>
            Please take a moment to complete this short survey. Your feedback helps us improve.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="ageGroup">Age Group</Label>
                <Select onValueChange={(value) => handleSelectChange("ageGroup", value)} value={formData.ageGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under18">Under 18</SelectItem>
                    <SelectItem value="18-24">18-24</SelectItem>
                    <SelectItem value="25-34">25-34</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55-64">55-64</SelectItem>
                    <SelectItem value="65+">65+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select onValueChange={(value) => handleSelectChange("gender", value)} value={formData.gender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non-binary">Non-binary</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="educationLevel">Education Level</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("educationLevel", value)}
                  value={formData.educationLevel}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-school">High School</SelectItem>
                    <SelectItem value="some-college">Some College</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>How familiar are you with technology?</Label>
                <RadioGroup defaultValue="3" onValueChange={handleRadioChange} className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id="tech1" />
                    <Label htmlFor="tech1">Not at all</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2" id="tech2" />
                    <Label htmlFor="tech2">Slightly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="3" id="tech3" />
                    <Label htmlFor="tech3">Moderately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="tech4" />
                    <Label htmlFor="tech4">Very</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5" id="tech5" />
                    <Label htmlFor="tech5">Extremely</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Additional Feedback</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  placeholder="Please share any additional feedback about the quiz..."
                  value={formData.feedback}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/quiz")} disabled={submitting}>
              Back to Quiz
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Survey"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

