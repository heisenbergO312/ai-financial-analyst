import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, AlertCircle, ArrowRight } from 'lucide-react'
import { loginUser, registerUser } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'

export const AuthOverlay = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const login = useAppStore(state => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    
    try {
      if (isLogin) {
        const data = await loginUser({ username, password })
        login(data.access_token)
      } else {
        await registerUser({ username, password })
        // Auto-login instantly after seamless registration
        const data = await loginUser({ username, password })
        login(data.access_token)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-lg" />
      
      {/* Floating Auth Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        className="relative w-full max-w-[400px] bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {isLogin 
                ? "Enter your credentials to access your financial playground." 
                : "Sign up to start tracking your portfolio instantly."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden mt-6 shadow-md"
            >
              <div className="flex items-center justify-center gap-2 relative z-10">
                {isLoading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    <span>{isLogin ? "Sign In" : "Register"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-6 text-center text-sm font-medium border-t border-slate-100 dark:border-white/5 pt-6">
            <span className="text-slate-500 dark:text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
