// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Use environment variables managed by Firebase Functions config
const stripeSecretKey = functions.config().stripe?.secret_key;
if (!stripeSecretKey) {
  console.error("FATAL ERROR: Stripe secret key is not configured. Run 'firebase functions:config:set stripe.secret_key=\"YOUR_STRIPE_SECRET_KEY\"'");
}
const stripe = require("stripe")(stripeSecretKey);

admin.initializeApp();

// Create Stripe Checkout Session
// Creates a Stripe Checkout session for a user to subscribe to a plan.
// Requires authentication and a priceId (e.g., price_xyz).
exports.createCheckoutSession = functions.region("us-central1").https.onCall(async (data, context) => {
  if (!stripeSecretKey) throw new functions.https.HttpsError("internal", "Stripe is not configured.");
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");

  const { priceId, successUrl, cancelUrl } = data; // Get URLs from the client call
  if (!priceId || !successUrl || !cancelUrl) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required parameters: priceId, successUrl, cancelUrl.");
  }

  const userRef = admin.firestore().collection("users").doc(context.auth.uid);
  const userDoc = await userRef.get();
  let customerId = userDoc.data()?.stripeCustomerId;

  // Create a Stripe customer if one doesn't exist
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
        metadata: { firebaseUID: context.auth.uid },
        name: context.auth.token.name || null, // Add user name if available
      });
      customerId = customer.id;
      await userRef.update({ stripeCustomerId: customerId });
      console.log(`Created Stripe customer ${customerId} for user ${context.auth.uid}`);
    } catch (error) {
      console.error("Error creating Stripe customer:", error);
      throw new functions.https.HttpsError("internal", "Could not create Stripe customer.");
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      // Allow promotion codes
      allow_promotion_codes: true,
      // Optionally collect billing address if needed
      // billing_address_collection: 'required',
       metadata: {
         firebaseUID: context.auth.uid, // Include Firebase UID for linking in webhook
       },
    });
    console.log(`Created Checkout Session ${session.id} for user ${context.auth.uid}`);
    return { sessionId: session.id };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new functions.https.HttpsError("internal", "Could not create checkout session.");
  }
});

// Handle Stripe Webhooks
// Listens for events from Stripe (e.g., subscription created, invoice paid).
// Requires webhook secret configured in Firebase environment variables.
// Example: firebase functions:config:set stripe.webhook_secret="whsec_..."
const webhookSecret = functions.config().stripe?.webhook_secret;

