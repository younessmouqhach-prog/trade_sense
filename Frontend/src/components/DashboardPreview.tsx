import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, DollarSign, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const data = [
  { day: 'Mon', pnl: 50000 },
  { day: 'Tue', pnl: 50200 },
  { day: 'Wed', pnl: 51500 },
  { day: 'Thu', pnl: 51100 },
  { day: 'Fri', pnl: 52800 },
  { day: 'Sat', pnl: 53200 },
  { day: 'Sun', pnl: 54500 },
];

const DashboardPreview: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-gray-900 overflow-hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 text-center md:text-left md:flex md:justify-between md:items-end">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Professional Grade Dashboard</h2>
            <p className="text-slate-600 dark:text-gray-400 text-lg">
              Track your equity, monitor drawdown, and analyze your performance in real-time with our custom-built trader portal.
            </p>
          </div>
          <button className="hidden md:flex items-center text-cyan-600 dark:text-cyan-400 font-semibold hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors mt-4 md:mt-0">
            View Live Demo <ArrowUpRight className="ml-2 w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Mockup Container */}
        <motion.div 
          initial={{ opacity: 0, y: 50, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1121] shadow-2xl overflow-hidden relative transform md:perspective-[1000px] hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] transition-all duration-500 ease-out"
        >
          
          {/* Mock Header */}
          <div className="h-14 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0F172A] flex items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs text-slate-500 dark:text-gray-500 font-mono">dashboard.tradesense.io</div>
            <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-600 dark:text-cyan-500 text-xs font-bold">TS</span>
            </div>
          </div>

          <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar Mock */}
            <div className="hidden lg:block space-y-4">
              <div className="p-3 rounded-lg bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-sm font-medium flex items-center">
                <Activity className="w-4 h-4 mr-3" /> Dashboard
              </div>
              <div className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 text-sm font-medium flex items-center transition-colors">
                <DollarSign className="w-4 h-4 mr-3" /> Payouts
              </div>
              <div className="p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 text-sm font-medium flex items-center transition-colors">
                <AlertTriangle className="w-4 h-4 mr-3" /> Risk Manager
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Top Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Account Balance", val: "$54,500.00", color: "text-slate-900 dark:text-white" },
                  { label: "Profit Target", val: "$5,000.00", color: "text-emerald-500 dark:text-emerald-400" },
                  { label: "Daily Loss Limit", val: "$2,500.00", color: "text-red-500 dark:text-red-400" },
                  { label: "Equity", val: "$54,500.00", color: "text-cyan-600 dark:text-cyan-400" }
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-[#131B2E] p-4 rounded-lg border border-slate-200 dark:border-white/5">
                    <p className="text-xs text-slate-500 dark:text-gray-500 mb-1">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Chart Area */}
              <div className="bg-slate-50 dark:bg-[#131B2E] rounded-lg border border-slate-200 dark:border-white/5 p-6 h-[300px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-900 dark:text-white font-medium">Equity Curve</h3>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded">+9.0% This Week</div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                    <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} domain={['dataMin - 1000', 'dataMax + 1000']} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--foreground)', borderRadius: '8px', color: 'var(--foreground)' }} 
                      itemStyle={{ color: '#06b6d4' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                    />
                    <Area type="monotone" dataKey="pnl" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorPnl)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;