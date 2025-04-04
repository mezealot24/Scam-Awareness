"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, MessageSquare } from "lucide-react"

interface Message {
  id: number
  message: string
  sender: string
  order_index: number
}

interface ScenarioChatProps {
  messages: Message[]
  scenarioType: string
}

export default function ScenarioChat({ messages, scenarioType }: ScenarioChatProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length === 0) return

    // Reset visible messages when scenario changes
    setVisibleMessages([])

    // Display messages one by one with a delay
    let currentMessages: Message[] = []
    messages.forEach((message, index) => {
      setTimeout(() => {
        currentMessages = [...currentMessages, message]
        setVisibleMessages([...currentMessages])

        // Scroll to bottom when new message appears
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, index * 1000) // 1 second delay between messages
    })
  }, [messages])

  // Determine if this is an SMS or chat scenario
  const isSMS = scenarioType === "sms"

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className={`p-3 ${isSMS ? "bg-blue-500" : "bg-blue-800"} text-white rounded-t-lg flex items-center`}>
        <div className="flex items-center">
          {isSMS ? <MessageSquare className="h-5 w-5 mr-2" /> : <MessageCircle className="h-5 w-5 mr-2" />}
          <span className="font-medium">{isSMS ? "SMS" : "Chat"}</span>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {!isSMS && (
            <>
              <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              <div className="w-5 h-5 rounded-full bg-gray-300"></div>
              <div className="w-5 h-5 rounded-full bg-gray-300"></div>
            </>
          )}
        </div>
      </div>

      {/* Chat body */}
      <div
        ref={chatContainerRef}
        className={`flex-1 flex flex-col overflow-y-auto p-4 ${isSMS ? "bg-blue-100" : "bg-blue-900"}`}
        aria-live="polite"
        style={{ minHeight: "300px", maxHeight: "300px" }}
      >
        <div className="flex-1 flex flex-col">
          {visibleMessages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.sender} ${isSMS ? "sms" : "chat"}`}>
              {message.message}
            </div>
          ))}
        </div>
      </div>

      {/* Chat footer */}
      <div className={`p-2 ${isSMS ? "bg-gray-200" : "bg-blue-800"} rounded-b-lg flex items-center`}>
        <div className={`w-full h-8 rounded-full ${isSMS ? "bg-white" : "bg-blue-700"} flex items-center px-3`}>
          <span className="text-gray-400 text-sm">Type a message...</span>
        </div>
      </div>
    </div>
  )
}

