import React from 'react';
import { ArrowRight, ChevronRight, PlayCircle } from 'lucide-react';
import { STATS } from '../../constants';
import { motion } from 'framer-motion';
import { User } from '../api';

interface HeroProps {
  onAuthClick: () => void;
  user: User | null;
}

const Hero: React.FC<HeroProps> = ({ onAuthClick, user }) => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-24 pb-12 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 dark:opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-emerald-300 tracking-wide uppercase">Accepting New Traders</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight"
        >
          Trade Smarter. <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              background: 'linear-gradient(to right, #06b6d4, #10b981)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
            }}
          >
            Get Funded.
          </span>{' '}
          Scale Fast.
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Prove your skills on our simulated platform and manage up to <span className="text-slate-900 dark:text-white font-semibold">$200,000</span> in capital. 
          Keep up to <span className="text-slate-900 dark:text-white font-semibold">90%</span> of the profits.
        </motion.p>

        {/* CTA Buttons - Customized */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
        >
          <button
            onClick={() => user ? document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' }) : onAuthClick()}
            className="group relative px-8 py-4 text-white text-base font-bold rounded-full transition-all hover:scale-105 shadow-[0_10px_40px_-10px_rgba(6,182,212,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(6,182,212,0.6)] overflow-hidden hover:opacity-90"
            style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
            <span className="flex items-center relative z-10">
              {user ? 'View Trading Plans' : 'Start Challenge'}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <button
            onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
            className="group px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-base font-medium rounded-full transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20"
          >
            <span className="flex items-center">
              View Pricing
              <PlayCircle className="ml-2 w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
            </span>
          </button>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {STATS.map((stat, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none hover:border-cyan-500/30 transition-colors bg-white/60 dark:bg-slate-900/60">
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2">{stat.label}</p>
              <p className="text-xs text-slate-500 dark:text-gray-500">{stat.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;