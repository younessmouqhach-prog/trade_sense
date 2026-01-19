import { Plan, FaqItem, Stat, NavItem, EcosystemItem } from './types';
import { Shield, TrendingUp, Zap, Clock, Globe, Award, Bot, Newspaper, Users, GraduationCap, CheckCircle } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Programs', href: '#programs' },
  { label: 'Why Us', href: '#why-us' },
  { label: 'FAQ', href: '#faq' },
];

export const PLANS: Plan[] = [
  {
    id: 'starter',
    size: '$50,000',
    price: 99,
    profitTarget: '$5,000 (10%)',
    dailyLoss: '$2,500 (5%)',
    maxDrawdown: '$5,000 (10%)',
    split: '80%',
    leverage: '1:100',
  },
  {
    id: 'pro',
    size: '$100,000',
    price: 189,
    profitTarget: '$10,000 (10%)',
    dailyLoss: '$5,000 (5%)',
    maxDrawdown: '$10,000 (10%)',
    split: '85%',
    leverage: '1:100',
  },
  {
    id: 'elite',
    size: '$200,000',
    price: 369,
    profitTarget: '$20,000 (10%)',
    dailyLoss: '$10,000 (5%)',
    maxDrawdown: '$20,000 (10%)',
    split: '90%',
    leverage: '1:100',
  },
];

export const FAQS: FaqItem[] = [
  {
    question: "What markets can I trade?",
    answer: "You can trade all major forex pairs, commodities (Gold, Silver, Oil), indices (US30, NAS100, S&P500), and major cryptocurrencies on our platform."
  },
  {
    question: "How fast are payouts processed?",
    answer: "Payouts are processed within 24 hours of your request. First payout is eligible after 14 days of funded trading, then bi-weekly thereafter."
  },
  {
    question: "Is this simulated or live trading?",
    answer: "During the evaluation phase, you trade on a simulated account with real market data. Once funded, you are provided a live account backed by our liquidity providers."
  },
  {
    question: "Can I use Expert Advisors (EAs)?",
    answer: "Yes, we allow the use of EAs, algorithms, and trade copiers as long as they do not exploit platform latencies or engage in high-frequency arbitrage."
  },
  {
    question: "What happens if I breach a rule?",
    answer: "If a hard breach occurs (Daily Loss or Max Drawdown), the account is closed. However, we offer a discounted reset fee if you wish to try again."
  }
];

export const FEATURES = [
  {
    title: "All-in-One Platform",
    description: "A single interface for trading, learning, and community interaction.",
    icon: Zap
  },
  {
    title: "AI Signals & Risk Alerts",
    description: "Receive real-time buy/sell signals and immediate risk warnings.",
    icon: Bot
  },
  {
    title: "News + Social + MasterClass",
    description: "Integrated news hub, social network, and educational academy.",
    icon: Globe
  },
  {
    title: "For All Levels",
    description: "Tailored for both beginners and experienced professional traders.",
    icon: Award
  },
  {
    title: "Smarter Decisions",
    description: "Advanced tools designed to help you decide faster and trade better.",
    icon: TrendingUp
  }
];

export const ECOSYSTEM: EcosystemItem[] = [
  {
    title: "AI-Powered Assistance",
    description: "Direct connection to an advanced AI agency for instant, precise trading advice.",
    icon: Bot,
    color: "from-purple-500 to-indigo-500",
    features: [
      "Buy / Sell / Stop signals on chart",
      "Personalized AI Trade Plans",
      "Risk Detection Alerts",
      "Smart Sorting (Good vs Risky trades)",
      "Real-time execution assistance"
    ]
  },
  {
    title: "Live News Hub",
    description: "Stay ahead of the market with real-time intelligence and summaries.",
    icon: Newspaper,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Real-time financial news feed",
      "AI-generated market summaries",
      "Economic event alerts",
      "Impact analysis"
    ]
  },
  {
    title: "Community Zone",
    description: "A dedicated social space to grow your network and share knowledge.",
    icon: Users,
    color: "from-emerald-500 to-teal-500",
    features: [
      "Chat with friends & meet traders",
      "Share strategies & join groups",
      "Learn from experts",
      "Social trading features"
    ]
  },
  {
    title: "MasterClass Center",
    description: "Complete academy with high-quality courses and live workshops.",
    icon: GraduationCap,
    color: "from-orange-500 to-amber-500",
    features: [
      "Beginner to Advanced lessons",
      "Technical & Fundamental analysis",
      "Risk workshops & Live webinars",
      "AI-assisted learning paths & Quizzes"
    ]
  }
];

export const STATS: Stat[] = [
  { label: "Total Payouts", value: "$12M+", description: "Paid to traders globally" },
  { label: "Active Traders", value: "15,000+", description: "Trading daily" },
  { label: "Avg. Payout Time", value: "8 Hrs", description: "Industry leading speed" },
];