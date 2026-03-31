import { useState } from 'react'
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
    <div className="flex items-center gap-2 p-4 border-t">
      <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground rounded-full hover:bg-muted">
        <Paperclip className="w-5 h-5" />
      </Button>
      <input
        type="text"
        className="flex-1 bg-white dark:bg-slate-900 px-4 py-3 rounded-full text-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
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
