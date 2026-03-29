import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ChatResponse {
  response: string
  history: any[]
}

export const chatWithAnalyst = async (message: string): Promise<ChatResponse> => {
  const { data } = await apiClient.post<ChatResponse>('/chat', { message })
  return data
}
