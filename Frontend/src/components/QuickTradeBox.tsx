import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { tradeAPI, marketAPI } from '../api';
import { useAuth } from '../AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickTradeBoxProps {
  symbol?: string;
  currentPrice?: number;
  onTradeExecuted?: () => void;
  className?: string;
  compact?: boolean;
  showConfirmModal?: boolean;
  enableKeyboardShortcuts?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const QuickTradeBox: React.FC<QuickTradeBoxProps> = ({
  symbol: initialSymbol = 'NVDA',
  currentPrice: propCurrentPrice,
  onTradeExecuted,
  className = '',
  compact = false,
  showConfirmModal = true,
  enableKeyboardShortcuts = true
}) => {
  // State management
  const [symbol, setSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState<number>(0.01);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [stopLossPercent, setStopLossPercent] = useState<string>('');
  const [takeProfitPercent, setTakeProfitPercent] = useState<string>('');
  const [usePercentage, setUsePercentage] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(propCurrentPrice || null);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [lastTradeResult, setLastTradeResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<{
    side: 'buy' | 'sell';
    payload: any;
  } | null>(null);

  const { user } = useAuth();
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Update current price when prop changes
  useEffect(() => {
    if (propCurrentPrice && propCurrentPrice > 0) {
      setCurrentPrice(propCurrentPrice);
      console.log('🔄 QuickTradeBox: Updated current price from props:', propCurrentPrice);
    }
  }, [propCurrentPrice]);

  // Fetch current price if not provided
  useEffect(() => {
    if (!currentPrice && symbol) {
      const fetchPrice = async () => {
        try {
          console.log('📡 QuickTradeBox: Fetching current price for', symbol);
          const priceData = await marketAPI.getPopularPrices();
          const symbolData = Object.values(priceData.prices || {}).find(
            (item: any) => item.symbol?.toUpperCase() === symbol.toUpperCase()
          ) as any;

          if (symbolData?.price) {
            const price = parseFloat(symbolData.price);
            setCurrentPrice(price);
            console.log('💰 QuickTradeBox: Fetched current price:', price);
          }
        } catch (error) {
          console.error('❌ QuickTradeBox: Failed to fetch current price:', error);
        }
      };

      fetchPrice();
    }
  }, [symbol, currentPrice]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          if (quantity > 0) handleTradeClick('buy');
          break;
        case 's':
          event.preventDefault();
          if (quantity > 0) handleTradeClick('sell');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboardShortcuts, quantity]);

  // Convert percentage inputs to price values
  useEffect(() => {
    if (!currentPrice || !usePercentage) return;

    if (stopLossPercent) {
      const percent = parseFloat(stopLossPercent);
      if (!isNaN(percent)) {
        const slPrice = currentPrice * (1 - Math.abs(percent) / 100);
        setStopLoss(slPrice.toFixed(4));
      }
    }

    if (takeProfitPercent) {
      const percent = parseFloat(takeProfitPercent);
      if (!isNaN(percent)) {
        const tpPrice = currentPrice * (1 + Math.abs(percent) / 100);
        setTakeProfit(tpPrice.toFixed(4));
      }
    }
  }, [stopLossPercent, takeProfitPercent, currentPrice, usePercentage]);

  // Risk-based position sizing
  const calculatePositionSize = useCallback((riskPercentage: number, stopLossPrice: number) => {
    if (!currentPrice || !stopLossPrice) return 0;

    const accountBalance = 1000; // Demo account balance - in real app, get from user data
    const riskAmount = accountBalance * (riskPercentage / 100);
    const priceDifference = Math.abs(currentPrice - stopLossPrice);

    if (priceDifference === 0) return 0;

    return riskAmount / priceDifference;
  }, [currentPrice]);

  // Validation logic
  const validateTrade = useCallback((side: 'buy' | 'sell'): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validations
    if (!symbol.trim()) {
      errors.push('Symbol is required');
    }

    if (isNaN(quantity) || quantity <= 0) {
      errors.push('Quantity must be a positive number');
    }

    if (!currentPrice || isNaN(currentPrice) || currentPrice <= 0) {
      errors.push('Invalid current price');
    }

    // Stop Loss and Take Profit validations
    const sl = stopLoss ? parseFloat(stopLoss) : null;
    const tp = takeProfit ? parseFloat(takeProfit) : null;

    if (sl !== null && (isNaN(sl) || sl <= 0)) {
      errors.push('Stop Loss must be a positive number');
    }

    if (tp !== null && (isNaN(tp) || tp <= 0)) {
      errors.push('Take Profit must be a positive number');
    }

    if (sl && tp && sl === tp) {
      errors.push('Stop Loss and Take Profit cannot be the same price');
    }

    // Trading logic validations
    if (currentPrice && side === 'buy') {
      if (sl && sl >= currentPrice) {
        errors.push('Stop Loss must be below current price for BUY orders');
      }
      if (tp && tp <= currentPrice) {
        errors.push('Take Profit must be above current price for BUY orders');
      }
      if (sl && tp && sl >= tp) {
        errors.push('Stop Loss must be below Take Profit for BUY orders');
      }
    } else if (currentPrice && side === 'sell') {
      if (sl && sl <= currentPrice) {
        errors.push('Stop Loss must be above current price for SELL orders');
      }
      if (tp && tp >= currentPrice) {
        errors.push('Take Profit must be below current price for SELL orders');
      }
      if (sl && tp && sl <= tp) {
        errors.push('Stop Loss must be above Take Profit for SELL orders');
      }
    }

    // Risk management warnings
    if (sl && currentPrice) {
      const riskAmount = Math.abs(currentPrice - sl) * quantity;
      const riskPercentage = (riskAmount / 1000) * 100; // Assuming $1000 account

      if (riskPercentage > 2) {
        warnings.push(`High risk: ${riskPercentage.toFixed(1)}% of account equity`);
      }
      if (riskPercentage > 5) {
        errors.push('Risk too high: Maximum 5% per trade');
      }
    }

    // Reward/Risk ratio warning
    if (sl && tp && currentPrice) {
      const risk = Math.abs(currentPrice - sl);
      const reward = Math.abs(tp - currentPrice);
      const rrRatio = reward / risk;

      if (rrRatio < 1.5) {
        warnings.push(`Low R:R ratio: ${rrRatio.toFixed(1)}:1 (recommended: 2:1+)`);
      }
      if (rrRatio < 1) {
        warnings.push('Negative R:R ratio - potential losing trade');
      }
    }

    // Position size warnings
    const orderValue = quantity * (currentPrice || 0);
    if (orderValue > 500) { // Assuming $500 max position
      warnings.push(`Large position: $${orderValue.toFixed(2)} (consider reducing size)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [symbol, quantity, stopLoss, takeProfit, currentPrice]);

  // Handle trade button clicks
  const handleTradeClick = (side: 'buy' | 'sell') => {
    if (isBuying || isSelling) return; // Prevent double submissions

    const validation = validateTrade(side);
    if (!validation.isValid) {
      console.error('❌ Trade validation failed:', validation.errors);
      setLastTradeResult({
        success: false,
        message: `Validation failed: ${validation.errors.join(', ')}`
      });
      return;
    }

    // Calculate risk metrics
    const sl = stopLoss ? parseFloat(stopLoss) : null;
    const tp = takeProfit ? parseFloat(takeProfit) : null;
    const orderValue = quantity * (currentPrice || 0);
    const riskAmount = sl ? Math.abs((currentPrice || 0) - sl) * quantity : 0;
    const rewardAmount = tp ? Math.abs(tp - (currentPrice || 0)) * quantity : 0;
    const rrRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;

    // Create order payload
    const orderPayload = {
      symbol,
      side,
      quantity,
      currentPrice,
      orderValue,
      stopLoss: sl,
      takeProfit: tp,
      riskAmount,
      rewardAmount,
      rrRatio,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Trade Order Details:');
    console.log('- Input Values:', {
      symbol,
      side,
      quantity,
      stopLoss: sl,
      takeProfit: tp,
      currentPrice
    });
    console.log('- Calculated Risk:', {
      orderValue: `$${orderValue.toFixed(2)}`,
      riskAmount: `$${riskAmount.toFixed(2)}`,
      rewardAmount: `$${rewardAmount.toFixed(2)}`,
      rrRatio: `${rrRatio.toFixed(2)}:1`
    });
    console.log('- Final Order Payload:', orderPayload);

    if (showConfirmModal) {
      setPendingTrade({ side, payload: orderPayload });
      setShowConfirm(true);
    } else {
      executeTrade(orderPayload);
    }
  };

  // Execute confirmed trade
  const executeTrade = async (orderPayload: any) => {
    if (!user) {
      setLastTradeResult({ success: false, message: 'User not authenticated' });
      return;
    }

    const { side, symbol, quantity, stopLoss, takeProfit } = orderPayload;

    if (side === 'buy') {
      setIsBuying(true);
    } else {
      setIsSelling(true);
    }

    try {
      console.log('🚀 Executing trade:', orderPayload);

      // In production, this would send to backend
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // Simulate API response
      const mockResult = {
        trade: {
          id: Date.now(),
          symbol,
          trade_type: side,
          quantity,
          entry_price: orderPayload.currentPrice,
          stop_loss: stopLoss,
          take_profit: takeProfit,
          status: 'open'
        },
        challenge: {
          equity: 1000 - (orderPayload.riskAmount || 0) // Simulate equity reduction
        }
      };

      console.log('✅ Trade executed successfully:', mockResult);

      setLastTradeResult({
        success: true,
        message: `${side.toUpperCase()} order executed - ${quantity} ${symbol} @ $${orderPayload.currentPrice}`
      });

      onTradeExecuted?.();

      // Clear form on success
      setStopLoss('');
      setTakeProfit('');
      setStopLossPercent('');
      setTakeProfitPercent('');
      setQuantity(0.01);

      // Reset focus to quantity input
      setTimeout(() => {
        quantityInputRef.current?.focus();
      }, 100);

    } catch (error: any) {
      console.error('❌ Trade execution failed:', error);
      setLastTradeResult({
        success: false,
        message: error.message || `Failed to execute ${side.toUpperCase()} order`
      });
    } finally {
      setIsBuying(false);
      setIsSelling(false);
      setShowConfirm(false);
      setPendingTrade(null);
    }
  };

  // Confirm trade execution
  const confirmTrade = () => {
    if (pendingTrade) {
      executeTrade(pendingTrade.payload);
    }
  };

  // Cancel trade
  const cancelTrade = () => {
    setShowConfirm(false);
    setPendingTrade(null);
  };

  const validation = validateTrade('buy'); // Use buy validation for general checks

  const containerClasses = compact
    ? `bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-md ${className}`
    : `bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg ${className}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={containerClasses}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-cyan-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Quick Trade
            </h3>
          </div>

          {/* Current Price Display */}
          {currentPrice && (
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">Live Price</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                ${currentPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Quick Trade
          </h3>
        </div>

        {/* Current Price Display */}
        {currentPrice && (
          <div className="text-right">
            <div className="text-sm text-slate-500 dark:text-slate-400">Current Price</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              ${currentPrice.toFixed(2)}
            </div>
          </div>
        )}
      </div>


      {/* Symbol Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Symbol
        </label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
        >
          <option value="NVDA">NVDA - NVIDIA</option>
          <option value="AAPL">AAPL - Apple</option>
          <option value="GOOGL">GOOGL - Google</option>
          <option value="MSFT">MSFT - Microsoft</option>
          <option value="TSLA">TSLA - Tesla</option>
          <option value="AMZN">AMZN - Amazon</option>
          <option value="META">META - Meta</option>
        </select>
      </div>

      {/* Quantity Input with Risk-based Sizing */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Quantity
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setQuantity(Math.max(0.01, quantity - 0.01))}
              className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
              disabled={quantity <= 0.01}
            >
              -
            </button>
            <button
              onClick={() => setQuantity(quantity + 0.01)}
              className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              +
            </button>
          </div>
        </div>
        <input
          ref={quantityInputRef}
          type="number"
          value={quantity}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setQuantity(isNaN(val) ? 0 : Math.max(0, val));
          }}
          step="0.01"
          min="0.01"
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm"
          placeholder="0.01"
        />
        {currentPrice && (
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Order Value: ${(quantity * currentPrice).toFixed(2)}</span>
            <span>Risk: ${(Math.abs((stopLoss ? parseFloat(stopLoss) : currentPrice) - currentPrice) * quantity).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Percentage vs Price Toggle */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            SL/TP Mode
          </label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${!usePercentage ? 'text-cyan-600 font-medium' : 'text-slate-500'}`}>Price</span>
            <button
              onClick={() => setUsePercentage(!usePercentage)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                usePercentage ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  usePercentage ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs ${usePercentage ? 'text-cyan-600 font-medium' : 'text-slate-500'}`}>%</span>
          </div>
        </div>
      </div>

      {/* Percentage vs Price Toggle */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            SL/TP Mode
          </label>
          <div className="flex items-center space-x-2">
            <span className={`text-xs ${!usePercentage ? 'text-cyan-600 font-medium' : 'text-slate-500'}`}>Price</span>
            <button
              onClick={() => setUsePercentage(!usePercentage)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                usePercentage ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  usePercentage ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs ${usePercentage ? 'text-cyan-600 font-medium' : 'text-slate-500'}`}>%</span>
          </div>
        </div>
      </div>

      {/* Stop Loss & Take Profit */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Stop Loss {usePercentage ? '(%)' : '(Price)'}
          </label>
          {usePercentage ? (
            <div className="space-y-2">
              <input
                type="number"
                value={stopLossPercent}
                onChange={(e) => setStopLossPercent(e.target.value)}
                step="0.1"
                min="0.1"
                max="50"
                className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                placeholder="2.0"
              />
              {stopLossPercent && currentPrice && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Price: ${(currentPrice * (1 - parseFloat(stopLossPercent) / 100)).toFixed(2)}
                  (-${(currentPrice * parseFloat(stopLossPercent) / 100).toFixed(2)})
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                placeholder="Optional"
              />
              {stopLoss && currentPrice && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Risk: ${(Math.abs(currentPrice - parseFloat(stopLoss))).toFixed(2)}
                  ({((Math.abs(currentPrice - parseFloat(stopLoss)) / currentPrice) * 100).toFixed(1)}%)
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Take Profit {usePercentage ? '(%)' : '(Price)'}
          </label>
          {usePercentage ? (
            <div className="space-y-2">
              <input
                type="number"
                value={takeProfitPercent}
                onChange={(e) => setTakeProfitPercent(e.target.value)}
                step="0.1"
                min="0.1"
                max="100"
                className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="3.0"
              />
              {takeProfitPercent && currentPrice && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Price: ${(currentPrice * (1 + parseFloat(takeProfitPercent) / 100)).toFixed(2)}
                  (+${(currentPrice * parseFloat(takeProfitPercent) / 100).toFixed(2)})
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                placeholder="Optional"
              />
              {takeProfit && currentPrice && (
                <div className="text-xs text-green-600 dark:text-green-400">
                  Reward: ${(Math.abs(parseFloat(takeProfit) - currentPrice)).toFixed(2)}
                  ({((Math.abs(parseFloat(takeProfit) - currentPrice) / currentPrice) * 100).toFixed(1)}%)
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      <AnimatePresence>
        {validation.errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <div className="font-medium mb-1">Validation Errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {validation.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <div className="font-medium mb-1">Risk Warnings:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade Result Message */}
      <AnimatePresence>
        {lastTradeResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 p-3 rounded-lg border ${
              lastTradeResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {lastTradeResult.success ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{lastTradeResult.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Info */}
      {enableKeyboardShortcuts && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-xs text-blue-700 dark:text-blue-300 text-center">
            💡 Press <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">B</kbd> for BUY, <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">S</kbd> for SELL
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: validation.isValid ? 1.02 : 1 }}
          whileTap={{ scale: validation.isValid ? 0.98 : 1 }}
          onClick={() => handleTradeClick('buy')}
          disabled={!validation.isValid || isBuying || isSelling}
          className={`flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            validation.isValid && !isBuying
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isBuying ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <TrendingUp className="w-5 h-5 mr-2" />
          )}
          {isBuying ? 'Buying...' : 'BUY'}
        </motion.button>

        <motion.button
          whileHover={{ scale: validation.isValid ? 1.02 : 1 }}
          whileTap={{ scale: validation.isValid ? 0.98 : 1 }}
          onClick={() => handleTradeClick('sell')}
          disabled={!validation.isValid || isBuying || isSelling}
          className={`flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
            validation.isValid && !isSelling
              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSelling ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <TrendingDown className="w-5 h-5 mr-2" />
          )}
          {isSelling ? 'Selling...' : 'SELL'}
        </motion.button>
      </div>

      {/* Risk Summary */}
      {currentPrice && quantity > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Position Size:</span>
              <span>${(quantity * currentPrice).toFixed(2)}</span>
            </div>
            {stopLoss && (
              <div className="flex justify-between">
                <span>Risk Amount:</span>
                <span className="text-red-600">${Math.abs(currentPrice - parseFloat(stopLoss)).toFixed(2)}</span>
              </div>
            )}
            {takeProfit && (
              <div className="flex justify-between">
                <span>Reward Amount:</span>
                <span className="text-green-600">${Math.abs(parseFloat(takeProfit) - currentPrice).toFixed(2)}</span>
              </div>
            )}
            {stopLoss && takeProfit && (
              <div className="flex justify-between font-medium">
                <span>R:R Ratio:</span>
                <span className={(Math.abs(parseFloat(takeProfit) - currentPrice) / Math.abs(currentPrice - parseFloat(stopLoss))) >= 2 ? 'text-green-600' : 'text-yellow-600'}>
                  {(Math.abs(parseFloat(takeProfit) - currentPrice) / Math.abs(currentPrice - parseFloat(stopLoss))).toFixed(1)}:1
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
      {showConfirm && pendingTrade && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={cancelTrade}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Confirm {pendingTrade.side.toUpperCase()} Order
              </h3>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Symbol:</span>
                <span className="font-medium text-slate-900 dark:text-white">{pendingTrade.payload.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Side:</span>
                <span className={`font-medium ${pendingTrade.side === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                  {pendingTrade.side.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Quantity:</span>
                <span className="font-medium text-slate-900 dark:text-white">{pendingTrade.payload.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Entry Price:</span>
                <span className="font-medium text-slate-900 dark:text-white">${pendingTrade.payload.currentPrice.toFixed(2)}</span>
              </div>
              {pendingTrade.payload.stopLoss && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Stop Loss:</span>
                  <span className="font-medium text-red-600">${pendingTrade.payload.stopLoss.toFixed(2)}</span>
                </div>
              )}
              {pendingTrade.payload.takeProfit && (
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Take Profit:</span>
                  <span className="font-medium text-green-600">${pendingTrade.payload.takeProfit.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Order Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">${pendingTrade.payload.orderValue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={cancelTrade}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTrade}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  pendingTrade.side === 'buy'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Confirm {pendingTrade.side.toUpperCase()}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
);
}