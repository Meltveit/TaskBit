import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Define pricing plan IDs that are configured in Stripe
export const STRIPE_PRICES = {
  FREE: 'free_tier', // This would just be a flag, not an actual Stripe price ID
  BASIC: 'price_1RLk7LAKwUwbzhYB8rlYGEwt', // Replace with your actual Stripe price ID
  PRO: 'price_1RLk8lAKwUwbzhYB8bDpKdQE', // Replace with your actual Stripe price ID
};

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface StripePortalResponse {
  url: string;
}

// Create a checkout session to start subscription process
export const createCheckoutSession = async (priceId: string): Promise<StripeCheckoutResponse> => {
  try {
    // Make sure user is logged in
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to subscribe');
    }

    // Call Firebase function to create Stripe checkout session
    const createCheckoutSessionFn = httpsCallable<{ priceId: string }, { sessionId: string, url: string }>(
      functions, 
      'createCheckoutSession'
    );

    const result = await createCheckoutSessionFn({ priceId });
    return result.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Create Stripe customer portal session for managing subscriptions
export const createCustomerPortalSession = async (): Promise<StripePortalResponse> => {
  try {
    // Make sure user is logged in
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to access customer portal');
    }

    // Call Firebase function to create Stripe customer portal session
    const createPortalSessionFn = httpsCallable<{}, { url: string }>(
      functions, 
      'createPortalSession'
    );

    const result = await createPortalSessionFn({});
    return result.data;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
};

// Create payment intent for invoice payment
export const createInvoicePayment = async (invoiceId: string): Promise<{ clientSecret: string }> => {
  try {
    // Make sure user is logged in
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to process payment');
    }

    // Call Firebase function to create payment intent for invoice
    const createInvoicePaymentFn = httpsCallable<{ invoiceId: string }, { clientSecret: string }>(
      functions, 
      'createInvoicePayment'
    );

    const result = await createInvoicePaymentFn({ invoiceId });
    return result.data;
  } catch (error) {
    console.error('Error creating invoice payment:', error);
    throw error;
  }
};

// Get current user's subscription data
export const getUserSubscription = async (): Promise<{
  plan: string;
  status: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
} | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to get subscription data');
    }

    // Get user document
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    const plan = userData.plan || 'free';
    
    // If there's no specific subscription data, return basic info
    if (plan === 'free') {
      return {
        plan: 'free',
        status: 'active',
      };
    }

    // Get the active subscription if one exists
    const subscriptionsQuery = await getDoc(doc(db, 'users', user.uid, 'membership', 'subscription'));
    
    if (!subscriptionsQuery.exists()) {
      return {
        plan,
        status: 'unknown',
      };
    }

    const subscription = subscriptionsQuery.data();
    
    return {
      plan: subscription.plan || 'free',
      status: subscription.status || 'unknown',
      paymentMethod: subscription.paymentMethod,
      startDate: subscription.startDate?.toDate?.().toISOString(),
      endDate: subscription.endDate?.toDate?.().toISOString(),
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw error;
  }
};

// Create a payment link for an invoice
export const createInvoicePaymentLink = async (invoiceId: string): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be logged in to create a payment link');
    }

    const createInvoicePaymentLinkFn = httpsCallable<{ invoiceId: string }, { url: string }>(
      functions, 
      'createInvoicePaymentLink'
    );

    const result = await createInvoicePaymentLinkFn({ invoiceId });
    
    // Update the invoice with the payment link
    const invoiceRef = doc(db, 'users', user.uid, 'invoices', invoiceId);
    await updateDoc(invoiceRef, {
      stripePaymentLinkId: result.data.url,
      updatedAt: new Date().toISOString()
    });

    return result.data.url;
  } catch (error) {
    console.error('Error creating invoice payment link:', error);
    throw error;
  }
};