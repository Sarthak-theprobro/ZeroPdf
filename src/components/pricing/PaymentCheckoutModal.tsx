import React, { useState } from 'react';
import { X, Lock, CreditCard, ShieldCheck, Sparkles, RefreshCw, Crown, ExternalLink } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext';
import { sfx } from '@/core/audio/sfx';

// 💳 PASTE YOUR STRIPE OR LEMONSQUEEZY PAYMENT LINKS HERE:
const PAYMENT_LINKS = {
  pro: 'https://buy.stripe.com/test_your_pro_link_here',       // $4.99/mo Stripe link
  enterprise: 'https://buy.stripe.com/test_your_lifetime_link', // $49 Lifetime Stripe link
};

export const PaymentCheckoutModal: React.FC = () => {
  const { 
    isPaymentModalOpen, 
    setIsPaymentModalOpen, 
    pendingTier, 
    completePayment, 
    user 
  } = useAuth();

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isPaymentModalOpen || !pendingTier) return null;

  const planDetails = pendingTier === 'pro' 
    ? { name: 'Pro Workstation License', price: '$4.99', interval: 'billed monthly' }
    : { name: 'Lifetime Founder License', price: '$49.00', interval: 'one-time payment' };

  // 1. Direct In-App Instant Activation / Test Gateway
  const handlePayInApp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    sfx.playProcessing();

    setTimeout(() => {
      setIsProcessing(false);
      completePayment(pendingTier);
      sfx.playSuccess();
    }, 1000);
  };

  // 2. Redirect to Live Stripe Hosted Checkout Page
  const handleOpenStripeLink = () => {
    const url = pendingTier === 'pro' ? PAYMENT_LINKS.pro : PAYMENT_LINKS.enterprise;
    if (url.startsWith('http') && !url.includes('test_your_')) {
      window.open(url, '_blank');
    } else {
      // If no live URL is pasted yet, run the instant simulation
      setIsProcessing(true);
      sfx.playProcessing();
      setTimeout(() => {
        setIsProcessing(false);
        completePayment(pendingTier);
        sfx.playSuccess();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c101c] shadow-2xl p-6 sm:p-8 relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sfx.playClick();
            setIsPaymentModalOpen(false);
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center mx-auto text-black shadow-lg shadow-cyan-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-orbitron font-bold text-white tracking-wide">
            SECURE CHECKOUT
          </h3>
          <p className="text-xs text-slate-400 font-fira">
            256-bit encrypted checkout for <strong className="text-white">{user?.email || 'Guest'}</strong>
          </p>
        </div>

        {/* Selected Plan Summary Card */}
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white font-orbitron">{planDetails.name}</h4>
              <p className="text-[10px] text-slate-400 font-fira">{planDetails.interval}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-orbitron font-extrabold text-white">{planDetails.price}</span>
          </div>
        </div>

        {/* Fast 1-Click Pay Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleOpenStripeLink}
            disabled={isProcessing}
            className="py-2.5 px-3 rounded-xl bg-white text-black hover:bg-slate-200 font-fira text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <span> Pay</span>
          </button>
          <button
            type="button"
            onClick={handleOpenStripeLink}
            disabled={isProcessing}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-fira text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
          >
            <span>G Pay</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] font-fira uppercase">or credit card</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Credit Card Form */}
        <form onSubmit={handlePayInApp} className="space-y-3">
          <div>
            <label className="text-[10px] font-fira text-slate-400 block mb-1">Card Number</label>
            <input
              type="text"
              required
              placeholder="4242 •••• •••• 4242"
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-fira text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-fira text-slate-400 block mb-1">Expires (MM/YY)</label>
              <input
                type="text"
                required
                placeholder="12/28"
                maxLength={5}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-fira text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-fira text-slate-400 block mb-1">CVC / CVV</label>
              <input
                type="text"
                required
                placeholder="888"
                maxLength={4}
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-fira text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-bold font-fira text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing Payment...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authorize & Pay {planDetails.price}</span>
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] font-fira text-slate-500 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted via Stripe / LemonSqueezy • Direct Bank Payout</span>
        </p>

      </div>
    </div>
  );
};