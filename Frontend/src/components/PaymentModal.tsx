import React, { useState } from 'react';
import { X, CreditCard, Bitcoin, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { paymentAPI } from '../api';
import { Challenge } from '../api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: any;
  challengeId: number | null;
  onPaymentSuccess: () => void;
}

interface PaymentFormData {
  // CMI fields
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;

  // Crypto fields
  walletAddress: string;
  cryptoAmount: string;

  // PayPal fields
  paypalEmail: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  challengeId,
  onPaymentSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cmi' | 'crypto' | 'paypal' | null>(null);
  const [step, setStep] = useState<'method' | 'form' | 'processing' | 'success' | 'error'>('method');
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    walletAddress: '',
    cryptoAmount: '',
    paypalEmail: ''
  });
  const [error, setError] = useState<string>('');

  const resetModal = () => {
    setPaymentMethod(null);
    setStep('method');
    setFormData({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      walletAddress: '',
      cryptoAmount: '',
      paypalEmail: ''
    });
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handlePaymentMethodSelect = (method: 'cmi' | 'crypto' | 'paypal') => {
    setPaymentMethod(method);
    setStep('form');
  };

  const handleBackToMethods = () => {
    setStep('method');
    setPaymentMethod(null);
    setError('');
  };

  const validateForm = (): boolean => {
    if (!paymentMethod) return false;

    switch (paymentMethod) {
      case 'cmi':
        if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
          setError('Please fill in all card details');
          return false;
        }
        if (formData.cardNumber.replace(/\s/g, '').length < 16) {
          setError('Please enter a valid card number');
          return false;
        }
        break;
      case 'crypto':
        if (!formData.walletAddress) {
          setError('Please enter your wallet address');
          return false;
        }
        break;
      case 'paypal':
        if (!formData.paypalEmail || !formData.paypalEmail.includes('@')) {
          setError('Please enter a valid PayPal email');
          return false;
        }
        break;
    }
    return true;
  };

  const handleCompletePayment = async () => {
    if (!validateForm() || !challengeId) return;

    setStep('processing');
    setError('');

    try {
      let result;
      if (paymentMethod === 'cmi') {
        result = await paymentAPI.processCMI(challengeId);
      } else if (paymentMethod === 'crypto') {
        result = await paymentAPI.processCrypto(challengeId);
      } else if (paymentMethod === 'paypal') {
        result = await paymentAPI.createPayPalOrder(challengeId);
        if (result.approval_url && !result.mock_payment) {
          window.location.href = result.approval_url;
          return;
        }
      }

      // Simulate processing delay (2-3 seconds)
      await new Promise(resolve => setTimeout(resolve, 2500));

      if (result) {
        setStep('success');
        setTimeout(() => {
          handleClose();
          onPaymentSuccess();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStep('error');
      setError(error.message || 'Payment failed. Please try again.');
    }
  };

  const renderPaymentMethodSelection = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-6">
        Choose Payment Method
      </h3>

      <div className="grid gap-3">
        <button
          onClick={() => handlePaymentMethodSelect('cmi')}
          className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
            <CreditCard className="w-6 h-6 text-cyan-600 dark:text-cyan-400 group-hover:text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-slate-900 dark:text-white">CMI</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Moroccan payment gateway</div>
          </div>
          <div className="text-slate-400 dark:text-slate-500">→</div>
        </button>

        <button
          onClick={() => handlePaymentMethodSelect('crypto')}
          className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
            <Bitcoin className="w-6 h-6 text-cyan-600 dark:text-cyan-400 group-hover:text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-slate-900 dark:text-white">Cryptocurrency</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">BTC, ETH, USDT supported</div>
          </div>
          <div className="text-slate-400 dark:text-slate-500">→</div>
        </button>

        <button
          onClick={() => handlePaymentMethodSelect('paypal')}
          className="flex items-center space-x-4 p-4 border border-slate-200 dark:border-white/10 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-all group"
        >
          <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
            <DollarSign className="w-6 h-6 text-cyan-600 dark:text-cyan-400 group-hover:text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-slate-900 dark:text-white">PayPal</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Secure payment processing</div>
          </div>
          <div className="text-slate-400 dark:text-slate-500">→</div>
        </button>
      </div>
    </div>
  );

  const renderCMIForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToMethods}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">CMI Payment</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Card Number
          </label>
          <input
            type="text"
            placeholder="1234 5678 9012 3456"
            value={formData.cardNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim() }))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Expiry Date
            </label>
            <input
              type="text"
              placeholder="MM/YY"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              maxLength={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              CVV
            </label>
            <input
              type="text"
              placeholder="123"
              value={formData.cvv}
              onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
              className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              maxLength={4}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Cardholder Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={formData.cardholderName}
            onChange={(e) => setFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderCryptoForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToMethods}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
            <Bitcoin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">Crypto Payment</span>
        </div>
      </div>

      <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-cyan-900 dark:text-cyan-100">Send exactly the required amount</div>
            <div className="text-cyan-700 dark:text-cyan-300 mt-1">
              Amount: <span className="font-bold">{selectedPlan?.price} USD</span> in BTC, ETH, or USDT
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Your Wallet Address
          </label>
          <input
            type="text"
            placeholder="0x1234...abcd"
            value={formData.walletAddress}
            onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Deposit Address (Generated)</div>
          <div className="font-mono text-sm bg-white dark:bg-slate-900 p-3 rounded border text-center">
            bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
          </div>
        </div>
      </div>
    </div>
  );

  const renderPayPalForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToMethods}
          className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-600/20 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <span className="font-semibold text-slate-900 dark:text-white">PayPal Payment</span>
        </div>
      </div>

      <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-cyan-900 dark:text-cyan-100">Secure PayPal Checkout</div>
            <div className="text-cyan-700 dark:text-cyan-300 mt-1">
              You'll be redirected to PayPal to complete your payment securely.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            PayPal Email
          </label>
          <input
            type="email"
            placeholder="your-email@example.com"
            value={formData.paypalEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, paypalEmail: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-6">
        <Loader2 className="w-16 h-16 animate-spin text-cyan-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Processing Payment
      </h3>
      <p className="text-slate-600 dark:text-slate-400">
        Please wait while we process your {paymentMethod?.toUpperCase()} payment...
      </p>
      <div className="mt-6 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Payment Successful! 🎉
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Congratulations! Your challenge has been activated.
      </p>
      <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-lg p-4">
        <div className="text-sm text-cyan-800 dark:text-cyan-200">
          <strong>Challenge:</strong> {selectedPlan?.size} Account<br />
          <strong>Amount:</strong> ${selectedPlan?.price}<br />
          <strong>Method:</strong> {paymentMethod?.toUpperCase()}<br />
          <strong>Status:</strong> Active
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
        You can now start trading! Redirecting to dashboard...
      </p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Payment Failed
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        {error || 'Something went wrong with your payment.'}
      </p>
      <div className="space-y-3">
        <button
          onClick={() => setStep('form')}
          className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-6 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          Try Again
        </button>
        <button
          onClick={handleClose}
          className="w-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'method':
        return renderPaymentMethodSelection();
      case 'form':
        if (paymentMethod === 'cmi') return renderCMIForm();
        if (paymentMethod === 'crypto') return renderCryptoForm();
        if (paymentMethod === 'paypal') return renderPayPalForm();
        return renderPaymentMethodSelection();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderPaymentMethodSelection();
    }
  };

  const canProceed = () => {
    if (step === 'method') return false;
    if (step === 'processing' || step === 'success') return false;
    return true;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Complete Your Purchase
                </h2>
                {(step === 'method' || step === 'error') && (
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {renderContent()}
              </div>

              {/* Footer */}
              {canProceed() && (
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total: <span className="font-bold text-slate-900 dark:text-white">${selectedPlan?.price}</span>
                  </div>
                  <button
                    onClick={handleCompletePayment}
                    disabled={!paymentMethod || step === 'processing'}
                    className="text-white font-bold py-3 px-8 rounded-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-lg"
                    style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
                  >
                    Complete Payment
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;