import React from 'react';
import { Target, BarChart2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: Target,
    title: "1. Choose Your Challenge",
    description: "Select an account size that fits your trading style. Pay a one-time fee to begin your evaluation.",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-400/10",
    border: "border-blue-200 dark:border-blue-400/20"
  },
  {
    icon: BarChart2,
    title: "2. Trade & Qualify",
    description: "Reach the 10% profit target without hitting the daily loss limit. No minimum trading days required.",
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-400/10",
    border: "border-purple-200 dark:border-purple-400/20"
  },
  {
    icon: Briefcase,
    title: "3. Get Funded",
    description: "Pass verification and receive your funded account credentials. Start earning real payouts bi-weekly.",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-400/10",
    border: "border-emerald-200 dark:border-emerald-400/20"
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white dark:bg-slate-950 relative transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
          <p className="text-slate-600 dark:text-gray-400 text-lg">Your journey to becoming a professional trader in 3 simple steps.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-emerald-500/20 -z-0"></div>

          {steps.map((step, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div className={`w-24 h-24 rounded-full ${step.bg} ${step.border} border flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-black/5 dark:shadow-none`}>
                <step.icon className={`w-10 h-10 ${step.color}`} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
              <p className="text-slate-600 dark:text-gray-400 leading-relaxed max-w-xs">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;