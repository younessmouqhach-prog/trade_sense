import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, TrendingUp, Filter, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  source: string;
  published_at: string;
  image_url?: string;
  symbols: string[];
  category: string;
  impact_level: 'normal' | 'medium' | 'high';
  is_breaking: boolean;
  tags: string[];
}

interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  symbol?: string;
  category?: string;
  cached: boolean;
  timestamp: string;
  user_authenticated: boolean;
  fallback?: boolean;
}

const NewsHub: React.FC = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbolFilter, setSymbolFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  const fetchNews = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const params = new URLSearchParams();
      if (symbolFilter) params.append('symbol', symbolFilter);
      if (categoryFilter) params.append('category', categoryFilter);

      const response = await fetch(`/api/news?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data: NewsResponse = await response.json();

      setNews(data.articles);
      setLastUpdated(new Date(data.timestamp));

      if (data.fallback) {
        setError('Using cached news data - NewsAPI unavailable');
      }

    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbolFilter, categoryFilter]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [symbolFilter, categoryFilter]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'crypto': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'business': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'technology': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'forex': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'macro': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'earnings': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const commonSymbols = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'EUR', name: 'Euro' },
    { symbol: 'USD', name: 'US Dollar' },
  ];

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'technology', label: 'Technology' },
    { value: 'forex', label: 'Forex' },
    { value: 'macro', label: 'Macro' },
    { value: 'earnings', label: 'Earnings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 pt-24 md:pt-28">
      <div className="p-4 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-cyan-400/20 to-blue-500/20 dark:from-cyan-600/10 dark:to-blue-700/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-gradient-to-r from-emerald-400/15 to-teal-500/15 dark:from-emerald-600/8 dark:to-teal-700/8 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-center gap-3">
              <Newspaper className="w-10 h-10 text-cyan-500" />
              News Hub
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-4">
              Stay informed with real-time financial news and market insights
            </p>

            {/* Last updated */}
            {lastUpdated && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
                <button
                  onClick={() => fetchNews(true)}
                  disabled={refreshing}
                  className="ml-2 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                  title="Refresh news"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Symbol Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Asset/Symbol
                </label>
                <select
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                >
                  <option value="">All Assets</option>
                  {commonSymbols.map((symbol) => (
                    <option key={symbol.symbol} value={symbol.symbol}>
                      {symbol.symbol} - {symbol.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(symbolFilter || categoryFilter) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {symbolFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 rounded-full text-sm">
                    {symbolFilter}
                    <button
                      onClick={() => setSymbolFilter('')}
                      className="ml-1 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 rounded-full text-sm">
                    {categories.find(c => c.value === categoryFilter)?.label}
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="ml-1 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 dark:text-yellow-200">{error}</span>
              </div>
            </motion.div>
          )}

          {/* News Articles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {loading && !refreshing ? (
              // Skeleton Loading
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
                    <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              news.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-[#0B1121]/80 border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Breaking News Badge */}
                  {article.is_breaking && (
                    <div className="flex items-center gap-1 mb-3">
                      <Zap className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wide">
                        Breaking News
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                    {article.summary}
                  </p>

                  {/* Image */}
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Impact Level */}
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(article.impact_level)}`}>
                      <TrendingUp className="w-3 h-3" />
                      {article.impact_level}
                    </span>

                    {/* Category */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>

                    {/* Symbols */}
                    {article.symbols.slice(0, 2).map((symbol) => (
                      <span key={symbol} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
                        {symbol}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(article.published_at)}</span>
                    </div>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-cyan-500 hover:text-cyan-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Read More
                    </a>
                  </div>
                </motion.article>
              ))
            )}
          </div>

          {/* No Results */}
          {!loading && news.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Newspaper className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No news articles found
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your filters or check back later for new articles.
              </p>
            </motion.div>
          )}

          {/* Load More (if needed) */}
          {!loading && news.length > 0 && news.length >= 20 && (
            <div className="text-center">
              <button className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors">
                Load More Articles
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsHub;