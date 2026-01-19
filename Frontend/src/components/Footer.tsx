import React from 'react';
import { TrendingUp, Twitter, Instagram, Linkedin, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-white/10 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <a 
              href="/"
              className="flex items-center space-x-2 mb-4 group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20"
                style={{ background: 'linear-gradient(to right, #06b6d4, #10b981)' }}
              >
                <TrendingUp className="text-white w-5 h-5" />
              </div>
              <span
                className="text-xl font-bold tracking-tight text-transparent bg-clip-text"
                style={{
                  background: 'linear-gradient(to right, #06b6d4, #10b981)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                TradeSense
              </span>
            </a>
            <p className="text-slate-500 dark:text-gray-500 text-sm leading-relaxed mb-6">
              Empowering retail traders with capital, technology, and transparency. Join the elite.
            </p>
            <div className="flex space-x-4">
              <Twitter className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-white cursor-pointer transition-colors" />
              <Instagram className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-white cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-white cursor-pointer transition-colors" />
              <Facebook className="w-5 h-5 text-slate-400 dark:text-gray-500 hover:text-cyan-500 dark:hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Evaluation</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Instant Funding</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Scaling Plan</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Support</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Rules</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Risk Disclosure</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-white/5 pt-8 text-center md:text-left">
          <p className="text-xs text-slate-500 dark:text-gray-600 leading-relaxed">
            <strong className="text-slate-600 dark:text-gray-500">Risk Disclosure:</strong> Trading in financial markets involves a high degree of risk and may not be suitable for all investors. You could lose some or all of your initial investment. The information on this website is for educational purposes only and should not be construed as investment advice. TradeSense is a proprietary trading firm; we do not provide broker services. All trading activities occur in a simulated environment.
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-600 mt-4">
            &copy; {new Date().getFullYear()} TradeSense Global Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
