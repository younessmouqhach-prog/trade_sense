import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, Activity } from 'lucide-react';
import { apiRequest } from '../api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  traderName: string;
  profitPercent: number;
  totalPnl: number;
  tradeCount: number;
  initialBalance: number;
}

interface LeaderboardStats {
  activeTraders: number;
  totalTrades: number;
  averageTradesPerTrader: number;
  averageProfitPercent: number;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  period: {
    month: string;
    startDate: string;
    endDate: string;
  };
  updatedAt: string;
  formula?: string;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('');

  useEffect(() => {
    fetchLeaderboard();
    fetchStats();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response: LeaderboardResponse = await apiRequest('/leaderboard/monthly');
      if (response.success) {
        setLeaderboard(response.data);
        setPeriod(response.period.month);
      } else {
        setError('Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiRequest('/leaderboard/stats');
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-slate-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-lg';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mx-auto mb-8"></div>
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="text-center mb-20 mt-20">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Monthly Leaderboard
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            {period} - Top Traders by Profit Performance
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Traders</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.activeTraders}</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Trades</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTrades}</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Trades/User</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.averageTradesPerTrader}</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Profit %</span>
              </div>
              <div className={`text-2xl font-bold ${stats.averageProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.averageProfitPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Formula Explanation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Profit Calculation Formula</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Profit % = (Total PnL / Initial Balance) × 100</strong><br />
            Only includes traders with 3+ closed trades this month. Rankings are updated in real-time.
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden mx-3 sm:mx-0">
          <div className="px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Top 10 Traders</h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No traders qualified for this month's leaderboard yet.</p>
              <p className="text-sm">Complete at least 3 trades to appear on the leaderboard.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Trader
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Profit %
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Total PnL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                        Trades
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {leaderboard.map((entry, index) => (
                      <tr key={entry.userId} className={`hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10' : ''
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {entry.traderName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            entry.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.profitPercent >= 0 ? '+' : ''}{entry.profitPercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            entry.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${entry.totalPnl.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {entry.tradeCount} trades
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 px-4 pb-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`p-4 rounded-lg border transition-all ${
                      entry.rank <= 3
                        ? 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/20 dark:to-slate-800 border-yellow-200 dark:border-yellow-800 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(entry.rank)}`}>
                        {getRankIcon(entry.rank)}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {entry.tradeCount} trades
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <div className="text-base font-semibold text-slate-900 dark:text-white">
                        {entry.traderName}
                      </div>
                      <span className={`text-lg font-bold ${
                        entry.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.profitPercent >= 0 ? '+' : ''}{entry.profitPercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Total PnL: <span className={`font-medium ${
                        entry.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${entry.totalPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Leaderboard updates in real-time. Rankings are based on closed trades only.</p>
          <p className="mt-1">Minimum 3 trades required to qualify for ranking.</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;