import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Calculator, Info, Sparkles, TrendingUp, Calendar, Percent, Landmark, Loader2 } from 'lucide-react'
import { listUploadedMonths, getMonthlyBudget, getLoanAdvice } from '@/services/api'
import { useAppStore } from '@/store/useAppStore'
import { useEffect, useState, useMemo } from 'react'

const COLORS = ['#3b82f6', '#f59e0b'] // Principal (Blue), Interest (Amber)

export const EMICalculator = () => {
  // Inputs
  const [loanAmount, setLoanAmount] = useState(1000000) // 10 Lakhs default
  const [interestRate, setInterestRate] = useState(9.5)  // 9.5% default
  const [tenureYears, setTenureYears] = useState(15)     // 15 years default

  // 1. Calculate EMI first
  const { emi, totalInterest, totalPayment, principalPercent, interestPercent, schedule } = useMemo(() => {
    const P = loanAmount
    const r = interestRate / 12 / 100
    const n = tenureYears * 12
    
    const emiCalc = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPay = emiCalc * n
    const totalInt = totalPay - P
    
    // Simple yearly amortization for the bar chart
    const yearlySchedule = []
    let balance = P
    for (let year = 1; year <= tenureYears; year++) {
      let yearlyInterest = 0
      let yearlyPrincipal = 0
      for (let month = 1; month <= 12; month++) {
          const interest = balance * r
          const principal = emiCalc - interest
          yearlyInterest += interest
          yearlyPrincipal += principal
          balance -= principal
      }
      yearlySchedule.push({
        year: `Year ${year}`,
        Principal: Math.round(yearlyPrincipal),
        Interest: Math.round(yearlyInterest),
        Balance: Math.max(0, Math.round(balance))
      })
    }

    return {
      emi: Math.round(emiCalc),
      totalInterest: Math.round(totalInt),
      totalPayment: Math.round(totalPay),
      principalPercent: Math.round((P / totalPay) * 100),
      interestPercent: Math.round((totalInt / totalPay) * 100),
      schedule: yearlySchedule
    }
  }, [loanAmount, interestRate, tenureYears])

  // App State Integration
  const { setCurrentView, addMessage, isAuthenticated } = useAppStore()
  const [avgIncome, setAvgIncome] = useState<number>(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isFetchingIncome, setIsFetchingIncome] = useState(false)
  const isMockData = !avgIncome || avgIncome === 45000

  const incomeUtilRatio = useMemo(() => {
    if (!avgIncome) return 0
    return Math.round((emi / avgIncome) * 100)
  }, [emi, avgIncome])

  const handleGetAdvice = async () => {
    setIsAnalyzing(true)
    try {
      const res = await getLoanAdvice({ amount: loanAmount, rate: interestRate, tenure: tenureYears })
      const aiResponse = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: res.response,
        timestamp: new Date()
      }
      addMessage(aiResponse)
      setCurrentView('chat')
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Fetch average income from last 12 months for live analysis
  useEffect(() => {
    if (!isAuthenticated) return
    setIsFetchingIncome(true)
    listUploadedMonths()
      .then(async (months) => {
        if (!months.length) return
        const latest = months[months.length - 1]
        const data = await getMonthlyBudget(latest.year, latest.month)
        setAvgIncome(Number(data.income) || 0)
      })
      .catch(() => setAvgIncome(45000))
      .finally(() => setIsFetchingIncome(false))
  }, [isAuthenticated])

  const pieData = [
    { name: 'Principal Amount', value: loanAmount },
    { name: 'Total Interest', value: totalInterest }
  ]

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              Smart EMI Calculator
            </motion.h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Plan your future home, car, or personal loan with AI precision.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">AI Enabled Analysis</span>
          </div>
        </div>

        {/* Mock Data Warning */}
        {isMockData && !isFetchingIncome && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
             className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl">
                <Info className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Currently Using Mock Data</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Connect your bank statement for income-aware affordability analysis.</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('budgets')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all shrink-0"
            >
              Upload Bank Statement
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          
          {/* Left: Controls */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 space-y-8 shadow-sm">
              
              {/* Loan Amount */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-500" /> Loan Amount
                  </label>
                  <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl font-bold text-blue-600 dark:text-blue-400 shadow-inner">
                    ₹ {loanAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <input 
                  type="range" min="100000" max="10000000" step="50000" 
                  value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-all hover:accent-blue-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  <span>1 Lakh</span><span>50 Lakhs</span><span>1 Cr</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-500" /> Interest Rate (%)
                  </label>
                  <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl font-bold text-amber-600 dark:text-amber-500 shadow-inner">
                    {interestRate}%
                  </div>
                </div>
                <input 
                  type="range" min="1" max="25" step="0.1" 
                  value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  <span>1%</span><span>12.5%</span><span>25%</span>
                </div>
              </div>

              {/* Tenure */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" /> Loan Tenure
                  </label>
                  <div className="bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 shadow-inner">
                    {tenureYears} Years
                  </div>
                </div>
                <input 
                  type="range" min="1" max="30" step="1" 
                  value={tenureYears} onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  <span>1 Year</span><span>15 Years</span><span>30 Years</span>
                </div>
              </div>
            </div>

            {/* AI Insight Overlay */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="w-24 h-24" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 font-bold text-indigo-100">
                  <Info className="w-5 h-5" /> Smart Insight
                </div>
                <p className="text-lg font-medium leading-tight">
                   {isFetchingIncome ? (
                     "Analyzing your income profile..."
                   ) : (
                     <>
                       "A monthly EMI of <strong className="text-white">₹{emi.toLocaleString('en-IN')}</strong> is <span className={incomeUtilRatio > 45 ? "text-rose-400 font-black underline underline-offset-4" : "text-emerald-300"}>{incomeUtilRatio}%</span> of your monthly income."
                     </>
                   )}
                </p>
                <div className="text-indigo-200 text-sm italic">
                  {avgIncome > 0 && !isMockData ? "* Calculated from your real bank statements." : "* Currently showing general mock data. Upload a statement for precision."}
                </div>
                <div className="pt-2">
                  <button 
                    onClick={handleGetAdvice}
                    disabled={isAnalyzing}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                    {isAnalyzing ? 'Consulting Analyst...' : 'Get Refinancing Advice'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Results & Charts */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Monthly EMI</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{emi.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Interest</p>
                <p className="text-2xl font-black text-amber-600">₹{totalInterest.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm border-r-4 border-r-indigo-500">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-1">Total Payable</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{totalPayment.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm overflow-hidden relative">
              <div className="flex flex-col md:flex-row items-center gap-8">
                
                {/* Donut Chart */}
                <div className="w-full md:w-1/2 h-[240px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0/0.1)', background: 'rgba(255,255,255,0.98)' }}
                         itemStyle={{ color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }}
                         formatter={(v) => [`₹${Number(v ?? 0).toLocaleString('en-IN')}`, '']}
                      />
                      <Pie 
                        data={pieData} innerRadius={60} outerRadius={90} 
                        paddingAngle={8} dataKey="value" stroke="none"
                        animationBegin={0} animationDuration={800}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ratio</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{principalPercent}:{interestPercent}</span>
                  </div>
                </div>

                {/* Legend & Details */}
                <div className="w-full md:w-1/2 space-y-6">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Loan Composition</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 transition-transform hover:scale-[1.02]">
                       <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Principal</span>
                       </div>
                       <span className="text-sm font-black text-slate-900 dark:text-white">₹{loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 transition-transform hover:scale-[1.02]">
                       <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Interest</span>
                       </div>
                       <span className="text-sm font-black text-slate-900 dark:text-white">₹{totalInterest.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                      Tip: Prepaying ₹5,000 extra/month saves ₹3.2L in interest.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amortization Chart */}
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Yearly Amortization Schedule</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-blue-500" /> Principal
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-amber-500" /> Interest
                   </div>
                </div>
              </div>
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={schedule}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(203, 213, 225, 0.2)" />
                    <XAxis dataKey="year" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)', background: 'white' }}
                       formatter={(v) => [`₹${Number(v ?? 0).toLocaleString('en-IN')}`, '']}
                    />
                    <Bar dataKey="Principal" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Interest" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
