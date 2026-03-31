import { LayoutDashboard, PieChart, Calculator, FileText, Settings, UserCircle, HandCoins, LogOut } from 'lucide-react'
import { ChatWindow } from '@/features/chat/ChatWindow'
import { AuthOverlay } from '@/features/auth/AuthOverlay'
import { BudgetAnalysis } from '@/features/budget/BudgetAnalysis'
import { EMICalculator } from '@/features/emi/EMICalculator'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { AnimatePresence, motion } from 'framer-motion'

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group",
      active ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
    )}
  >
    <Icon className={cn("w-5 h-5 transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
    {label}
  </button>
)

const App = () => {
  const { isAuthenticated, logout, currentView, setCurrentView } = useAppStore()

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#0a0f1c] overflow-hidden text-slate-900 dark:text-white antialiased font-sans selection:bg-blue-500/20">
      
      <AnimatePresence>
        {!isAuthenticated && <AuthOverlay />}
      </AnimatePresence>

      {/* Left Navigation Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] border-r border-slate-200 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl p-4 gap-6 shrink-0 z-10">
        <div className="font-bold text-xl tracking-tight mt-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm">
              <HandCoins className="w-5 h-5"/>
            </div>
            <span>FinAI <span className="text-blue-600 dark:text-blue-400">Analyst</span></span>
          </div>
        </div>
        
        <nav className="space-y-1.5 flex-1 mt-4">
          <p className="px-4 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Insights hub</p>
          <SidebarItem icon={LayoutDashboard} label="Portfolio Overview" active={currentView === 'overview'} onClick={() => setCurrentView('overview')} />
          <SidebarItem icon={PieChart} label="Budget Analysis" active={currentView === 'budget'} onClick={() => setCurrentView('budget')} />
          <SidebarItem icon={Calculator} label="EMI Calculator" active={currentView === 'emi'} onClick={() => setCurrentView('emi')} />
          <SidebarItem icon={FileText} label="Credit Profile" active={currentView === 'credit'} onClick={() => setCurrentView('credit')} />
        </nav>

        <div className="mt-auto space-y-1 border-t border-slate-200 dark:border-white/5 pt-4">
          <SidebarItem icon={Settings} label="Settings" />
          <SidebarItem icon={UserCircle} label="My Account" />
          {isAuthenticated && (
            <SidebarItem icon={LogOut} label="Sign Out" onClick={logout} />
          )}
        </div>
      </aside>
      
      {/* Full-page view area */}
      <main className={cn(
        "flex-1 h-full overflow-hidden transition-all duration-700 ease-in-out",
        !isAuthenticated ? "blur-md scale-[0.98] opacity-60 pointer-events-none select-none" : ""
      )}>
        <AnimatePresence mode="wait">
          {currentView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              <ChatWindow />
            </motion.div>
          )}

          {currentView === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              <BudgetAnalysis />
            </motion.div>
          )}

          {currentView === 'emi' && (
            <motion.div
              key="emi"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              <EMICalculator />
            </motion.div>
          )}

          {currentView === 'credit' && (
            <motion.div
              key="credit"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full flex flex-col items-center justify-center"
            >
              <div className="text-center space-y-4">
                <div className="bg-violet-600/10 dark:bg-violet-500/10 p-4 rounded-2xl w-fit mx-auto">
                  <FileText className="w-10 h-10 text-violet-600 dark:text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Credit Profile</h2>
                <p className="text-slate-500 dark:text-slate-400">Coming soon.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