exports.stripeWebhook = functions.region("us-central1").https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured. Run 'firebase functions:config:set stripe.webhook_secret=\"YOUR_STRIPE_WEBHOOK_SECRET\"'");
    return res.status(500).send("Webhook configuration error.");
  }
   if (!stripeSecretKey) {
     console.error("Stripe secret key is not configured for webhook processing.");
     return res.status(500).send("Webhook configuration error.");
   }

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = admin.firestore();
  const data = event.data.object;

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = data;
        const subscriptionId = session.subscription;
        const customerId = session.customer;
        const firebaseUID = session.metadata?.firebaseUID; // Get UID from session metadata

        if (!subscriptionId || !customerId || !firebaseUID) {
          console.error(`Missing data in checkout.session.completed: sub=${subscriptionId}, cust=${customerId}, uid=${firebaseUID}`);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userRef = db.collection("users").doc(firebaseUID);

        // Ensure consistent price metadata access
        const priceData = subscription.items.data[0]?.price;
        const plan = priceData?.metadata?.planId || priceData?.lookup_key || 'unknown'; // Use planId, fallback to lookup_key

        console.log(`Updating user ${firebaseUID} with plan ${plan} and subscription ${subscriptionId}`);

        await userRef.collection("subscriptions").doc(subscriptionId).set({
          subscriptionId: subscription.id,
          planId: priceData?.id || 'unknown', // Store price ID
          plan: plan,
          status: subscription.status,
          current_period_start: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
          current_period_end: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
          cancel_at_period_end: subscription.cancel_at_period_end,
          // Storing minimal payment info might be useful, but be cautious
          // paymentMethodDetails: subscription.default_payment_method ? { type: 'card', last4: '****' } : null, // Placeholder
        }, { merge: true });

        // Update top-level user plan and custom claims
        await userRef.update({
           plan: plan,
           stripeSubscriptionId: subscriptionId, // Store active subscription ID
           stripeSubscriptionStatus: subscription.status
         });
        await admin.auth().setCustomUserClaims(firebaseUID, { stripeRole: plan, subscriptionStatus: subscription.status });

        console.log(`User ${firebaseUID} subscription ${subscriptionId} updated.`);
        break;

      case "invoice.paid":
         const invoice = data;
         const customerIdPaid = invoice.customer;
         const userPaidQuery = await db.collection("users").where("stripeCustomerId", "==", customerIdPaid).limit(1).get();
         const userPaidDoc = userPaidQuery.docs[0];

         if (userPaidDoc) {
             const userIdPaid = userPaidDoc.id;
             await db.collection("users").doc(userIdPaid).collection("invoices").doc(invoice.id).set({
                 amount: invoice.amount_paid / 100, // Store amount in dollars
                 status: invoice.status,
                 created: admin.firestore.Timestamp.fromDate(new Date(invoice.created * 1000)),
                 pdfUrl: invoice.hosted_invoice_url,
                 subscriptionId: invoice.subscription,
             }, { merge: true });
             console.log(`Invoice ${invoice.id} recorded for user ${userIdPaid}`);
         } else {
             console.log(`User not found for Stripe customer ID: ${customerIdPaid} (invoice.paid)`);
         }
         break;


      case 'invoice.payment_succeeded':
        // Similar to invoice.paid, but can also occur for first payment of a subscription
        const paymentSucceededInvoice = data;
        const customerSucceededId = paymentSucceededInvoice.customer;
        const userSucceededQuery = await db.collection("users").where("stripeCustomerId", "==", customerSucceededId).limit(1).get();
        const userSucceededDoc = userSucceededQuery.docs[0];

        if (userSucceededDoc) {
            const userIdSucceeded = userSucceededDoc.id;
            const subscriptionIdSucceeded = paymentSucceededInvoice.subscription;

            if (subscriptionIdSucceeded) {
                // Update subscription status if needed (e.g., from trialing to active)
                const subscriptionSucceeded = await stripe.subscriptions.retrieve(subscriptionIdSucceeded);
                await db.collection("users").doc(userIdSucceeded).collection("subscriptions").doc(subscriptionIdSucceeded).update({
                    status: subscriptionSucceeded.status
                });
                 await userSucceededDoc.ref.update({ stripeSubscriptionStatus: subscriptionSucceeded.status });
                 await admin.auth().setCustomUserClaims(userIdSucceeded, { subscriptionStatus: subscriptionSucceeded.status });
                 console.log(`Subscription ${subscriptionIdSucceeded} status updated to ${subscriptionSucceeded.status} for user ${userIdSucceeded}`);
            }
        } else {
             console.log(`User not found for Stripe customer ID: ${customerSucceededId} (invoice.payment_succeeded)`);
        }
        break;

      case "invoice.payment_failed":
         const failedInvoice = data;
         const customerFailedId = failedInvoice.customer;
         const subscriptionIdFailed = failedInvoice.subscription;
         const userFailedQuery = await db.collection("users").where("stripeCustomerId", "==", customerFailedId).limit(1).get();
         const userFailedDoc = userFailedQuery.docs[0];

         if (userFailedDoc && subscriptionIdFailed) {
             const userIdFailed = userFailedDoc.id;
             // Update subscription status in Firestore
             await db.collection("users").doc(userIdFailed).collection("subscriptions").doc(subscriptionIdFailed).update({
                 status: "past_due", // Or based on Stripe subscription status if available
             });
              // Update top-level status for easier access
             await userFailedDoc.ref.update({ stripeSubscriptionStatus: "past_due" });
             // Optionally update custom claims if access should change immediately
             await admin.auth().setCustomUserClaims(userIdFailed, { subscriptionStatus: "past_due" });
             console.log(`Subscription ${subscriptionIdFailed} marked as past_due for user ${userIdFailed}`);
             // TODO: Trigger email notification to user about payment failure
         } else {
             console.log(`User or subscription not found for Stripe customer ID: ${customerFailedId} (invoice.payment_failed)`);
         }
         break;

       case 'customer.subscription.updated':
         const updatedSubscription = data;
         const customerUpdatedId = updatedSubscription.customer;
         const userUpdatedQuery = await db.collection("users").where("stripeCustomerId", "==", customerUpdatedId).limit(1).get();
         const userUpdatedDoc = userUpdatedQuery.docs[0];

         if (userUpdatedDoc) {
             const userIdUpdated = userUpdatedDoc.id;
             const priceDataUpdated = updatedSubscription.items.data[0]?.price;
             const planUpdated = priceDataUpdated?.metadata?.planId || priceDataUpdated?.lookup_key || 'unknown';

             await db.collection("users").doc(userIdUpdated).collection("subscriptions").doc(updatedSubscription.id).set({
                 // Update relevant fields from updatedSubscription object
                 planId: priceDataUpdated?.id || 'unknown',
                 plan: planUpdated,
                 status: updatedSubscription.status,
                 current_period_start: admin.firestore.Timestamp.fromDate(new Date(updatedSubscription.current_period_start * 1000)),
                 current_period_end: admin.firestore.Timestamp.fromDate(new Date(updatedSubscription.current_period_end * 1000)),
                 cancel_at_period_end: updatedSubscription.cancel_at_period_end,
             }, { merge: true });

             await userUpdatedDoc.ref.update({
                 plan: planUpdated,
                 stripeSubscriptionStatus: updatedSubscription.status
             });
             await admin.auth().setCustomUserClaims(userIdUpdated, { stripeRole: planUpdated, subscriptionStatus: updatedSubscription.status });
             console.log(`Subscription ${updatedSubscription.id} updated for user ${userIdUpdated}. Status: ${updatedSubscription.status}, Plan: ${planUpdated}`);
         } else {
             console.log(`User not found for Stripe customer ID: ${customerUpdatedId} (customer.subscription.updated)`);
         }
         break;


      case 'customer.subscription.deleted':
        const deletedSubscription = data;
        const customerDeletedId = deletedSubscription.customer;
        const userDeletedQuery = await db.collection("users").where("stripeCustomerId", "==", customerDeletedId).limit(1).get();
        const userDeletedDoc = userDeletedQuery.docs[0];

        if (userDeletedDoc) {
            const userIdDeleted = userDeletedDoc.id;
            await db.collection("users").doc(userIdDeleted).collection("subscriptions").doc(deletedSubscription.id).update({
                status: 'canceled', // Mark as canceled
            });
             await userDeletedDoc.ref.update({
                 plan: 'free', // Revert to free plan
                 stripeSubscriptionId: null,
                 stripeSubscriptionStatus: 'canceled'
             });
            await admin.auth().setCustomUserClaims(userIdDeleted, { stripeRole: 'free', subscriptionStatus: 'canceled' });
            console.log(`Subscription ${deletedSubscription.id} canceled for user ${userIdDeleted}.`);
        } else {
            console.log(`User not found for Stripe customer ID: ${customerDeletedId} (customer.subscription.deleted)`);
        }
        break;

      // Add other relevant events like customer.subscription.updated, deleted, etc.

      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
      console.error(`Webhook handler error for event ${event.type}:`, error);
      // Don't send 500, Stripe might retry unnecessarily. Log it instead.
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send("Webhook received successfully.");
});

