import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type Message } from '@/store/useAppStore'
import { Bot, User } from 'lucide-react'

export const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn("flex w-full gap-3 py-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm", 
        isUser ? "bg-primary text-primary-foreground" : "bg-card border text-foreground")}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5 text-primary" />}
      </div>
      
      <div className={cn("flex flex-col max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div className={cn("px-4 py-3 rounded-2xl shadow-sm border", 
          isUser ? "bg-primary text-primary-foreground border-primary rounded-tr-sm" 
                 : "bg-card text-card-foreground border-border rounded-tl-sm"
        )}>
          {/* A production app might use ReactMarkdown for advanced rendering */}
          <p className="text-[14px] whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 mx-1 font-medium">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  )
}
