// A simple device fingerprinting function to generate a unique-ish identifier for the device
// Add type declaration for deviceMemory at the top of the file

import { supabase } from "./supabase/client"


export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.width + "x" + screen.height,
    navigator.hardwareConcurrency,
    (navigator as any).deviceMemory,    
  ]

  // Use SubtleCrypto to hash the components for a more secure fingerprint
  const msgUint8 = new TextEncoder().encode(components.join("###"))
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8)

  // Convert the hash to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

// Check if this device has already completed the quiz
export function hasCompletedQuiz(): boolean {
  const quizCompletionData = localStorage.getItem("quizCompletionData")

  if (!quizCompletionData) {
    return false
  }

  try {
    const data = JSON.parse(quizCompletionData)

    // Check if the completion timestamp exists and is valid
    if (data.completedAt) {
      // Optional: Add expiration logic if you want to allow retakes after a certain period
      // const expirationDays = 30;
      // const expirationMs = expirationDays * 24 * 60 * 60 * 1000;
      // if (Date.now() - data.completedAt > expirationMs) {
      //   return false;
      // }

      return true
    }

    return false
  } catch (error) {
    console.error("Error parsing quiz completion data:", error)
    return false
  }
}

// Mark this device as having completed the quiz
export async function markQuizCompleted(userId: string, fingerprint: string): Promise<void> {
  const completionData = {
      userId,
      deviceFingerprint: fingerprint,
      completedAt: Date.now(),
  };

  try {
      // Ensure the Content-Type header is set to application/json
      localStorage.setItem("quizCompletionData", JSON.stringify(completionData));

      const response = await supabase
          .from("quiz_completions")
          .insert([
              {
                  user_id: userId,
                  device_fingerprint: fingerprint,
                  completed_at: new Date(),
              },
          ])
          .single();

      if (response.error) {
          console.error("Error marking quiz completed:", response.error);
      }
  } catch (error) {
      console.error("Error marking quiz completed:", error);
  }
}


// Check if this is a returning user based on fingerprint
export async function isReturningUser(): Promise<{ isReturning: boolean; previousUserId?: string }> {
  const quizCompletionData = localStorage.getItem("quizCompletionData")

  if (!quizCompletionData) {
    return { isReturning: false }
  }

  try {
    const data = JSON.parse(quizCompletionData)
    const currentFingerprint = await generateDeviceFingerprint()

    if (data.deviceFingerprint === currentFingerprint) {
      return {
        isReturning: true,
        previousUserId: data.userId,
      }
    }

    return { isReturning: false }
  } catch (error) {
    console.error("Error checking returning user:", error)
    return { isReturning: false }
  }
}