// Create Stripe Customer Portal Session
// Generates a URL for the user to manage their subscription in Stripe Billing Portal.
// Requires authentication.
exports.createPortalSession = functions.region("us-central1").https.onCall(async (data, context) => {
  if (!stripeSecretKey) throw new functions.https.HttpsError("internal", "Stripe is not configured.");
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");

  const { returnUrl } = data; // Get return URL from client
  if (!returnUrl) {
      throw new functions.https.HttpsError("invalid-argument", "Missing required parameter: returnUrl.");
  }

  const userRef = admin.firestore().collection("users").doc(context.auth.uid);
  const userDoc = await userRef.get();
  const customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    console.error(`No Stripe customer ID found for user ${context.auth.uid}`);
    throw new functions.https.HttpsError("not-found", "No billing account found for this user.");
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    console.log(`Created Portal Session for user ${context.auth.uid}`);
    return { url: session.url };
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw new functions.https.HttpsError("internal", "Could not create billing portal session.");
  }
});


// -------------- Product Sync (Admin/Manual Trigger) --------------

// Sync Stripe Products and Prices to Firestore
// Manually triggerable function (or run on schedule) to keep Firestore products/prices in sync with Stripe.
exports.syncStripeProducts = functions.region("us-central1").https.onRequest(async (req, res) => {
  if (!stripeSecretKey) {
     console.error("Stripe is not configured for product sync.");
     return res.status(500).send("Configuration error.");
   }
  // Optional: Add authentication/authorization check if needed
  // if (!isAdmin(req)) return res.status(403).send("Unauthorized");

  console.log("Starting Stripe product sync...");
  const db = admin.firestore();
  const productsCollection = db.collection("products");

  try {
    const products = await stripe.products.list({ active: true, limit: 100 }); // Adjust limit if needed
    let syncedProducts = 0;
    let syncedPrices = 0;

    for (const product of products.data) {
      const productRef = productsCollection.doc(product.id);
      await productRef.set({
        active: product.active,
        name: product.name,
        description: product.description,
        // Add other relevant product fields if needed (e.g., images, metadata)
      }, { merge: true });
      syncedProducts++;
      console.log(`Synced product: ${product.name} (${product.id})`);

      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      const pricesCollection = productRef.collection("prices");

      for (const price of prices.data) {
        await pricesCollection.doc(price.id).set({
          active: price.active,
          unit_amount: price.unit_amount, // Store amount in cents
          currency: price.currency,
          type: price.type, // 'recurring' or 'one_time'
          recurring: price.recurring ? { // Store recurring details if they exist
             interval: price.recurring.interval,
             interval_count: price.recurring.interval_count,
          } : null,
          metadata: price.metadata || {}, // Store price metadata (e.g., planId)
        }, { merge: true });
        syncedPrices++;
        console.log(`  Synced price: ${price.id} (${price.unit_amount} ${price.currency})`);
      }
    }
    const message = `Stripe product sync completed. Synced ${syncedProducts} products and ${syncedPrices} prices.`;
    console.log(message);
    res.status(200).send(message);
  } catch (error) {
    console.error("Error syncing Stripe products:", error);
    res.status(500).send("Error syncing products.");
  }
});
