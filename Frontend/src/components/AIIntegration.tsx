import React from 'react';
import { motion } from 'framer-motion';
import { ECOSYSTEM } from '../../constants';
import { Bot, Newspaper, Users, GraduationCap, ArrowUpRight, Wifi, TrendingUp, AlertTriangle } from 'lucide-react';

const AIIntegration: React.FC = () => {
  return (
    <section id="ecosystem" className="py-32 bg-slate-50 dark:bg-[#020617] transition-colors duration-300 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 max-w-3xl"
        >
          <span className="text-cyan-600 dark:text-cyan-400 font-bold tracking-widest text-xs uppercase mb-2 block">The TradeSense Ecosystem</span>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
            Intelligence Meets <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">Execution.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">
          
          {/* Card 1: AI Assistant (Large - 2/3 width) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 bg-white dark:bg-[#0B1121]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-colors duration-500"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Bot className="w-32 h-32 text-indigo-500" />
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{ECOSYSTEM[0].title}</h3>
                <p className="text-slate-600 dark:text-gray-400 max-w-md">{ECOSYSTEM[0].description}</p>
              </div>

              {/* Mock UI: Trading Signal */}
              <div className="mt-8 bg-slate-100 dark:bg-[#131B2E] rounded-xl border border-slate-200 dark:border-white/5 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-mono text-emerald-500">AI SIGNAL DETECTED</span>
                  </div>
                  <span className="text-xs text-slate-400">Just now</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">XAU/USD</div>
                    <div className="text-xs text-slate-500 uppercase">Gold vs US Dollar</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-500 font-bold flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> BUY
                    </div>
                    <div className="text-xs text-slate-500">Conf: 94.2%</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: News Hub (Tall - 1/3 width, 2 rows height ideally, but here fitting grid) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-1 md:row-span-2 bg-white dark:bg-[#0B1121]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-cyan-500/50 transition-colors duration-500"
          >
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Newspaper className="w-24 h-24 text-cyan-500" />
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 text-cyan-600 dark:text-cyan-400">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{ECOSYSTEM[1].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 mb-8">{ECOSYSTEM[1].description}</p>

              {/* Mock UI: News Feed */}
              <div className="flex-1 space-y-3">
                {[
                  { tag: "IMPACT", title: "US CPI Data Released", time: "2m ago", color: "text-red-500 bg-red-500/10" },
                  { tag: "INFO", title: "Market Summary: Bullish", time: "15m ago", color: "text-blue-500 bg-blue-500/10" },
                  { tag: "NEWS", title: "Tech Sector Rally", time: "1h ago", color: "text-emerald-500 bg-emerald-500/10" }
                ].map((news, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-[#131B2E] p-3 rounded-lg border border-slate-200 dark:border-white/5 transition-transform hover:scale-105 cursor-default">
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${news.color}`}>{news.tag}</span>
                      <span className="text-[10px] text-slate-400">{news.time}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{news.title}</div>
                  </div>
                ))}
                <div className="h-12 bg-gradient-to-t from-white dark:from-[#0B1121] to-transparent absolute bottom-0 w-full left-0"></div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Community (1/3 width) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#0B1121]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-colors duration-500"
          >
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-emerald-500" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{ECOSYSTEM[2].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">{ECOSYSTEM[2].description}</p>
              
              {/* Mock UI: Avatars */}
              <div className="flex items-center -space-x-3">
                 {[1,2,3,4].map((i) => (
                   <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0B1121] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                      U{i}
                   </div>
                 ))}
                 <div className="w-10 h-10 rounded-full border-2 border-white dark:border-[#0B1121] bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                    +2k
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: MasterClass (1/3 width) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-[#0B1121]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-orange-500/50 transition-colors duration-500"
          >
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <GraduationCap className="w-24 h-24 text-orange-500" />
            </div>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-600 dark:text-orange-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{ECOSYSTEM[3].title}</h3>
              <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">{ECOSYSTEM[3].description}</p>

              {/* Mock UI: Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                   <span>Risk Management 101</span>
                   <span>85%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-orange-500 w-[85%] rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AIIntegration;