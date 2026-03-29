import React, { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { chatWithAnalyst } from '@/services/api'
import { motion } from 'framer-motion'

export const ChatWindow = () => {
  const { messages, isTyping, addMessage, setTyping } = useAppStore()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (text: string) => {
    // Optimistic UI update: push the user message
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    })
    
    setTyping(true)
    
    try {
      const response = await chatWithAnalyst(text)
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      })
    } catch (error) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error communicating with the local financial backend. Is it running (uvicorn app.main:app)?",
        timestamp: new Date()
      })
    } finally {
      setTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-l relative overflow-hidden">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b shadow-sm bg-background/95 backdrop-blur z-10 shrink-0">
        <h2 className="font-semibold text-lg tracking-tight">Financial Analyst Copilot</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Agents Ready</span>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {/* Streaming / Typing indicator */}
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/50 rounded-2xl w-fit"
          >
            <span className="text-xs font-medium">Analyzing data</span>
            <div className="flex gap-1 ml-1">
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/80 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={endRef} className="h-4" />
      </div>
      
      {/* Input section fixed to bottom */}
      <div className="shrink-0 p-4 border-t bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  )
}
