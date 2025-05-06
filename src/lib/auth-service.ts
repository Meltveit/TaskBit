// src/lib/auth-service.ts
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider, 
    signInWithPopup,
    updateProfile,
    User,
    UserCredential
  } from 'firebase/auth';
  import { doc, setDoc, getDoc, serverTimestamp, collection } from 'firebase/firestore';
  import { auth, db } from './firebase';
  
  export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }
  
  export interface SignUpData {
    email: string;
    password: string;
    name: string;
  }
  
  export interface SignInData {
    email: string;
    password: string;
  }
  
  // Convert Firebase user to our AuthUser type
  const formatUser = (user: User): AuthUser => {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  };
  
  // Create a new user
  export const createUser = async (userData: SignUpData): Promise<AuthUser> => {
    const { email, password, name } = userData;
    
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with name
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user document in Firestore with proper structure
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        plan: 'free', // Default plan
        stripeCustomerId: null
      });
      
      // Initialize empty collections for the user
      const collectionsToInitialize = [
        'projects',
        'invoices',
        'clients',
        'activityLog'
      ];
      
      // Create a metadata document in each collection to initialize it
      const initPromises = collectionsToInitialize.map(collName => 
        setDoc(doc(db, 'users', user.uid, collName, '_metadata'), {
          initialized: true,
          createdAt: serverTimestamp()
        })
      );
      
      await Promise.all(initPromises);
      
      return formatUser(user);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };
  
  // Sign in with email and password
  export const signInWithEmail = async (credentials: SignInData): Promise<AuthUser> => {
    try {
      const { email, password } = credentials;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return formatUser(userCredential.user);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };
  
  // Sign in with Google
  export const signInWithGoogle = async (): Promise<AuthUser> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Check if the user document exists already
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      // If it doesn't exist, create a new user document
      if (!userDoc.exists()) {
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
        
        // Initialize collections for Google sign-in too
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
      }
      
      return formatUser(user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };
  
  // Sign out
  export const logoutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  // Get current user
  export const getCurrentUser = (): User | null => {
    return auth.currentUser;
  };