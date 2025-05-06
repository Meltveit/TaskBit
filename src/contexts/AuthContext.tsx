'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmail, 
  signInWithGoogle, 
  createUser, 
  logoutUser,
  type SignUpData,
  type SignInData
} from '@/lib/auth-service';
import { getUserSubscription } from '@/lib/stripe-service';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  subscription: SubscriptionData | null;
  isLoading: boolean;
  login: (data: SignInData) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  plan: string;
  stripeCustomerId?: string | null;
}

interface SubscriptionData {
  plan: string;
  status: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              plan: userDoc.data().plan || 'free',
              stripeCustomerId: userDoc.data().stripeCustomerId,
            });
          }
          
          // Get subscription data
          const sub = await getUserSubscription();
          setSubscription(sub);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
        setSubscription(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (data: SignInData) => {
    setIsLoading(true);
    try {
      await signInWithEmail(data);
      // Auth state change will trigger the effect above
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Auth state change will trigger the effect above
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (data: SignUpData) => {
    setIsLoading(true);
    try {
      await createUser(data);
      // Auth state change will trigger the effect above
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      // Auth state change will trigger the effect above
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          plan: userDoc.data().plan || 'free',
          stripeCustomerId: userDoc.data().stripeCustomerId,
        });
      }
      
      // Get subscription data
      const sub = await getUserSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value = {
    user,
    userData,
    subscription,
    isLoading,
    login,
    loginWithGoogle,
    signup,
    logout,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};