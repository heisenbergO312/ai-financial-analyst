import axios from 'axios'
import { useAppStore } from '../store/useAppStore'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the JWT Token automatically if the user is authenticated
apiClient.interceptors.request.use(
  (config) => {
    const state = useAppStore.getState()
    if (state.token) {
        config.headers['Authorization'] = `Bearer ${state.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export interface ChatResponse {
  response: string
  history: any[]
}

export const chatWithAnalyst = async (message: string): Promise<ChatResponse> => {
  const { data } = await apiClient.post<ChatResponse>('/chat', { message })
  return data
}

export const loginUser = async (credentials: any) => {
  // FastAPI's OAuth2PasswordRequestForm expects form-data!
  const params = new URLSearchParams()
  params.append('username', credentials.username)
  params.append('password', credentials.password)

  const { data } = await apiClient.post('/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return data
}

export const registerUser = async (userData: any) => {
  const { data } = await apiClient.post('/register', userData)
  return data
}

export const uploadStatement = async (file: File, year: number, month: number, password?: string) => {
  const formData = new FormData()
  formData.append('file', file)
  if (password) {
    formData.append('password', password)
  }
  // Explicitly remove global json header for multipart data
  const { data } = await apiClient.post(`/upload-statement?year=${year}&month=${month}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export const listUploadedMonths = async (): Promise<{year: number; month: number; transaction_count: number}[]> => {
  const { data } = await apiClient.get('/budgets')
  return data
}

export const getMonthlyBudget = async (year: number, month: number) => {
  const { data } = await apiClient.get(`/budgets/${year}/${month}`)
  return data
}

export const getLoanAdvice = async (loanDetails: { amount: number; rate: number; tenure: number }) => {
  const message = `
    I am considering a loan of ₹${loanDetails.amount.toLocaleString('en-IN')} 
    at ${loanDetails.rate}% interest for ${loanDetails.tenure} years. 
    Analyze my monthly affordability based on my budget and suggest a 
    prepayment or refinancing strategy.
  `
  return chatWithAnalyst(message)
}
