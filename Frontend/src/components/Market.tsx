import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Search, X, Loader2, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, DollarSign, Coins, Globe } from 'lucide-react';
import { marketAPI } from '../api';
import { motion } from 'framer-motion';

interface MarketProps {
  onClose: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

interface StockData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  change_percent: number;
  timestamp?: string;
  source: string;
}

type MarketTab = 'stocks' | 'forex' | 'crypto' | 'morocco';

export const Market: React.FC<MarketProps> = ({ onClose, isDark, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<MarketTab>('stocks');
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [forex, setForex] = useState<StockData[]>([]);
  const [crypto, setCrypto] = useState<StockData[]>([]);
  const [morocco, setMorocco] = useState<StockData[]>([]);
  
  const [loading, setLoading] = useState<{ [key in MarketTab]: boolean }>({
    stocks: true,
    forex: false,
    crypto: false,
    morocco: false
  });
  const [error, setError] = useState<{ [key in MarketTab]: string | null }>({
    stocks: null,
    forex: null,
    crypto: null,
    morocco: null
  });
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<StockData | null>(null);

  const loadMarketData = useCallback(async (tab: MarketTab) => {
    setLoading(prev => ({ ...prev, [tab]: true }));
    setError(prev => ({ ...prev, [tab]: null }));
    
    try {
      let res;
      let items: StockData[] = [];
      
      switch (tab) {
        case 'stocks':
          res = await marketAPI.getPopularPrices();
          break;
        case 'forex':
          res = await marketAPI.getForexPrices();
          break;
        case 'crypto':
          res = await marketAPI.getCryptoPrices();
          break;
        case 'morocco':
          res = await marketAPI.getMoroccanPrices();
          break;
      }
      
      const prices = res.prices || {};
      
      // Convert prices object to array
      items = Object.entries(prices).map(([symbol, data]: [string, any]) => ({
        symbol: symbol,
        name: data.name || symbol,
        price: Number(data.price) || 0,
        change: Number(data.change) || 0,
        change_percent: Number(data.change_percent) || 0,
        timestamp: data.timestamp,
        source: data.source || 'csv'
      }));
      
      // Update state based on tab
      switch (tab) {
        case 'stocks':
          setStocks(items);
          break;
        case 'forex':
          setForex(items);
          break;
        case 'crypto':
          setCrypto(items);
          break;
        case 'morocco':
          setMorocco(items);
          break;
      }
      
      if (items.length === 0) {
        setError(prev => ({ ...prev, [tab]: `No ${tab} data available. The CSV file may be empty or still being populated.` }));
      }
    } catch (e: any) {
      console.error(`[Market] Error loading ${tab}:`, e);
      setError(prev => ({ ...prev, [tab]: `Failed to load ${tab} data: ${e.message || 'Unknown error'}` }));
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, []);

  useEffect(() => {
    // Load stocks on mount
    loadMarketData('stocks');
  }, [loadMarketData]);

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab !== 'stocks' && !loading[activeTab] && (activeTab === 'forex' ? forex.length === 0 : activeTab === 'crypto' ? crypto.length === 0 : morocco.length === 0)) {
      loadMarketData(activeTab);
    }
  }, [activeTab, loadMarketData]);

  // Get current market data based on active tab
  const getCurrentMarketData = (): StockData[] => {
    switch (activeTab) {
      case 'stocks': return stocks;
      case 'forex': return forex;
      case 'crypto': return crypto;
      case 'morocco': return morocco;
      default: return [];
    }
  };

  const currentData = getCurrentMarketData();
  const isLoading = loading[activeTab];
  const currentError = error[activeTab];

  // Filter by search term
  const filteredData = currentData.filter(item => 
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleItemClick = (item: StockData) => {
    setSelectedItem(item);
  };

  const getTabLabel = (tab: MarketTab): string => {
    switch (tab) {
      case 'stocks': return `Stocks (${stocks.length})`;
      case 'forex': return `Forex (${forex.length})`;
      case 'crypto': return `Crypto (${crypto.length})`;
      case 'morocco': return `Morocco (${morocco.length})`;
    }
  };

  const getTabIcon = (tab: MarketTab) => {
    switch (tab) {
      case 'stocks': return <Activity className="w-4 h-4" />;
      case 'forex': return <DollarSign className="w-4 h-4" />;
      case 'crypto': return <Coins className="w-4 h-4" />;
      case 'morocco': return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-24 md:pt-28">
      <div className="p-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Activity className="w-7 h-7 text-cyan-500" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Market Data</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Data from CSV files (refreshed every minute via BVCscrap)
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleTheme} 
                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                {isDark ? 'Light' : 'Dark'}
              </button>
              <button 
                onClick={onClose} 
                className="flex items-center space-x-2 bg-slate-900 dark:bg-white/10 text-white px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Market Tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {(['stocks', 'forex', 'crypto', 'morocco'] as MarketTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedItem(null);
                  setSearchTerm('');
                }}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-cyan-600 text-white shadow-lg'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {getTabIcon(tab)}
                <span>{getTabLabel(tab)}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder={`Search ${activeTab} by symbol or name...`}
                />
              </div>
              <button
                onClick={() => loadMarketData(activeTab)}
                disabled={isLoading}
                className="px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {currentError && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-800 dark:text-red-300 text-sm">{currentError}</div>
              </div>
            )}

            {/* Selected Item Details */}
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg"
              >
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Symbol</div>
                  <div className="text-slate-900 dark:text-white font-bold text-lg">{selectedItem.symbol}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Price</div>
                  <div className="text-slate-900 dark:text-white font-bold text-lg">
                    {activeTab === 'forex' || activeTab === 'crypto' ? '' : '$'}{selectedItem.price.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Change</div>
                  <div className={`font-bold text-lg ${selectedItem.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedItem.change >= 0 ? '+' : ''}{selectedItem.change.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400 text-xs mb-1">Change %</div>
                  <div className={`font-bold text-lg flex items-center ${selectedItem.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedItem.change_percent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {selectedItem.change_percent >= 0 ? '+' : ''}{selectedItem.change_percent.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Market Data Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                {getTabIcon(activeTab)}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} ({filteredData.length})
                </h2>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mr-3" />
                <span className="text-slate-600 dark:text-slate-400">Loading {activeTab} data from CSV...</span>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <div className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchTerm ? `No ${activeTab} found matching "${searchTerm}"` : `No ${activeTab} data available`}
                </div>
                {!searchTerm && (
                  <button
                    onClick={() => loadMarketData(activeTab)}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                  >
                    Refresh
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredData.map((item) => (
                  <motion.button
                    key={item.symbol}
                    onClick={() => handleItemClick(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-slate-100 dark:bg-slate-800 border-2 rounded-lg p-4 text-left transition-all ${
                      selectedItem?.symbol === item.symbol
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-slate-200 dark:border-white/10 hover:border-cyan-300 dark:hover:border-cyan-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-slate-900 dark:text-white font-bold text-lg">{item.symbol}</div>
                      {item.change_percent >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    {item.name && item.name !== item.symbol && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{item.name}</div>
                    )}
                    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                      {activeTab === 'forex' || activeTab === 'crypto' ? '' : '$'}{item.price.toFixed(2)}
                    </div>
                    <div className={`text-sm font-semibold ${item.change_percent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {item.change_percent >= 0 ? '+' : ''}{item.change_percent.toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      Source: {item.source}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
