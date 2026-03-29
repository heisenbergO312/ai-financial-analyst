import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  timestamp: Date
}

export interface FinancialData {
  chartData?: any[]
  budgetBreakdown?: any
  loanSchedule?: any[]
  [key: string]: any
}

interface AppState {
  messages: Message[]
  isTyping: boolean
  financialData: FinancialData | null
  
  // Actions
  addMessage: (msg: Message) => void
  setTyping: (typing: boolean) => void
  setFinancialData: (data: FinancialData | null) => void
  clearChat: () => void
}

export const useAppStore = create<AppState>((set) => ({
  messages: [
    {
      id: "1",
      role: 'assistant',
      content: "Hello! I am your AI Financial Analyst. Try asking me to calculate an EMI, analyze an Indian budget PDF, or provide credit insights.",
      timestamp: new Date()
    }
  ],
  isTyping: false,
  financialData: null,
  
  addMessage: (msg: Message) => set((state) => ({ messages: [...state.messages, msg] })),
  setTyping: (typing: boolean) => set({ isTyping: typing }),
  setFinancialData: (data: FinancialData | null) => set({ financialData: data }),
  clearChat: () => set({ messages: [], financialData: null }),
}))
