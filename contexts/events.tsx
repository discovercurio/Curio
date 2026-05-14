import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

/* ---------------- Types ---------------- */
export interface Show {
  id: string;
  name: string;
  date: Date;
  location: string;
  address: string;
  distance: number;
  type: 'Card Show' | 'Coin Show' | 'Comic Con' | 'Mixed';
  rating: number;
  attendees: number;
  imageUrl: string;
  featured: boolean;
  description?: string;
}

type RsvpMap = Record<string, boolean>;
type CountMap = Record<string, number>;

interface EventsContextValue {
  shows: Show[];
  userRsvps: RsvpMap;
  eventRsvpCounts: CountMap;
  toggleRsvp: (id: string) => void;
  totalAttendeesFor: (id: string) => number;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [shows] = useState<Show[]>([
    {
      id: '1',
      name: 'Greater Chicago Card & Collectibles Show',
      date: new Date('2024-02-15'),
      location: 'Chicago, IL',
      address: 'Stephens Convention Center',
      distance: 2.3,
      type: 'Card Show',
      rating: 4.8,
      attendees: 450,
      imageUrl: 'https://images.pexels.com/photos/6963098/pexels-photo-6963098.jpeg?auto=compress&cs=tinysrgb&w=400',
      featured: true,
      description:
        'Join us for the premier card and collectibles show in the Chicagoland area. Featuring over 200 vendor tables with sports cards, trading cards, comics, and memorabilia. Meet collectors, find rare items, and participate in on-site grading events.',
    },
    {
      id: '2',
      name: 'Midwest Coin & Currency Expo',
      date: new Date('2024-02-18'),
      location: 'Milwaukee, WI',
      address: 'Wisconsin Center',
      distance: 5.7,
      type: 'Coin Show',
      rating: 4.6,
      attendees: 320,
      imageUrl: 'https://images.pexels.com/photos/730568/pexels-photo-730568.jpeg?auto=compress&cs=tinysrgb&w=400',
      featured: false,
      description:
        "The Midwest's largest coin and currency show featuring dealers from across the country. Browse rare coins, currency, bullion, and numismatic supplies. Educational seminars and expert appraisals available throughout the event.",
    },
    {
      id: '3',
      name: 'Comic & Pop Culture Convention',
      date: new Date('2024-02-22'),
      location: 'Indianapolis, IN',
      address: 'Indiana Convention Center',
      distance: 8.1,
      type: 'Comic Con',
      rating: 4.9,
      attendees: 1200,
      imageUrl: 'https://images.pexels.com/photos/6963098/pexels-photo-6963098.jpeg?auto=compress&cs=tinysrgb&w=400',
      featured: true,
      description:
        'A celebration of all things comics and pop culture! Meet comic book creators, attend panels, cosplay contests, and explore vendor halls filled with comics, toys, collectibles, and artwork. Special guest appearances announced weekly.',
    },
  ]);

  const [userRsvps, setUserRsvps] = useState<RsvpMap>({});
  const [eventRsvpCounts, setEventRsvpCounts] = useState<CountMap>({});

  const toggleRsvp = (id: string) => {
    setUserRsvps(prev => {
      const nextGoing = !prev[id];
      setEventRsvpCounts(c => ({ ...c, [id]: (c[id] || 0) + (nextGoing ? 1 : -1) }));
      return { ...prev, [id]: nextGoing };
    });
  };

  const totalAttendeesFor = (id: string) =>
    (shows.find(s => s.id === id)?.attendees ?? 0) + (eventRsvpCounts[id] || 0);

  const value = useMemo(
    () => ({ shows, userRsvps, eventRsvpCounts, toggleRsvp, totalAttendeesFor }),
    [shows, userRsvps, eventRsvpCounts]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
}
