import React from 'react'
import { LayoutDashboard, PieChart, Calculator, FileText, Settings, UserCircle, HandCoins } from 'lucide-react'
import { ChatWindow } from '@/features/chat/ChatWindow'
import { cn } from '@/lib/utils'

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <button className={cn(
    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group",
    active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  )}>
    <Icon className={cn("w-5 h-5 transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
    {label}
  </button>
)

const App = () => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground antialiased font-sans selection:bg-primary/20">
      {/* Sidebar - Collapses on mobile */}
      <aside className="hidden md:flex flex-col w-[280px] border-r bg-card/40 backdrop-blur-xl p-4 gap-6 shrink-0 relative">
        <div className="font-bold text-xl tracking-tight mt-2 text-foreground flex items-center justify-between">
           <div className="flex items-center gap-2.5">
             <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-sm">
               <HandCoins className="w-5 h-5"/>
             </div>
             <span>FinAI <span className="text-primary">Analyst</span></span>
           </div>
        </div>
        
        <nav className="space-y-1.5 flex-1 mt-4">
          <p className="px-4 text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider mb-2">Insights hub</p>
          <SidebarItem icon={LayoutDashboard} label="Portfolio Overview" active />
          <SidebarItem icon={PieChart} label="Budget Analysis" />
          <SidebarItem icon={Calculator} label="EMI Calculator" />
          <SidebarItem icon={FileText} label="Credit Profile" />
        </nav>

        <div className="mt-auto space-y-1 border-t pt-4">
          <SidebarItem icon={Settings} label="Settings" />
          <SidebarItem icon={UserCircle} label="My Account" />
        </div>
      </aside>
      
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-background/95 relative shadow-inner">
        <ChatWindow />
      </main>
    </div>
  )
}

export default App
