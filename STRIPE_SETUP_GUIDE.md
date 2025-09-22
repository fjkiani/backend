# 🚀 Stripe SaaS Billing Setup Guide

## 📋 Prerequisites

1. **Stripe Account**: Sign up at [stripe.com](https://stripe.com) (use test mode for development)
2. **Supabase Project**: Your database with SaaS user management schema
3. **Node.js Environment**: Backend server ready

## 🔧 Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
- Go to [dashboard.stripe.com](https://dashboard.stripe.com)
- Sign up and complete onboarding
- Enable test mode for development

### 1.2 Get API Keys
```
Dashboard → Developers → API Keys

Copy these keys:
- Publishable Key: pk_test_...
- Secret Key: sk_test_...
```

### 1.3 Create Products & Prices

#### Free Tier (No Stripe Price Needed)
- This is the default tier in your app

#### Pro Tier ($99/month)
```
Dashboard → Products → Create Product

Product Name: Pro Tier
Price: $99.00/month
Billing: Recurring
Add features (optional):
- 500 AI queries/month
- Advanced AI analysis
- Full calendar access
- Custom dashboards
- Email support
```

#### Enterprise Tier ($199/month)
```
Dashboard → Products → Create Product

Product Name: Enterprise Tier
Price: $199.00/month
Billing: Recurring
Add features (optional):
- Unlimited AI queries
- API access
- Team collaboration
- Priority support
- Custom integrations
```

### 1.4 Get Price IDs
```
After creating prices:
Dashboard → Products → [Your Product] → Pricing

Copy the Price ID for each tier:
- Pro Price ID: price_1ABC123...
- Enterprise Price ID: price_1DEF456...
```

### 1.5 Set Up Webhooks
```
Dashboard → Developers → Webhooks → Add Endpoint

Endpoint URL: https://your-domain.com/api/subscription/webhook
Events to listen for:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- checkout.session.completed

Copy the Webhook Signing Secret: whsec_...
```

## 🛠️ Step 2: Environment Configuration

Add these variables to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id

# Existing Supabase config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_KEY=your-supabase-service-key
```

## 🏗️ Step 3: Database Setup

Your SaaS schema should already include these tables:

- ✅ `user_profiles` - User accounts with subscription tiers
- ✅ `user_usage` - Usage tracking and billing events
- ✅ `user_usage_summary` - Monthly usage summaries

## 🚀 Step 4: Test the Integration

### 4.1 Start Your Backend
```bash
cd backend
npm run dev
```

### 4.2 Test Subscription Creation
```bash
# This will create a test checkout session
curl -X POST http://localhost:3001/api/subscription/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "pro",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel"
  }'
```

### 4.3 Test Webhook (Optional)
```bash
# Use Stripe CLI for local webhook testing
stripe listen --forward-to localhost:3001/api/subscription/webhook
```

## 💳 Subscription Flow

### For Users:
1. **Sign Up/Login** → User account created
2. **Click "Upgrade"** → Stripe checkout session created
3. **Complete Payment** → Stripe processes payment
4. **Webhook Fired** → Your backend updates user profile
5. **User Redirected** → Back to app with Pro/Enterprise features

### For Admins:
1. **View Dashboard** → See all subscriptions and usage
2. **Handle Refunds** → Process refunds via Stripe
3. **Monitor Webhooks** → Track subscription events
4. **Analytics** → View revenue and usage metrics

## 🐛 Troubleshooting

### Common Issues:

#### "Stripe secret key not configured"
- Check your `.env` file has `STRIPE_SECRET_KEY=sk_test_...`

#### "Invalid tier or missing price ID"
- Verify your `STRIPE_PRO_PRICE_ID` and `STRIPE_ENTERPRISE_PRICE_ID` are correct

#### "Webhook signature verification failed"
- Ensure your webhook endpoint uses `express.raw()` middleware
- Check your `STRIPE_WEBHOOK_SECRET` is correct

#### "User already has an active subscription"
- Users can only have one active subscription at a time
- They must cancel current subscription before creating a new one

## 📊 Billing Analytics

Your backend provides these endpoints for analytics:

```bash
# Get user's subscription details
GET /api/subscription/details

# Get billing history
GET /api/subscription/history

# Get subscription tiers info
GET /api/subscription/tiers
```

## 🎯 Next Steps

1. **Test End-to-End Flow**: Sign up → Upgrade → Pay → Webhook → Features Unlocked
2. **Customer Portal**: Set up Stripe Customer Portal for self-service
3. **Email Notifications**: Add welcome emails and payment confirmations
4. **Analytics Dashboard**: Build admin dashboard for subscription metrics
5. **Failed Payment Recovery**: Implement dunning management

---

## 📞 Support

If you encounter issues:
1. Check Stripe dashboard logs
2. Verify webhook delivery
3. Test API endpoints with curl/Postman
4. Check backend logs for errors

**Your SaaS billing system is now ready! 🎉**

---

*This guide was generated for the Market Intelligence SaaS platform. Customize as needed for your specific implementation.*

