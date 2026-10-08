import React, { useState } from 'react';
import { User, Shield, Check, X, UserCheck, KeyRound } from 'lucide-react';
import { User as UserType } from '../../types';
import { DEFAULT_USERS, storage } from '../../services/storage';

interface LoginModalProps {
  currentUser: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: UserType) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onSelectUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200">
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Switch User Role</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-500">
            Select the active profile below to switch permissions. Cashiers have dedicated
            selling and product lookup permissions, while Administrators have full catalog and stock
            authority.
          </p>

          <div className="space-y-3">
            {DEFAULT_USERS.map((usr) => {
              const isSelected = currentUser.id === usr.id;

              return (
                <div
                  key={usr.id}
                  onClick={() => {
                    storage.setCurrentUser(usr);
                    onSelectUser(usr);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        usr.role === 'admin'
                          ? 'bg-neutral-900 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {usr.role === 'admin' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{usr.name}</h4>
                      <p className="text-xs text-neutral-500">
                        {usr.role === 'admin'
                          ? 'Full store access & inventory management'
                          : 'Point of sale, search products, complete sales'}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
