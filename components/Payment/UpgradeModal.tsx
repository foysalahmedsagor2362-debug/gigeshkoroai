import React, { useState } from 'react';
import { X, Check, Copy } from 'lucide-react';
import { Button } from '../UIComponents';
import { createPaymentRequest } from '../../services/backend';
import { User } from '../../types';

interface UpgradeModalProps {
  user: User;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ user, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<'1_month' | '3_months'>('1_month');
  const [trxId, setTrxId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const BKASH_NUMBER = "01878691105";

  const handleCopy = () => {
    navigator.clipboard.writeText(BKASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId) return;
    
    createPaymentRequest(user, selectedPlan, trxId);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Request Submitted</h2>
          <p className="text-slate-600 text-sm mb-6">
            Your payment is under review. You will receive Premium access once the Admin verifies your Transaction ID.
          </p>
          <Button onClick={onClose} className="w-full">Okay, Got it</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-slate-800 mb-1">Upgrade to Premium</h2>
        <p className="text-sm text-slate-500 mb-6">Unlock unlimited questions and AI power.</p>

        {/* Plan Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div 
            onClick={() => setSelectedPlan('1_month')}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${selectedPlan === '1_month' ? 'border-primary-500 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
          >
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">1 Month</div>
            <div className="text-2xl font-bold text-slate-800">৳20</div>
          </div>
          <div 
            onClick={() => setSelectedPlan('3_months')}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center relative ${selectedPlan === '3_months' ? 'border-primary-500 bg-primary-50' : 'border-slate-100 hover:border-slate-200'}`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">BEST VALUE</div>
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">3 Months</div>
            <div className="text-2xl font-bold text-slate-800">৳50</div>
          </div>
        </div>

        {/* Payment Instructions */}
        <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-pink-600 uppercase">Payment Method: bKash</span>
            <img src="https://freelogopng.com/images/all_img/1656234745bkash-app-logo-png.png" alt="bKash" className="h-5" />
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-slate-700">Personal Number:</p>
            <span className="text-[10px] font-bold bg-pink-600 text-white px-2 py-0.5 rounded-full shadow-sm animate-pulse">Send Money Only</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-pink-200 relative shadow-sm">
            <span className="font-mono font-bold text-slate-800 text-lg flex-1 ml-2 tracking-wide">{BKASH_NUMBER}</span>
            
            {copied && (
              <span className="text-[10px] font-bold text-green-600 mr-2 bg-green-50 px-2 py-1 rounded-md transition-all">
                Copied!
              </span>
            )}
            
            <button 
              onClick={handleCopy}
              className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-pink-50 text-pink-500 hover:bg-pink-100'}`} 
              title="Copy Number"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase">Enter Transaction ID</label>
          <input
            type="text"
            required
            value={trxId}
            onChange={(e) => setTrxId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-slate-800 text-sm font-mono mb-4"
            placeholder="e.g. 9H7D6F5G"
          />
          <Button className="w-full h-12">Submit Payment</Button>
        </form>
      </div>
    </div>
  );
};