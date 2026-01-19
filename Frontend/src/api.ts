// API Service for TradeSense
const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface Challenge {
  id: number;
  name: string;
  tier: string;
  initial_balance: number;
  max_daily_loss_percent: number;
  max_total_drawdown_percent: number;
  profit_target_percent: number;
  price_mad: number;
  is_active: boolean;
}

export interface UserChallenge {
  id: number;
  user_id: number;
  challenge_id: number;
  status: string;
  initial_balance: number;
  current_balance: number;
  equity: number;
  profit_percent: number;
  drawdown_percent: number;
}

export interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  quantity: number;
  entry_price: number;
  pnl: number;
  status: string;
}

export interface Payment {
  id: number;
  amount_mad: number;
  payment_method: string;
  status: string;
}

// API utility functions
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add JWT token if available
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`,
    };
    console.log('API Request with token:', endpoint);
  } else {
    console.log('API Request without token:', endpoint);
  }

  const response = await fetch(url, {
    ...config,
    signal: AbortSignal.timeout(20000) // 20 second timeout to allow TradingView API time
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Authentication APIs
export const authAPI = {
  register: async (userData: { email: string; password: string; first_name: string; last_name: string }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
    }

    return response;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await apiRequest('/auth/me');
    return res.user;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await apiRequest('/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token);
    }

    return response;
  },
};

// Challenge APIs
export const challengeAPI = {
  getTemplates: async (): Promise<Challenge[]> => {
    const response = await apiRequest('/challenges/templates');
    return response.challenges || [];
  },

  getMyChallenges: async (): Promise<UserChallenge[]> => {
    return apiRequest('/challenges/my-challenges');
  },

  getActiveChallenge: async (): Promise<{ challenge: UserChallenge; risk_metrics: any }> => {
    return apiRequest('/challenges/active');
  },
};

// Payment APIs
export const paymentAPI = {
  processCMI: async (challengeId: number): Promise<{ payment: Payment; challenge: UserChallenge }> => {
    return apiRequest('/payments/process/cmi', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId }),
    });
  },

  processCrypto: async (challengeId: number): Promise<{ payment: Payment; challenge: UserChallenge }> => {
    return apiRequest('/payments/process/crypto', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId }),
    });
  },

  createPayPalOrder: async (challengeId: number): Promise<{ order_id: string; approval_url: string }> => {
    return apiRequest('/payments/paypal/create', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId }),
    });
  },

  capturePayPalOrder: async (orderId: string): Promise<any> => {
    return apiRequest('/payments/paypal/capture', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },
};

// Trade APIs
export const tradeAPI = {
  buy: async (symbol: string, quantity: number, stopLoss?: number, takeProfit?: number): Promise<{ trade: Trade; challenge: UserChallenge }> => {
    return apiRequest('/trades/buy', {
      method: 'POST',
      body: JSON.stringify({
        symbol,
        quantity,
        stop_loss: stopLoss,
        take_profit: takeProfit
      }),
    });
  },

  sell: async (tradeId: number): Promise<{ trade: Trade; challenge: UserChallenge }> => {
    return apiRequest('/trades/sell', {
      method: 'POST',
      body: JSON.stringify({ trade_id: tradeId }),
    });
  },

  getTrades: async (challengeId?: number): Promise<{ trades: Trade[] }> => {
    const query = challengeId ? `?challenge_id=${challengeId}` : '';
    return apiRequest(`/trades/${query}`);
  },
};

// Market Data APIs
export const marketAPI = {
  getPrice: async (symbol: string) => {
    return apiRequest(`/market/price/${symbol}`);
  },

  getPrices: async (symbols: string[]) => {
    return apiRequest('/market/prices', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
  },

  getPopularPrices: async () => {
    return apiRequest('/market/popular');
  },

  getForexPrices: async () => {
    return apiRequest('/market/forex');
  },

  getCryptoPrices: async () => {
    return apiRequest('/market/crypto');
  },

  getMoroccanPrices: async () => {
    return apiRequest('/market/morocco');
  },

  getSymbols: async (query?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return apiRequest(`/market/symbols${qs ? `?${qs}` : ''}`);
  },

  getPriceHistory: async (symbol: string, timeframe: string = '1d') => {
    return apiRequest(`/market/history/${symbol}?timeframe=${timeframe}`);
  },
};

// Leaderboard APIs
export const leaderboardAPI = {
  getLeaderboard: async () => {
    return apiRequest('/leaderboard/');
  },

  getAllTimeLeaderboard: async () => {
    return apiRequest('/leaderboard/all-time');
  },
};
