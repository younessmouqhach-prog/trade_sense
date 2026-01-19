import React from 'react';
import { FEATURES } from '../../constants';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Shield, Globe, Award, TrendingUp } from 'lucide-react';

const Features: React.FC = () => {
  return (
    <section id="why-us" className="py-32 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Why Top Traders Choose <br />
            <span className="text-cyan-500">TradeSense AI</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-gray-400">
            We've built a proprietary infrastructure designed to give you a statistical edge in the market.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative p-8 rounded-2xl bg-slate-50 dark:bg-[#0B1121] border border-slate-200 dark:border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden"
            >
              {/* Hover Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white dark:bg-[#131B2E] rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative Corner Icon */}
              <div className="absolute -bottom-4 -right-4 text-slate-200 dark:text-white/5 transform rotate-12 group-hover:rotate-0 transition-transform duration-500">
                 <feature.icon className="w-24 h-24" />
              </div>
            </motion.div>
          ))}
          
          {/* Sixth "Call to Action" Card to balance grid if needed, or just a metric card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="group relative p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-cyan-600 dark:to-cyan-800 text-white flex flex-col justify-center items-center text-center shadow-xl"
          >
             <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
             <p className="text-slate-300 dark:text-cyan-100 mb-6 text-sm">Join 15,000+ traders scaling their capital today.</p>
             <button className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm hover:scale-105 transition-transform">
               Get Funded
             </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;