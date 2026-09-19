import React, { createContext, useContext, useState, useEffect } from 'react';
import { sfx } from '@/core/audio/sfx';
import { EmailService } from '@/core/auth/EmailService';
import { AvatarHelper } from '@/core/auth/AvatarHelper';
import { useToast } from '@/components/common/NotificationToast';

export type UserTier = 'free' | 'pro' | 'enterprise';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  tier: UserTier;
  savedWorkflowsCount: number;
  joinedDate: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signInWithGoogle: (customName?: string) => Promise<void>;
  signInWithEmail: (email: string, customName?: string) => Promise<void>;
  signOut: () => void;
  upgradeTier: (tier: UserTier) => void;
  completePayment: (tier: UserTier) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (open: boolean) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  pendingTier: UserTier | null;
  setPendingTier: (tier: UserTier | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('zeropdf_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingTier, setPendingTier] = useState<UserTier | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('zeropdf_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('zeropdf_user_session');
    }
  }, [user]);

  const signInWithGoogle = async (customName?: string) => {
    setIsLoading(true);
    sfx.playProcessing();

    const formattedName = AvatarHelper.formatName(customName || 'Sarthak');
    const smartAvatar = AvatarHelper.getSmartAvatar(formattedName);

    setTimeout(() => {
      const profile: UserProfile = {
        id: `usr_${Date.now()}`,
        email: `${formattedName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        name: formattedName,
        avatarUrl: smartAvatar,
        tier: 'free',
        savedWorkflowsCount: 3,
        joinedDate: 'September 2026',
      };
      setUser(profile);
      setIsLoading(false);
      setIsAuthModalOpen(false);
      sfx.playSuccess();

      showToast(`Welcome, ${formattedName}!`, 'Signed in successfully via Google OAuth.', 'success');

      if (pendingTier && pendingTier !== 'free') {
        setIsPaymentModalOpen(true);
      }
    }, 700);
  };

  const signInWithEmail = async (email: string, customName?: string) => {
    setIsLoading(true);
    sfx.playProcessing();

    const formattedName = AvatarHelper.formatName(customName || '', email);
    const smartAvatar = AvatarHelper.getSmartAvatar(formattedName);

    await EmailService.sendEmail({
      to: email,
      subject: 'ZEROPDF // Magic Sign-In Link',
      template: 'magic-link',
    });

    setTimeout(() => {
      const profile: UserProfile = {
        id: `usr_${Date.now()}`,
        email,
        name: formattedName,
        avatarUrl: smartAvatar,
        tier: 'free',
        savedWorkflowsCount: 1,
        joinedDate: 'September 2026',
      };
      setUser(profile);
      setIsLoading(false);
      setIsAuthModalOpen(false);
      sfx.playSuccess();

      showToast('Magic Link Dispatched!', `Welcome ${formattedName}. Confirmation sent to ${email}.`, 'email');

      if (pendingTier && pendingTier !== 'free') {
        setIsPaymentModalOpen(true);
      }
    }, 600);
  };

  const signOut = () => {
    sfx.playClick();
    setUser(null);
    setPendingTier(null);
    showToast('Signed Out', 'You are now in guest mode. 0 bytes retained in memory.', 'info');
  };

  const upgradeTier = (tier: UserTier) => {
    sfx.playClick();
    setPendingTier(tier);
    setIsPricingModalOpen(false);

    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      if (tier !== 'free') {
        setIsPaymentModalOpen(true);
      } else {
        setUser({ ...user, tier: 'free' });
        sfx.playSuccess();
      }
    }
  };

  const completePayment = async (tier: UserTier) => {
    if (user) {
      setUser({ ...user, tier });

      await EmailService.sendEmail({
        to: user.email,
        subject: `ZEROPDF // ${tier === 'pro' ? 'Pro Workstation' : 'Lifetime Founder'} Receipt`,
        template: 'license-activated',
        data: { tierName: tier === 'pro' ? 'Pro Workstation ($4.99/mo)' : 'Lifetime Founder ($49)' },
      });

      showToast(
        'License Activated!',
        `Your ${tier === 'pro' ? 'Pro ($4.99)' : 'Lifetime ($49)'} upgrade is live. Receipt sent to ${user.email}.`,
        'success'
      );
    }
    setIsPaymentModalOpen(false);
    setPendingTier(null);
    sfx.playSuccess();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
        upgradeTier,
        completePayment,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isPricingModalOpen,
        setIsPricingModalOpen,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        pendingTier,
        setPendingTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};