import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type FeedCategory = 'Cards' | 'Coins' | 'Comics' | 'General';

export interface FeedPost {
  id: string;
  title: string;
  author: string;
  category: FeedCategory;
  replies: number;
  likes: number;
  timeAgo: string;
  isHot: boolean;
}

interface FeedContextValue {
  feedPosts: FeedPost[];
  addPost: (p: FeedPost) => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([
    { id: '1', title: 'PSA vs BGS grading - which do you prefer and why?', author: 'CardCollector92', category: 'Cards', replies: 47, likes: 23, timeAgo: '2h ago', isHot: true },
    { id: '2', title: 'Found this Morgan Dollar at an estate sale - thoughts on authenticity?', author: 'CoinHunter', category: 'Coins', replies: 18, likes: 12, timeAgo: '4h ago', isHot: false },
    { id: '3', title: 'Amazing Spider-Man #1 prices are going crazy!', author: 'ComicBookGuy', category: 'Comics', replies: 89, likes: 56, timeAgo: '6h ago', isHot: true },
    { id: '4', title: 'Best storage solutions for long-term preservation?', author: 'PreservationPro', category: 'General', replies: 34, likes: 28, timeAgo: '1d ago', isHot: false },
  ]);

  const addPost = (p: FeedPost) => setFeedPosts(prev => [p, ...prev]);

  const value = useMemo(() => ({ feedPosts, addPost }), [feedPosts]);

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeed must be used within FeedProvider');
  return ctx;
}
