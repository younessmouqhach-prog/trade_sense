import React from 'react';
import { QuickTradeBox } from './QuickTradeBox';

/**
 * Example integration of QuickTradeBox in TradeSense dashboard
 *
 * This shows how the QuickTradeBox integrates with:
 * - Current market prices from chart/market data
 * - Risk management and position sizing
 * - Order execution and feedback
 */
export const QuickTradeExample: React.FC = () => {
  // Example state (in real app, this comes from chart/market data)
  const [currentSymbol, setCurrentSymbol] = React.useState('NVDA');
  const [currentPrice, setCurrentPrice] = React.useState(186.23);

  const handleTradeExecuted = () => {
    console.log('Trade executed - refresh positions and balances');
    // In real app: loadDashboardData() or refreshPositions()
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Example Chart Area */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {currentSymbol} Chart
          </h2>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            ${currentPrice.toFixed(2)}
          </div>
        </div>

        {/* Mock Chart Area */}
        <div className="h-64 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center">
          <div className="text-slate-500 dark:text-slate-400 text-center">
            <div className="text-4xl mb-2">📊</div>
            <div>TradingView Chart</div>
            <div className="text-sm">Current: ${currentPrice.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Chart and Quick Trade Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Price Chart - {currentSymbol}
          </h3>
          <div className="h-80 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-slate-500 dark:text-slate-400">Chart Component Here</span>
          </div>
        </div>

        {/* Quick Trade Box */}
        <div>
          <QuickTradeBox
            symbol={currentSymbol}
            currentPrice={currentPrice}
            onTradeExecuted={handleTradeExecuted}
            compact={false}
            showConfirmModal={true}
            enableKeyboardShortcuts={true}
          />
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          QuickTradeBox Integration Guide
        </h3>

        <div className="space-y-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium mb-2">Props:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>symbol</code> - Current trading symbol</li>
              <li><code>currentPrice</code> - Live market price</li>
              <li><code>onTradeExecuted</code> - Callback after successful trade</li>
              <li><code>compact</code> - Smaller layout for sidebars</li>
              <li><code>showConfirmModal</code> - Enable trade confirmation dialog</li>
              <li><code>enableKeyboardShortcuts</code> - Enable B/S keyboard shortcuts</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Features:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Real-time price integration</li>
              <li>Percentage or price-based SL/TP</li>
              <li>Risk-based position sizing</li>
              <li>Comprehensive validation</li>
              <li>Keyboard shortcuts (B/S)</li>
              <li>Mobile-responsive design</li>
              <li>Professional prop-firm styling</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Risk Logic:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>BUY orders:</strong> SL &lt; Entry &lt; TP</li>
              <li><strong>SELL orders:</strong> TP &lt; Entry &lt; SL</li>
              <li><strong>Risk limits:</strong> Max 5% account risk per trade</li>
              <li><strong>R:R warnings:</strong> Alerts for ratios &lt; 1.5:1</li>
              <li><strong>Position size:</strong> Calculated based on risk tolerance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};