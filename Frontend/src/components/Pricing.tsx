import React, { useEffect, useState } from 'react';
import { Check, ShieldCheck, RefreshCw, Zap, ArrowRight, Loader2, CreditCard, Bitcoin } from 'lucide-react';
import { PLANS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Challenge, challengeAPI, paymentAPI } from '../api';
import { useAuth } from '../AuthContext';
import PaymentModal from './PaymentModal';

interface PricingProps {
  user: User | null;
  onAuthClick: () => void;
}

const Pricing: React.FC<PricingProps> = ({ user, onAuthClick }) => {
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // Default to middle plan
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { user: currentUser } = useAuth();
  const [templates, setTemplates] = useState<Challenge[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        console.log('Loading challenge templates...');
        const t = await challengeAPI.getTemplates();
        console.log('Templates loaded:', t);
        setTemplates(Array.isArray(t) ? t : []);
        setTemplatesLoading(false);
      } catch (error) {
        console.error('Failed to load challenge templates:', error);
        setTemplates([]);
        setTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  const parseBalance = (sizeStr: string) => {
    const cleaned = sizeStr.replace(/[\$,]/g, '');
    const val = parseInt(cleaned, 10);
    return isNaN(val) ? null : val;
  };

  const resolveChallengeId = (): number | null => {
    // Ensure templates is an array before calling find
    if (!Array.isArray(templates) || templates.length === 0) {
      console.error('Templates not loaded yet');
      return null;
    }

    const byTier = templates.find(t => t.tier?.toLowerCase() === selectedPlan.id.toLowerCase());
    if (byTier) return byTier.id;

    const bal = parseBalance(selectedPlan.size);
    if (bal != null) {
      const byBalance = templates.find(t => t.initial_balance === bal);
      if (byBalance) return byBalance.id;
    }
    return null;
  };

  const handleOpenPaymentModal = () => {
    console.log('Opening payment modal with user:', user, 'currentUser:', currentUser);

    if (!user && !currentUser) {
      console.log('No user found, opening auth modal');
      onAuthClick();
      return;
    }

    // Check if JWT token exists
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No JWT token found, opening auth modal');
      alert('Please log in to make a payment.');
      onAuthClick();
      return;
    }

    // Check if templates are loaded
    if (!Array.isArray(templates) || templates.length === 0) {
      console.log('Templates not loaded yet');
      alert('Challenge templates are still loading. Please wait a moment and try again.');
      return;
    }

    const challengeId = resolveChallengeId();
    if (!challengeId) {
      alert('Could not resolve selected challenge. Please try again.');
      return;
    }

    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setPaymentModalOpen(false);
    setTimeout(() => {
      window.location.reload(); // Refresh to show new challenge
    }, 2000);
  };

  if (paymentSuccess) {
    return (
      <section id="programs" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8"
          >
            <Check className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              Payment Successful!
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Your challenge has been activated. You can now start trading!
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="programs" className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider text-sm uppercase">Funding Programs</span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-2 mb-6">Choose Your Capital</h2>
          <p className="text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
            Transparent rules, achievable targets, and competitive pricing. Select the account size that fits your ambition.
          </p>
        </motion.div>

        {/* Plan Selector Buttons */}
        <div className="flex justify-center mb-12">
          <div className="bg-white dark:bg-white/5 p-1.5 rounded-2xl inline-flex shadow-sm border border-slate-200 dark:border-white/5">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedPlan.id === plan.id
                    ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-900 shadow-lg scale-105'
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {plan.size}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Card Details */}
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedPlan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="glass-panel border border-slate-200 dark:border-white/10 rounded-3xl p-8 md:p-12 relative overflow-hidden bg-white/80 dark:bg-slate-900/60 shadow-2xl shadow-slate-200/50 dark:shadow-none"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
                
                {/* Left: Details */}
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                       <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{selectedPlan.size}</h3>
                       <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-gray-300">Challenge</span>
                    </div>
                    <p className="text-slate-500 dark:text-gray-400 text-lg">Proven path to managing significant capital.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center text-slate-600 dark:text-gray-300">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center mr-3 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Profit Target</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-bold">{selectedPlan.profitTarget}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center text-slate-600 dark:text-gray-300">
                         <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center mr-3 text-red-600 dark:text-red-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Daily Loss Limit</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-bold">{selectedPlan.dailyLoss}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div className="flex items-center text-slate-600 dark:text-gray-300">
                         <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center mr-3 text-orange-600 dark:text-orange-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Max Drawdown</span>
                      </div>
                      <span className="text-slate-900 dark:text-white font-bold">{selectedPlan.maxDrawdown}</span>
                    </div>

                    <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                       <div className="flex items-center text-slate-600 dark:text-gray-300">
                         <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center mr-3 text-cyan-600 dark:text-cyan-400">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Profit Split</span>
                      </div>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">{selectedPlan.split}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Checkout Action */}
                <div className="relative">
                  {/* Floating Badge (Moved outside the card content logic to avoid clipping if hidden, but here handled by layout) */}
                   {selectedPlan.id === 'pro' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span
                        className="text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg shadow-cyan-500/30 flex items-center gap-1"
                        style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                      >
                        <Zap className="w-3 h-3 fill-white" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div className="bg-slate-900 dark:bg-[#0B1121] rounded-3xl p-8 border border-slate-800 dark:border-white/10 text-center shadow-2xl relative overflow-hidden group">
                    
                    {/* Background Animation */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    
                    <div className="relative z-10 pt-4 pb-2">
                      <div className="flex items-end justify-center mb-2">
                         <span className="text-6xl font-bold text-white tracking-tight">${selectedPlan.price}</span>
                         <span className="text-slate-400 font-medium mb-2 ml-1">/ lifetime</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-8">One-time fee. No recurring charges.</p>

                      {user ? (
                        <div className="space-y-3">
                          <button
                            onClick={handleOpenPaymentModal}
                            disabled={templatesLoading}
                            className="w-full group relative overflow-hidden text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                            style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                          >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer opacity-50"></div>
                            <span className="flex items-center justify-center relative z-10">
                              Get Started Now
                              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </button>
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                            Secure payment • Instant activation • 100% refundable
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={onAuthClick}
                          className="w-full group relative overflow-hidden bg-white text-slate-900 font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-cyan-500/25"
                        >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-slate-100 to-transparent -translate-x-full group-hover:animate-shimmer opacity-50"></div>
                          <span className="flex items-center justify-center relative z-10">
                            Sign In to Start
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </button>
                      )}

                      <div className="mt-6 space-y-3">
                         <div className="flex items-center justify-center text-xs text-slate-400">
                           <RefreshCw className="w-3 h-3 mr-2 text-emerald-500" />
                           <span>100% Refundable with first payout</span>
                         </div>
                         <div className="flex items-center justify-center text-xs text-slate-400">
                           <Check className="w-3 h-3 mr-2 text-emerald-500" />
                           <span>Instant account credentials</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        selectedPlan={selectedPlan}
        challengeId={resolveChallengeId()}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </section>
  );
};

export default Pricing;
