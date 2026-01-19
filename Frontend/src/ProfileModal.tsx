import React from 'react';
import { X, User, Mail, ShieldCheck, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-[66] p-4"
          >
            <div className="w-full max-w-md bg-white dark:bg-[#0B1121] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-cyan-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                        {user.full_name.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-lg">{user.full_name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">ID: {user.id}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3">
                        <Mail className="w-4 h-4 text-cyan-500" />
                        <div className="text-slate-900 dark:text-white">{user.email}</div>
                      </div>
                      <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <div className="text-slate-900 dark:text-white">Role: {user.role}</div>
                      </div>
                      <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg p-3">
                        <BadgeCheck className="w-4 h-4 text-emerald-500" />
                        <div className="text-slate-900 dark:text-white">Active: {user.is_active ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-600 dark:text-slate-400 text-center">
                    No user information available. Please sign in.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
