import React, { useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ChatInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (text.trim()) {
      onSend(text)
      setText('')
    }
  }

  return (
    <div className="flex items-center gap-2 p-4 border-t bg-background">
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground rounded-full hover:bg-muted">
        <Paperclip className="w-5 h-5" />
      </Button>
      <input
        type="text"
        className="flex-1 bg-muted px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
        placeholder="Ask about your finances, EMI, or credit score..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <Button onClick={handleSend} size="icon" className="shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90">
        <Send className="w-4 h-4" />
      </Button>
    </div>
  )
}
