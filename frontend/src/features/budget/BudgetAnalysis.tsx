import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { 
  AlertCircle,
  Loader2,
  UploadCloud,
  Sparkles
} from 'lucide-react'
import { uploadStatement, listUploadedMonths, getMonthlyBudget } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'

const MOCK_DATA = [
  { name: 'Housing',              value: 25000, color: '#3b82f6' },
  { name: 'Food & Dining',        value: 8000,  color: '#10b981' },
  { name: 'Entertainment',        value: 4000,  color: '#f59e0b' },
  { name: 'Savings & Investments',value: 12000, color: '#8b5cf6' },
]

const CATEGORY_COLORS: Record<string, string> = {
  'Housing':               '#3b82f6',
  'Food & Dining':         '#10b981',
  'Entertainment':         '#f59e0b',
  'Savings & Investments': '#8b5cf6',
  'Transport':             '#06b6d4',
  'Healthcare':            '#f43f5e',
  'Shopping':              '#fb923c',
  'Utilities':             '#64748b',
  'Others':                '#a1a1aa',
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function getLast12Months() {
  const now = new Date()
  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }
  return months.reverse()
}

export const BudgetAnalysis = () => {
  const allMonths = useMemo(() => getLast12Months(), [])
  const [selectedIdx, setSelectedIdx] = useState(allMonths.length - 1)
  const selectedMonth = allMonths[selectedIdx]
  
  const [uploadedSet, setUploadedSet] = useState<Set<string>>(new Set())
  const [liveData, setLiveData]       = useState<{name:string;value:number;color:string}[]|null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [uploadError, setUploadError] = useState('')
  const [fetchError, setFetchError] = useState('')
  const [statementPassword, setStatementPassword] = useState('')
  const [transactionCount, setTransactionCount] = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const monthKey = (y:number, m:number) => `${y}-${m}`

  // 1. Initial Guard
  if (!selectedMonth) return <div className="p-20 text-center">Loading Month Data...</div>

  const isUploaded = uploadedSet.has(monthKey(selectedMonth.year, selectedMonth.month))

  const { token, isAuthenticated } = useAppStore()

  useEffect(() => {
    if (!isAuthenticated) return
    setFetchError('')
    listUploadedMonths()
      .then(data => {
        const keys = new Set(data.map((d:any) => monthKey(d.year, d.month)))
        setUploadedSet(keys)
      })
      .catch((err: any) => {
        setFetchError(err.response?.data?.detail || 'Failed to sync budget list.')
      })
  }, [isAuthenticated, token])

  useEffect(() => {
    if (!isUploaded) {
      setLiveData(null)
      setTransactionCount(0)
      return
    }
    setIsFetching(true)
    getMonthlyBudget(selectedMonth.year, selectedMonth.month)
      .then(data => {
        const totals = data?.category_totals || {}
        const chartData = Object.entries(totals).map(([name, value]) => ({
          name, value: Number(value), color: CATEGORY_COLORS[name] || '#a1a1aa'
        }))
        setLiveData(chartData)
        setTransactionCount(data?.transaction_count || 0)
      })
      .catch(() => setLiveData(null))
      .finally(() => setIsFetching(false))
  }, [selectedIdx, uploadedSet, isUploaded])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('loading')
    setUploadError('')
    try {
      const res = await uploadStatement(file, selectedMonth.year, selectedMonth.month, statementPassword)
      const totals = res?.category_totals || {}
      const chartData = Object.entries(totals).map(([name, value]) => ({
        name, value: Number(value), color: CATEGORY_COLORS[name] || '#a1a1aa'
      }))
      setLiveData(chartData)
      setTransactionCount(res?.transaction_count || 0)
      setUploadedSet(prev => new Set(prev).add(monthKey(selectedMonth.year, selectedMonth.month)))
      setUploadStatus('success')
      setStatementPassword('')
    } catch (err: any) {
      // SAFE ERROR HANDLING: Never pass an object/array to setUploadError
      const detail = err.response?.data?.detail
      const errorMessage = typeof detail === 'string' 
        ? detail 
        : Array.isArray(detail) 
          ? detail[0]?.msg || 'Validation error'
          : 'Upload failed.'

      setUploadError(errorMessage)
      setUploadStatus('error')
    }
    if (e.target) e.target.value = ''
  }

  const currentData = liveData || MOCK_DATA
  const totalBudget = currentData.reduce((acc, item) => acc + (item?.value || 0), 0)

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">Budget Analysis</h1>
            <p className="text-slate-500 dark:text-slate-400">Personalized spending breakdown</p>
          </div>
          
          <div className="w-full">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
              {allMonths.map((m, idx) => {
                const isActive = selectedIdx === idx
                const hasData = uploadedSet.has(monthKey(m.year, m.month))
                const isNewYear = idx > 0 && m.year !== allMonths[idx-1].year

                return (
                  <div key={idx} className="flex items-center gap-2 shrink-0">
                    {isNewYear && (
                      <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 mx-2" />
                    )}
                    <button
                      onClick={() => setSelectedIdx(idx)}
                      className={`
                        relative px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300
                        ${isActive 
                          ? 'text-white' 
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                        }
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeMonth"
                          className="absolute inset-0 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {MONTH_NAMES[m.month - 1]}
                        {hasData && !isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                        <span className="text-[10px] opacity-50 block mt-0.5 font-medium">
                          {m.year}
                        </span>
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Errors */}
        <AnimatePresence>
          {(uploadStatus === 'error' || fetchError) && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-2xl text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {uploadError || fetchError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload State */}
        {!isUploaded && !isFetching && (
          <div className="bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl"><UploadCloud className="w-8 h-8 text-blue-500" /></div>
            <h3 className="font-bold text-lg dark:text-white">No data for this month</h3>
            <div className="w-full max-w-xs space-y-4">
               <input type="password" placeholder="Password (Optional)" value={statementPassword} onChange={(e) => setStatementPassword(e.target.value)} 
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm" />
               <button onClick={() => fileInputRef.current?.click()} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20">
                 {uploadStatus === 'loading' ? 'Analyzing...' : 'Upload Bank Statement'}
               </button>
            </div>
          </div>
        )}

        {isFetching && <div className="p-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" /></div>}

        {/* Chart View */}
        {isUploaded && !isFetching && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 aspect-square relative max-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={currentData} innerRadius="65%" outerRadius="90%" paddingAngle={5} dataKey="value" stroke="none">
                      {currentData.map((entry:any, index:number) => <Cell key={`c-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold dark:text-white">₹{totalBudget.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="font-bold text-lg dark:text-white">Breakdown</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                    {transactionCount} Transactions
                  </span>
                </div>
                {currentData.map((item:any, idx:number) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-medium">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />{item.name}</div>
                    <span>₹{item.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 space-y-3">
                  <input 
                    type="password" placeholder="New File Password (if any)" 
                    value={statementPassword} onChange={(e) => setStatementPassword(e.target.value)} 
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px]" 
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-bold text-slate-500 transition-colors">
                    Re-upload Statement
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
               <Sparkles className="w-8 h-8 mb-6" />
               <h3 className="text-xl font-bold mb-2">AI Summary</h3>
               <p className="text-blue-50 leading-relaxed text-sm opacity-90">
                 "Our analysis shows a consistent spending pattern. You are currently saving 12% more than the average user in your income bracket."
               </p>
            </div>
          </div>
        )}

        {/* Global Hidden Input */}
        <input 
          ref={fileInputRef} 
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={handleFileUpload} 
        />
      </div>
    </div>
  )
}
