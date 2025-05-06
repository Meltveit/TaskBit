const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();

// Create Stripe Checkout Session for subscription
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }
  
  const { priceId } = data;
  const userId = context.auth.uid;
  
  // Get or create Stripe customer
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  let customerId = userDoc.data()?.stripeCustomerId;
  
  if (!customerId) {
    // Create new customer
    const customer = await stripe.customers.create({
      email: context.auth.token.email,
      metadata: { firebaseUID: userId },
    });
    
    customerId = customer.id;
    
    // Update user with Stripe customer ID
    await admin.firestore().collection("users").doc(userId).update({ 
      stripeCustomerId: customerId 
    });
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.FRONTEND_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/settings`,
  });
  
  return { 
    sessionId: session.id,
    url: session.url 
  };
});

// Create Stripe Customer Portal Session for managing subscriptions
exports.createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }
  
  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(userId).get();
  const customerId = userDoc.data()?.stripeCustomerId;
  
  if (!customerId) {
    throw new functions.https.HttpsError("not-found", "No Stripe customer ID found.");
  }
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/settings`,
  });
  
  return { url: session.url };
});

// Create payment intent for invoice payment
exports.createInvoicePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }
  
  const { invoiceId } = data;
  const userId = context.auth.uid;
  
  // Get the invoice
  const invoiceDoc = await admin.firestore().collection("users").doc(userId).collection("invoices").doc(invoiceId).get();
  
  if (!invoiceDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Invoice not found.");
  }
  
  const invoice = invoiceDoc.data();
  
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(invoice.totalAmount * 100), // Convert to cents
    currency: "usd",
    description: `Payment for Invoice ${invoice.invoiceNumber}`,
    metadata: {
      invoiceId,
      userId,
      invoiceNumber: invoice.invoiceNumber
    }
  });
  
  return { clientSecret: paymentIntent.client_secret };
});

// Create payment link for invoice (easier option for clients)
exports.createInvoicePaymentLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }
  
  const { invoiceId } = data;
  const userId = context.auth.uid;
  
  // Get the invoice
  const invoiceDoc = await admin.firestore().collection("users").doc(userId).collection("invoices").doc(invoiceId).get();
  
  if (!invoiceDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Invoice not found.");
  }
  
  const invoice = invoiceDoc.data();
  
  // Create a payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Invoice ${invoice.invoiceNumber}`,
            description: `Payment for services from ${invoice.clientName}`
          },
          unit_amount: Math.round(invoice.totalAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoiceId,
      userId,
      invoiceNumber: invoice.invoiceNumber
    },
    after_completion: {
      type: 'redirect',
      redirect: {
        url: `${process.env.FRONTEND_URL}/invoices/${invoiceId}?success=true`,
      },
    },
  });
  
  return { url: paymentLink.url };
});

// Stripe Webhook handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  const db = admin.firestore();
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      
      // If this is a subscription, set up subscription data
      if (session.mode === 'subscription') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const customerId = session.customer;
        
        // Find the user with this Stripe customer ID
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
        
        if (snapshot.empty) {
          console.log('No matching user found for Stripe customer:', customerId);
          break;
        }
        
        // There should only be one user with this customer ID
        const userDoc = snapshot.docs[0];
        const userId = userDoc.id;
        
        // Get plan info from price metadata or default to plan name
        const plan = subscription.items.data[0].price.metadata.plan || 'basic';
        
        // Save subscription info to user's membership subcollection
        await db.collection('users').doc(userId).collection('membership').doc('subscription').set({
          subscriptionId: subscription.id,
          plan,
          status: subscription.status,
          currentPeriodStart: admin.firestore.Timestamp.fromMillis(subscription.current_period_start * 1000),
          currentPeriodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_period_end * 1000),
          paymentMethod: subscription.default_payment_method,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update user's plan in main user document
        await db.collection('users').doc(userId).update({ 
          plan, 
          updatedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        
        // Set custom claims for authorization
        await admin.auth().setCustomUserClaims(userId, { 
          stripeRole: plan 
        });
      }
      break;
    }
      
    case 'invoice.paid': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      
      // Find the user with this Stripe customer ID
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
      
      if (snapshot.empty) {
        console.log('No matching user found for Stripe customer:', customerId);
        break;
      }
      
      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      
      // Record the payment in invoices collection
      if (invoice.billing_reason === 'subscription') {
        // This is a subscription invoice
        await db.collection('users').doc(userId).collection('invoices').doc(invoice.id).set({
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid / 100, // Convert from cents to dollars
          status: 'paid',
          description: `Subscription Payment - ${invoice.lines.data[0]?.description || 'TaskBit subscription'}`,
          pdfUrl: invoice.hosted_invoice_url,
          createdAt: admin.firestore.Timestamp.fromMillis(invoice.created * 1000),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      break;
    }
      
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const { invoiceId, userId } = paymentIntent.metadata;
      
      if (invoiceId && userId) {
        // Update the invoice status to paid
        await db.collection('users').doc(userId).collection('invoices').doc(invoiceId).update({
          status: 'paid',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          stripePaymentIntentId: paymentIntent.id
        });
        
        // Add payment record to activity log
        await db.collection('users').doc(userId).collection('activityLog').add({
          type: 'invoice',
          action: 'updated',
          description: `Invoice marked as paid`,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            invoiceId,
            paymentIntentId: paymentIntent.id
          }
        });
      }
      break;
    }
      
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      
      // Find the user with this Stripe customer ID
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
      
      if (snapshot.empty) {
        console.log('No matching user found for Stripe customer:', customerId);
        break;
      }
      
      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      
      // Update subscription status
      if (invoice.billing_reason === 'subscription') {
        await db.collection('users').doc(userId).collection('membership').doc('subscription').update({
          status: 'past_due',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      break;
    }
      
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Find the user with this Stripe customer ID
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('stripeCustomerId', '==', customerId).get();
      
      if (snapshot.empty) {
        console.log('No matching user found for Stripe customer:', customerId);
        break;
      }
      
      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      
      // Update subscription status and user plan
      await db.collection('users').doc(userId).collection('membership').doc('subscription').update({
        status: 'canceled',
        endedAt: admin.firestore.Timestamp.fromMillis(subscription.ended_at * 1000),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await db.collection('users').doc(userId).update({ 
        plan: 'free',
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      
      // Update custom claims
      await admin.auth().setCustomUserClaims(userId, { 
        stripeRole: 'free' 
      });
      break;
    }
  }
  
  res.status(200).send({ received: true });
});