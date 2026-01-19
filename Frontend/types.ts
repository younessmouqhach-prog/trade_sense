export interface Plan {
  id: string;
  size: string;
  price: number;
  profitTarget: string;
  dailyLoss: string;
  maxDrawdown: string;
  split: string;
  leverage: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Stat {
  label: string;
  value: string;
  description: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface EcosystemItem {
  title: string;
  description: string;
  icon: any;
  features: string[];
  color: string;
}