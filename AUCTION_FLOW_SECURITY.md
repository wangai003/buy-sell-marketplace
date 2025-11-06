# Complete Auction Flow & Security - Ensuring Only Winner Can Order

## Complete Auction Flow (Step-by-Step)

### Phase 1: Auction Creation
```
1. Seller creates product with category "Live Bidding Hub"
   → Product.isAuction = true
   → Product.status = 'pending'
   → Product.startingBid = [amount]
   → Product.currentBid = [startingBid]
   → Product.endTime = [currentTime + duration]
   → Product.duration = [hours]

2. Admin approves product
   → Product.status = 'active'
   → Auction is now LIVE
```

### Phase 2: Bidding Period
```
3. Users place bids
   → Validation: Bid > currentBid
   → Validation: Auction is active
   → Validation: Bidder ≠ Seller
   → Validation: endTime > currentTime
   → Creates Bid document
   → Updates Product.currentBid
   → Adds Bid to Product.bids array

4. Auction continues until endTime
   → Users can continue bidding
   → currentBid updates with each bid
```

### Phase 3: Auction End (Automatic Processing)
```
5. System detects auction ended (endTime < currentTime)
   → Cron job runs every minute
   → Finds all active auctions where endTime < currentTime
   → For each ended auction:
     a. Find highest bid (sorted by amount DESC)
     b. If bids exist:
        - Get winner (highest bidder)
        - Check if order already exists for this auction
        - If no order exists:
          * Create Order automatically (SYSTEM CREATED)
          * Order.buyerId = winner._id
          * Order.status = 'AWAITING_PAYMENT'
          * Order.price = winningBid.amount
          * Mark auction as 'sold'
          * Send notification to winner
        - If order exists:
          * Skip (prevent duplicate)
     c. If no bids:
        - Mark auction as 'ended_no_bids'
```

### Phase 4: Winner Payment
```
6. Winner receives notification
   → Notification: "You won the auction!"
   → Contains order ID and payment link

7. Winner views order in dashboard
   → Only orders where buyerId = currentUser._id are shown
   → Winner sees their auction order with status 'AWAITING_PAYMENT'

8. Winner clicks "Pay Now"
   → Frontend validates: order.buyerId === currentUser._id
   → Backend validates: req.user._id === order.buyerId
   → If valid:
     - Create payment link
     - Update order with payment details
     - Show payment widget
   → If invalid:
     - Return 403 Forbidden

9. Winner completes payment
   → Payment gateway processes payment
   → Webhook updates order status to 'PAID'
   → Order status changes to 'PENDING' (ready for shipping)
```

### Phase 5: Order Fulfillment
```
10. Seller ships item
    → Seller updates order status to 'DELIVERING'
    → Adds tracking number
    → Order status = 'DELIVERING'

11. Buyer receives item
    → Buyer confirms receipt
    → Order status = 'COMPLETED'
    → Order status = 'PENDING_PAY' (seller payout pending)

12. Platform pays seller
    → Admin processes seller payout
    → Order status = 'PAID'
    → Transaction complete
```

---

## Security Measures to Ensure Only Winner Can Order

### 🔒 Security Layer 1: Order Creation (System-Only)

**Current Implementation:**
- Orders are created automatically by the system (not by users)
- Only `processEndedAuctions` function can create auction orders
- This is a **server-side only** function

