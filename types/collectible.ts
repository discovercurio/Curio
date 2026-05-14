export interface CollectibleItem {
  id: string;
  name: string;
  type: 'Card' | 'Coin' | 'Comic' | 'Other';
  grade?: string;
  value: number;
  initialValue?: number;
  description: string;
  imageUrl?: string;
  dateAdded: Date;
  lastUpdated: Date;
  marketData?: {
    lastPrice: number;
    priceChange: number;
    priceChangePercent: number;
    marketTrend: 'up' | 'down' | 'stable';
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  isPremium: boolean;
  subscriptionExpiry?: Date;
  settings: {
    notifications: boolean;
    priceAlerts: boolean;
    currency: 'USD' | 'EUR' | 'GBP';
  };
}

export interface PriceAlert {
  id: string;
  itemId: string;
  userId: string;
  threshold: number;
  type: 'above' | 'below';
  isActive: boolean;
  createdAt: Date;
}

export interface MarketData {
  itemName: string;
  currentPrice: number;
  priceHistory: Array<{
    date: Date;
    price: number;
  }>;
  volume: number;
  source: 'ebay' | 'pricecharting' | 'ngccoin';
}
