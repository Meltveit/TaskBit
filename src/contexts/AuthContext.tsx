'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';
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
import { checkMigrationNeeded, migrateTimeEntriesToProjects } from '@/lib/db-models';

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
          
          // If user document doesn't exist, create it (might happen with external auth)
          if (!userDoc.exists()) {
            // Create user document with basic structure
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              plan: 'free', // Default plan
              stripeCustomerId: null
            });
            
            // Initialize collections for the user
            const collectionsToInitialize = [
              'projects',
              'invoices',
              'clients',
              'activityLog'
            ];
            
            const initPromises = collectionsToInitialize.map(collName => 
              setDoc(doc(db, 'users', user.uid, collName, '_metadata'), {
                initialized: true,
                createdAt: serverTimestamp()
              })
            );
            
            await Promise.all(initPromises);
            
            // Get the newly created user document
            const newUserDoc = await getDoc(doc(db, 'users', user.uid));
            if (newUserDoc.exists()) {
              setUserData({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                plan: 'free',
                stripeCustomerId: null,
              });
            }
          } else {
            // User document exists, get the data
            setUserData({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || userDoc.data().displayName,
              plan: userDoc.data().plan || 'free',
              stripeCustomerId: userDoc.data().stripeCustomerId,
            });
          }
          
          // Get subscription data
          const sub = await getUserSubscription();
          setSubscription(sub);
          
          // Check if migration is needed
          const migrationNeeded = await checkMigrationNeeded();
          if (migrationNeeded) {
            console.log('Migration needed, running migration...');
            try {
              // Create a migration activity log
              const activityLogCollection = collection(db, 'users', user.uid, 'activityLog');
              await setDoc(doc(activityLogCollection, `migration-start-${Date.now()}`), {
                type: 'system',
                action: 'migration',
                description: `Starting migration of time entries to project subcollections`,
                timestamp: serverTimestamp(),
                uid: user.uid
              });
              
              // Run migration
              const { success, migratedCount } = await migrateTimeEntriesToProjects();
              
              // Log migration result
              await setDoc(doc(activityLogCollection, `migration-complete-${Date.now()}`), {
                type: 'system',
                action: 'migration',
                description: `Completed migration of ${migratedCount} time entries to project subcollections`,
                timestamp: serverTimestamp(),
                uid: user.uid,
                success,
                migratedCount
              });
              
              console.log(`Migration ${success ? 'completed' : 'failed'}: migrated ${migratedCount} time entries`);
            } catch (migrationError) {
              console.error('Error running migration:', migrationError);
            }
          }
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