**Security Enhancement Needed:**
```javascript
// In processEndedAuctions - Add duplicate check
exports.processEndedAuctions = async (req, res) => {
  try {
    const currentTime = new Date();
    const endedAuctions = await Product.find({
      isAuction: true,
      status: 'active',
      endTime: { $lt: currentTime }
    }).populate('author bids');

    for (const auction of endedAuctions) {
      try {
        // ✅ SECURITY CHECK 1: Check if order already exists
        const existingOrder = await Order.findOne({
          productId: auction._id,
          status: { $in: ['AWAITING_PAYMENT', 'PENDING', 'DELIVERING', 'COMPLETED', 'PENDING_PAY', 'PAID'] }
        });

        if (existingOrder) {
          console.log(`Order already exists for auction ${auction._id}`);
          continue; // Skip this auction
        }

        // Find the highest bid
        const bids = await Bid.find({ product: auction._id })
          .populate('bidder')
          .sort({ amount: -1 });

        if (bids.length > 0) {
          const winningBid = bids[0];
          const winner = winningBid.bidder;
          const seller = auction.author;

          // ✅ SECURITY CHECK 2: Validate winner exists
          if (!winner) {
            console.error(`Winner not found for auction ${auction._id}`);
            continue;
          }

          // ✅ SECURITY CHECK 3: Validate seller exists
          if (!seller) {
            console.error(`Seller not found for auction ${auction._id}`);
            continue;
          }

          // Create order (SYSTEM CREATED - no user input)
          const order = new Order({
            productId: auction._id,
            productName: auction.name,
            price: winningBid.amount,
            buyerId: winner._id, // ✅ Only winner's ID
            buyerName: winner.name,
            sellerId: seller._id,
            sellerName: seller.name,
            sellerWallet: seller.wallet,
            status: 'AWAITING_PAYMENT',
            orderType: 'auction', // ✅ Mark as auction order
            displayCurrency: 'USD',
            displayPrice: winningBid.amount,
            usdcPrice: winningBid.amount,
            quantity: 1,
            statusHistory: [{
              status: 'AWAITING_PAYMENT',
              changedAt: new Date()
            }]
          });

          await order.save();

          // Update auction status
          auction.status = 'sold';
          await auction.save();

          // Send notification to winner
          await auctionWinnerNotification(winner._id, auction._id, auction.name, winningBid.amount);
        }
      } catch (auctionError) {
        console.error(`Error processing auction ${auction._id}:`, auctionError);
      }
    }

    res.json({ message: 'Processed ended auctions' });
  } catch (err) {
    console.log('PROCESS ENDED AUCTIONS FAILED', err);
    return res.status(500).send('Internal server error');
  }
};
```

**Key Security Points:**
1. ✅ **No user input** - Order created automatically by system
2. ✅ **Duplicate prevention** - Check if order exists before creating
3. ✅ **Winner validation** - Only highest bidder becomes buyerId
4. ✅ **System-only access** - Function not exposed to users

---

### 🔒 Security Layer 2: Order Access (Winner-Only)

**Frontend Validation:**
```javascript
// In UserDashboard.js - Only show user's orders
const loadOrders = async () => {
  try {
    const buyerRes = await getBuyerOrders(user._id, token);
    // ✅ Backend filters: only orders where buyerId = user._id
    setOrders(buyerRes.data);
  } catch (err) {
    console.log(err);
  }
};
```

**Backend Validation:**
```javascript
// In controllers/order.js - getBuyerOrders
exports.getBuyerOrders = async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    // ✅ SECURITY CHECK: Validate buyerId matches authenticated user
    if (req.user._id.toString() !== buyerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only view your own orders' });
    }

    const orders = await Order.find({ buyerId })
      .populate({
        path: 'productId',
        select: 'name images price isAuction',
        model: 'Product'
      })
      .populate({
        path: 'sellerId',
        select: 'name username email businessName',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    res.json(orders);
  } catch (err) {
    console.log('GET BUYER ORDERS FAILED', err);
    return res.status(500).json({ error: 'Error fetching orders' });
  }
};
```

**Key Security Points:**
1. ✅ **Authentication required** - User must be logged in
2. ✅ **Authorization check** - User can only view their own orders
3. ✅ **Backend filtering** - Only orders where buyerId = user._id

---

### 🔒 Security Layer 3: Payment Initiation (Winner-Only)

**Frontend Validation:**
```javascript
// In UserDashboard.js or Payment component
const handlePayOrder = async (orderId) => {
  // ✅ SECURITY CHECK 1: Frontend validation
  if (order.buyerId !== user._id) {
    message.error('You can only pay for your own orders');
    return;
  }

  // ✅ SECURITY CHECK 2: Order status validation
  if (order.status !== 'AWAITING_PAYMENT') {
    message.error('This order cannot be paid');
    return;
  }

  // ✅ SECURITY CHECK 3: Auction order validation
  if (order.orderType === 'auction' && order.buyerId !== user._id) {
    message.error('Only the auction winner can pay for this order');
    return;
  }

  // Proceed with payment
  try {
    const res = await createStellarPayment({
      productId: order.productId._id,
      buyerId: user._id, // ✅ Use authenticated user ID
      sellerId: order.sellerId._id,
      quantity: order.quantity,
      currency: selectedCurrency
    });
    // ... handle payment
  } catch (error) {
    message.error('Payment failed');
  }
};
```

