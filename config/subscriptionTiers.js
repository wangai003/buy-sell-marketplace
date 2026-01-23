// Subscription Tier Configuration
// Merchant Subscription Plans for Azix Fusion

const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'FREE',
    displayName: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    features: {
      connectionsPerMonth: 0, // No matched client connections
      advertisingDaysPerMonth: 0,
      creativeRequestsPerMonth: 0,
      hasPerformanceInsights: false,
      hasPrioritySupport: false,
      badge: null,
    },
    description: 'Best for: First-time sellers, informal traders, testing demand.',
    whatYouGet: [
      'Merchant storefront',
      'Limited product/service listings',
      'Order reception & fulfillment',
      'Wallet settlement',
      'Organic marketplace visibility',
      'Basic sales count',
    ],
    whatsLocked: [
      'No matched client connections',
      'No advertising placements',
      'No creative support',
      'No performance insights',
    ],
  },
  STARTER: {
    name: 'STARTER',
    displayName: 'Starter',
    monthlyPrice: 7,
    yearlyPrice: 67, // $84 with 20% discount
    yearlyOriginalPrice: 84,
    yearlyDiscount: 20,
    features: {
      connectionsPerMonth: 25,
      advertisingDaysPerMonth: 7,
      creativeRequestsPerMonth: 1,
      hasPerformanceInsights: false,
      hasPrioritySupport: false,
      badge: 'Starter Seller',
    },
    description: 'Best for: Micro-SMEs ready to convert interest into sales.',
    whatYouUnlock: [
      '25 matched potential clients per month',
      'Banner placement in relevant categories (7 days/month)',
      '1 creative request per month',
      'Starter Seller badge',
      'Light algorithm boost',
    ],
  },
  BUSINESS: {
    name: 'BUSINESS',
    displayName: 'Business',
    monthlyPrice: 20,
    yearlyPrice: 192, // $240 with 20% discount
    yearlyOriginalPrice: 240,
    yearlyDiscount: 20,
    features: {
      connectionsPerMonth: 120,
      advertisingDaysPerMonth: 20,
      creativeRequestsPerMonth: 4,
      hasPerformanceInsights: true,
      hasPrioritySupport: true,
      badge: 'Verified Business Seller',
    },
    description: 'Best for: Established SMEs, distributors, exporters.',
    whatYouUnlock: [
      '120 matched potential clients per month',
      'Banner placement across multiple categories (20 days/month)',
      '4 creative requests per month',
      'Product performance trends',
      'Buyer location summary',
      'Conversion overview',
      'Verified Business Seller badge',
      'Priority dispute handling',
      'Faster support response',
    ],
  },
  CUSTOM: {
    name: 'CUSTOM',
    displayName: 'Custom',
    monthlyPrice: null, // Custom pricing
    yearlyPrice: null,
    yearlyDiscount: 0,
    features: {
      connectionsPerMonth: -1, // -1 means unlimited or custom
      advertisingDaysPerMonth: -1, // -1 means unlimited or custom
      creativeRequestsPerMonth: 20, // Up to 20
      hasPerformanceInsights: true,
      hasPrioritySupport: true,
      badge: 'Verified Business Seller',
    },
    description: 'Best for: Large merchants, cooperatives, manufacturers, brands.',
    whatYouUnlock: [
      'Custom or unlimited matched client connections',
      'Category-specific demand targeting',
      'Guaranteed banner slots',
      'Custom banner sizes',
      'Monthly creative allowance (up to 20 requests)',
      'Brand identity development',
      'Assigned account manager',
      'Monthly strategy calls',
      'Featured merchant placement',
      'Early access to new features',
    ],
  },
};

// Helper functions
const getTier = (tierName) => {
  return SUBSCRIPTION_TIERS[tierName] || SUBSCRIPTION_TIERS.FREE;
};

const getPrice = (tierName, billingCycle = 'monthly') => {
  const tier = getTier(tierName);
  if (tierName === 'CUSTOM') return null; // Custom pricing
  return billingCycle === 'yearly' ? tier.yearlyPrice : tier.monthlyPrice;
};

const canAccessConnections = (tierName) => {
  const tier = getTier(tierName);
  return tier.features.connectionsPerMonth > 0 || tier.features.connectionsPerMonth === -1;
};

const getConnectionsLimit = (tierName) => {
  const tier = getTier(tierName);
  return tier.features.connectionsPerMonth;
};

module.exports = {
  SUBSCRIPTION_TIERS,
  getTier,
  getPrice,
  canAccessConnections,
  getConnectionsLimit,
};

