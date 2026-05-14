import { MarketData } from '@/types/collectible';

// Simulated market data service
// In production, this would integrate with real APIs

export class MarketDataService {
  static async fetchPriceData(itemName: string, type: string): Promise<MarketData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data based on item type
    const mockData: Record<string, MarketData> = {
      'Charizard Base Set Holo': {
        itemName: 'Charizard Base Set Holo',
        currentPrice: 1250,
        priceHistory: [
          { date: new Date('2024-01-01'), price: 1100 },
          { date: new Date('2024-01-02'), price: 1150 },
          { date: new Date('2024-01-03'), price: 1200 },
          { date: new Date('2024-01-04'), price: 1180 },
          { date: new Date('2024-01-05'), price: 1250 },
        ],
        volume: 45,
        source: 'ebay',
      },
      'Walking Liberty Half Dollar': {
        itemName: 'Walking Liberty Half Dollar',
        currentPrice: 180,
        priceHistory: [
          { date: new Date('2024-01-01'), price: 175 },
          { date: new Date('2024-01-02'), price: 178 },
          { date: new Date('2024-01-03'), price: 182 },
          { date: new Date('2024-01-04'), price: 180 },
          { date: new Date('2024-01-05'), price: 180 },
        ],
        volume: 12,
        source: 'ngccoin',
      },
    };

    return mockData[itemName] || null;
  }

  static async identifyItem(imageUri: string): Promise<{
    name: string;
    type: string;
    estimatedValue: number;
    confidence: number;
    description: string;
  } | null> {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock AI identification results
    const identifications = [
      {
        name: 'Charizard Base Set Holo',
        type: 'Card',
        estimatedValue: 1250,
        confidence: 0.92,
        description: '1999 Pokémon Base Set Unlimited Holographic Charizard Card',
      },
      {
        name: 'Walking Liberty Half Dollar',
        type: 'Coin',
        estimatedValue: 180,
        confidence: 0.87,
        description: '1943 Walking Liberty Half Dollar Silver Coin',
      },
      {
        name: 'Amazing Spider-Man #1',
        type: 'Comic',
        estimatedValue: 8500,
        confidence: 0.95,
        description: '1963 Marvel Comics Group Amazing Spider-Man First Issue',
      },
    ];

    // Return random identification for demo
    return identifications[Math.floor(Math.random() * identifications.length)];
  }

  static async extractTextFromImage(imageUri: string): Promise<string> {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 500));

    const sampleTexts = [
      'Charizard Base Set 1999 Pokémon Trading Card Game',
      'Walking Liberty Half Dollar 1943 United States',
      'Amazing Spider-Man #1 Marvel Comics Group 1963',
      'Morgan Silver Dollar 1884 United States of America',
      'Michael Jordan 1986-87 Fleer Basketball Card #57',
    ];

    return sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  }

  static generatePriceHistory(basePrice: number, days: number = 30): Array<{ date: Date; price: number }> {
    const history = [];
    let currentPrice = basePrice;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Add some realistic price volatility
      const volatility = 0.05; // 5% daily volatility
      const change = (Math.random() - 0.5) * 2 * volatility;
      currentPrice = Math.max(currentPrice * (1 + change), basePrice * 0.5);
      
      history.push({
        date,
        price: Math.round(currentPrice * 100) / 100,
      });
    }

    return history;
  }
}