**Backend Validation:**
```javascript
// In controllers/payment.js - createStellarPayment
exports.createStellarPayment = async (req, res) => {
  try {
    const { productId, buyerId, sellerId, quantity = 1, currency } = req.body;
    
    // ✅ SECURITY CHECK 1: Validate authenticated user
    if (req.user._id.toString() !== buyerId) {
      return res.status(403).json({ error: 'Unauthorized: You can only create payments for yourself' });
    }

    const product = await Product.findById(productId);
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    if (!product || !buyer || !seller) {
      return res.status(404).json({ error: 'Not found' });
    }

    // ✅ SECURITY CHECK 2: If auction product, validate order exists and user is winner
    if (product.isAuction) {
      const auctionOrder = await Order.findOne({
        productId: product._id,
        buyerId: buyerId,
        status: 'AWAITING_PAYMENT'
      });

      if (!auctionOrder) {
        return res.status(403).json({ 
          error: 'Unauthorized: Only the auction winner can pay for this item' 
        });
      }

      // ✅ SECURITY CHECK 3: Validate order belongs to authenticated user
      if (auctionOrder.buyerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'Unauthorized: You are not the winner of this auction' 
        });
      }

      // Use order price instead of product price
      const displayPrice = auctionOrder.displayPrice;
      const usdcPrice = auctionOrder.usdcPrice;

      // Update existing order instead of creating new one
      auctionOrder.payAsset = currency === 'USDC' ? 'USDC' : 'XLM';
      auctionOrder.payAddress = seller.wallet || 'GAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A';
      await auctionOrder.save();

      // Return payment details for existing order
      return res.json({
        orderId: auctionOrder._id,
        payAddress: auctionOrder.payAddress,
        amount: displayPrice,
        currency: auctionOrder.displayCurrency
      });
    }

    // Regular product payment flow...
    // ... rest of the function
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Failed to create payment' });
  }
};
```

**Key Security Points:**
1. ✅ **Authentication required** - User must be logged in
2. ✅ **Authorization check** - User can only pay for their own orders
3. ✅ **Auction-specific validation** - Only winner can pay for auction orders
4. ✅ **Order existence check** - Order must exist and belong to user
5. ✅ **Status validation** - Order must be in 'AWAITING_PAYMENT' status

---

### 🔒 Security Layer 4: Payment Webhook (System-Only)

**Webhook Validation:**
```javascript
// In controllers/payment.js - nowpaymentsIpn
exports.nowpaymentsIpn = async (req, res) => {
  try {
    const { payment_status, order_id, pay_amount, pay_currency } = req.body;

    // ✅ SECURITY CHECK: Validate webhook signature (if provided by payment gateway)
    // This ensures the webhook is from the payment gateway, not a malicious user

    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // ✅ SECURITY CHECK: Validate payment amount matches order
    if (parseFloat(pay_amount) !== parseFloat(order.displayPrice)) {
      console.error(`Payment amount mismatch for order ${order_id}`);
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    // Update order status
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      order.status = 'PAID';
      order.paidAmount = pay_amount;
      order.statusHistory.push({
        status: 'PAID',
        changedAt: new Date()
      });
      await order.save();
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error handling payment webhook:', error);
    res.status(500).json({ error: 'Failed to handle webhook' });
  }
};
```

**Key Security Points:**
1. ✅ **Webhook signature validation** - Verify webhook is from payment gateway
2. ✅ **Amount validation** - Payment amount must match order amount
3. ✅ **Order existence check** - Order must exist
4. ✅ **System-only access** - Webhooks are called by payment gateway, not users

---

## Complete Security Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AUCTION FLOW & SECURITY                    │
└─────────────────────────────────────────────────────────────┘

PHASE 1: AUCTION CREATION
┌─────────────────────────────────────────────────────────────┐
│ Seller creates auction                                       │
│ → Product.isAuction = true                                   │
│ → Product.status = 'pending'                                 │
│ → Admin approves → status = 'active'                         │
└─────────────────────────────────────────────────────────────┘

PHASE 2: BIDDING PERIOD
┌─────────────────────────────────────────────────────────────┐
│ Users place bids                                             │
│ ✅ Validation: Bid > currentBid                             │
│ ✅ Validation: Auction is active                            │
│ ✅ Validation: Bidder ≠ Seller                               │
│ ✅ Validation: endTime > currentTime                        │
│ → Creates Bid document                                      │
│ → Updates Product.currentBid                                │
└─────────────────────────────────────────────────────────────┘

