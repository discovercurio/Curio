import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CollectibleItem {
  id: string;
  name: string;
  type: string;
  value: number;
  initialValue?: number;
  grade?: string;
  gradingCompany?: string;
  imageUrl: string;
  description: string;
  dateAdded: Date;
  marketData?: {
    priceChange: number;
    priceChangePercent: number;
  };
}

interface CollectionContextType {
  items: CollectibleItem[];
  setItems: React.Dispatch<React.SetStateAction<CollectibleItem[]>>;
  getTotalValue: () => number;
  getTotalItems: () => number;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CollectibleItem[]>([
    {
      id: '1',
      name: 'Charizard Base Set Holo',
      type: 'Card',
      value: 1250,
      initialValue: 1180,
      grade: '10',
      gradingCompany: 'PSA',
      imageUrl: 'https://i.ebayimg.com/images/g/yMUAAOSwnTdaRUQg/s-l1200.jpg',
      description: '1999 Pokémon Base Set Unlimited Holographic Charizard',
      dateAdded: new Date('2024-01-15'),
      marketData: { priceChange: 70, priceChangePercent: 5.9 },
    },
    {
      id: '2',
      name: 'Michael Jordan Rookie',
      type: 'Card',
      value: 3200,
      initialValue: 3350,
      grade: '9',
      gradingCompany: 'BGS',
      imageUrl: 'https://i.ebayimg.com/images/g/iRYAAeSwkc9oSLq7/s-l1600.jpeg',
      description: '1986 Fleer Basketball #57',
      dateAdded: new Date('2024-02-20'),
      marketData: { priceChange: -150, priceChangePercent: -4.5 },
    },
    {
      id: '3',
      name: 'Walking Liberty Half Dollar',
      type: 'Coin',
      value: 3900,
      initialValue: 3800,
      grade: 'MS67',
      gradingCompany: 'PCGS',
      imageUrl: 'https://i.ebayimg.com/images/g/kNAAAeSwr3BozC5t/s-l1600.jpeg',
      description: '1943 Walking Liberty Half Dollar',
      dateAdded: new Date('2024-03-10'),
      marketData: { priceChange: 5, priceChangePercent: 2.7 },
    },
    {
      id: '4',
      name: 'Morgan Silver Dollar',
      type: 'Coin',
      value: 95,
      initialValue: 88,
      grade: 'MS70',
      gradingCompany: 'NGC',
      imageUrl: 'https://i.ebayimg.com/images/g/cBcAAeSw6upoxdNB/s-l1600.jpeg',
      description: '2023-P Morgan Silver Dollar',
      dateAdded: new Date('2024-03-15'),
      marketData: { priceChange: 7, priceChangePercent: 8.0 },
    },
    {
      id: '5',
      name: 'Amazing Spider-Man #1',
      type: 'Comic',
      value: 8500,
      initialValue: 8500,
      grade: '7.0',
      gradingCompany: 'CGC',
      imageUrl: 'https://i.ebayimg.com/images/g/yoEAAOSw9bpcbul7/s-l1600.jpeg',
      description: 'First appearance of Spider-Man',
      dateAdded: new Date('2024-01-05'),
      marketData: { priceChange: 0, priceChangePercent: 0 },
    },
  ]);

  const getTotalValue = () => {
    return items.reduce((sum, item) => sum + item.value, 0);
  };

  const getTotalItems = () => {
    return items.length;
  };

  return (
    <CollectionContext.Provider value={{ items, setItems, getTotalValue, getTotalItems }}>
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const context = useContext(CollectionContext);
  if (context === undefined) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
}
