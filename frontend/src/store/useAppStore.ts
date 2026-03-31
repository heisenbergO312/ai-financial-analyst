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
  token: string | null
  isAuthenticated: boolean
  messages: Message[]
  isTyping: boolean
  financialData: FinancialData | null
  currentView: string
  
  // Actions
  login: (token: string) => void
  logout: () => void
  addMessage: (msg: Message) => void
  setTyping: (typing: boolean) => void
  setFinancialData: (data: FinancialData | null) => void
  setCurrentView: (view: string) => void
  clearChat: () => void
}

const initialToken = localStorage.getItem('auth_token')

export const useAppStore = create<AppState>((set) => ({
  token: initialToken,
  isAuthenticated: !!initialToken,
  
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
  currentView: 'overview',
  
  login: (token: string) => {
    localStorage.setItem('auth_token', token)
    set({ token, isAuthenticated: true })
  },
  
  logout: () => {
    localStorage.removeItem('auth_token')
    set({ 
        token: null, 
        isAuthenticated: false, 
        messages: [{
            id: "1",
            role: 'assistant',
            content: "Hello! I am your AI Financial Analyst. Please log in to view your portfolio and get advice.",
            timestamp: new Date()
        }], 
        financialData: null,
        currentView: 'overview'
    })
  },
  
  addMessage: (msg: Message) => set((state) => ({ messages: [...state.messages, msg] })),
  setTyping: (typing: boolean) => set({ isTyping: typing }),
  setFinancialData: (data: FinancialData | null) => set({ financialData: data }),
  setCurrentView: (view: string) => set({ currentView: view }),
  clearChat: () => set({ messages: [], financialData: null }),
}))