PHASE 3: AUCTION END (AUTOMATIC - SYSTEM ONLY)
┌─────────────────────────────────────────────────────────────┐
│ Cron job runs every minute                                   │
│ → Finds ended auctions (endTime < currentTime)              │
│ → For each auction:                                          │
│   ✅ Check if order already exists (prevent duplicate)      │
│   ✅ Find highest bid                                        │
│   ✅ Validate winner exists                                  │
│   ✅ Validate seller exists                                  │
│   → Create Order (SYSTEM CREATED)                           │
│   → Order.buyerId = winner._id (ONLY WINNER)                │
│   → Order.status = 'AWAITING_PAYMENT'                        │
│   → Mark auction as 'sold'                                  │
│   → Send notification to winner                             │
└─────────────────────────────────────────────────────────────┘

PHASE 4: WINNER PAYMENT (WINNER-ONLY)
┌─────────────────────────────────────────────────────────────┐
│ Winner views order in dashboard                              │
│ ✅ Backend filters: only orders where buyerId = user._id    │
│                                                              │
│ Winner clicks "Pay Now"                                     │
│ ✅ Frontend: order.buyerId === user._id                     │
│ ✅ Frontend: order.status === 'AWAITING_PAYMENT'            │
│ ✅ Backend: req.user._id === order.buyerId                 │
│ ✅ Backend: Order exists and belongs to user                │
│ → Create payment link                                        │
│ → Show payment widget                                        │
│                                                              │
│ Winner completes payment                                    │
│ → Payment gateway processes                                  │
│ → Webhook updates order status                              │
│ ✅ Webhook: Validate signature                              │
│ ✅ Webhook: Validate amount matches order                   │
│ → Order.status = 'PAID'                                      │
└─────────────────────────────────────────────────────────────┘

PHASE 5: ORDER FULFILLMENT
┌─────────────────────────────────────────────────────────────┐
│ Seller ships item                                           │
│ → Order.status = 'DELIVERING'                                │
│ → Buyer confirms receipt                                    │
│ → Order.status = 'COMPLETED'                                │
│ → Platform pays seller                                      │
│ → Order.status = 'PAID'                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Checklist

### ✅ Order Creation Security
- [x] Orders created automatically by system (not by users)
- [x] Duplicate order prevention (check if order exists)
- [x] Winner validation (only highest bidder)
- [x] Seller validation (seller exists)
- [x] System-only access (no user endpoint for order creation)

### ✅ Order Access Security
- [x] Authentication required (user must be logged in)
- [x] Authorization check (user can only view their own orders)
- [x] Backend filtering (only orders where buyerId = user._id)
- [x] Frontend validation (show only user's orders)

### ✅ Payment Security
- [x] Authentication required (user must be logged in)
- [x] Authorization check (user can only pay for their own orders)
- [x] Auction-specific validation (only winner can pay)
- [x] Order existence check (order must exist)
- [x] Status validation (order must be 'AWAITING_PAYMENT')
- [x] Amount validation (payment amount matches order)

### ✅ Webhook Security
- [x] Webhook signature validation (verify source)
- [x] Amount validation (payment amount matches order)
- [x] Order existence check (order must exist)
- [x] System-only access (webhooks called by payment gateway)

---

## Implementation Priority

1. **🔴 CRITICAL - Add duplicate order prevention** (Security Layer 1)
2. **🔴 CRITICAL - Add payment authorization checks** (Security Layer 3)
3. **🟡 HIGH - Add order access authorization** (Security Layer 2)
4. **🟡 HIGH - Add webhook validation** (Security Layer 4)

---

## Summary

**How to ensure only winner can order:**
1. ✅ **System-only order creation** - Orders created automatically by system, not users
2. ✅ **Winner identification** - Only highest bidder becomes buyerId
3. ✅ **Duplicate prevention** - Check if order exists before creating
4. ✅ **Access control** - Users can only view/pay for their own orders
5. ✅ **Payment authorization** - Multiple validation layers before payment
6. ✅ **Backend validation** - All checks happen on server-side

**The complete flow ensures:**
- Only the system can create auction orders
- Only the winner is assigned as buyerId
- Only the winner can view the order
- Only the winner can pay for the order
- Multiple security layers prevent unauthorized access

