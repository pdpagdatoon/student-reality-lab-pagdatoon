import { useEffect, useMemo, useState } from 'react';
import type { InlineChartPayload } from '../components/InlineChatChart';
import { trackEvent } from './analytics';

export interface BookingCard {
  name: string;
  location: string;
  priceRange: string;
  tag: string;
  imageUrl: string;
  platform: string;
  bookingUrl: string;
  backupUrl?: string;
  mapUrl?: string;
}

export interface MapCard {
  destination: string;
  coordinates: string;
  mapUrl: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  bookingCards?: BookingCard[];
  mapCards?: MapCard[];
  sources?: Array<{ label: string; url: string }>;
  quickReplies?: string[];
  inlineChart?: InlineChartPayload;
}

interface StreamEventPayload {
  token?: string;
  error?: string;
  bookingCards?: BookingCard[];
  mapCards?: MapCard[];
  sources?: Array<{ label: string; url: string }>;
  quickReplies?: string[];
  inlineChart?: InlineChartPayload;
}

export const BOOKMARK_STORAGE_KEY = 'springbreakbot.hotelBookmarks';

export const SUGGESTED_PROMPTS = [
  'I have a $400 budget for 3 days — what can I afford?',
  'Where can I find the best nightlife?',
  'Recommend a hotel in Cape May under $150/night',
  'Best outdoor activities near NJ?',
  'Cheapest spring break destination?',
];

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    content:
      "Hey! 👋 I'm SpringBreakBot. Tell me your budget, trip length, or interests and I'll find the perfect NJ destination for you!",
  },
];

const LOCAL_ERROR = "Sorry, I couldn't connect to the server. Make sure the API is running (`npm run dev:all`).";
const DEPLOYED_ERROR = "Sorry, I couldn't connect to the chatbot API. If this is a deployed site, verify the Vercel `OPENAI_API_KEY` env var and redeploy.";

export const parsePriceRangeMidpoint = (priceRange: string): number => {
  const nums = priceRange.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  if (nums.length === 1) return nums[0];
  return 0;
};

export function useChatMessages() {
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkedCards, setBookmarkedCards] = useState<BookingCard[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as BookingCard[];
      if (Array.isArray(parsed)) {
        setBookmarkedCards(parsed);
      }
    } catch {
      setBookmarkedCards([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedCards));
  }, [bookmarkedCards]);

  const updateAssistant = (content: string, meta: Partial<Message> = {}) => {
    setMessages(prev => {
      const next = [...prev];
      const lastIndex = next.length - 1;
      if (lastIndex < 0 || next[lastIndex].role !== 'assistant') return prev;
      next[lastIndex] = {
        ...next[lastIndex],
        content,
        ...(meta.bookingCards ? { bookingCards: meta.bookingCards } : {}),
        ...(meta.mapCards ? { mapCards: meta.mapCards } : {}),
        ...(meta.sources ? { sources: meta.sources } : {}),
        ...(meta.quickReplies ? { quickReplies: meta.quickReplies } : {}),
        ...(meta.inlineChart ? { inlineChart: meta.inlineChart } : {}),
      };
      return next;
    });
  };

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || isLoading) return;

    const userMessage: Message = { role: 'user', content: userText };
    const updatedMessages = [...messages, userMessage];
    const boundedMessages = updatedMessages.slice(-20);
    trackEvent('chat_message_sent', { length: userText.length });
    setMessages([...updatedMessages, { role: 'assistant', content: '' }]);
    setInputValue('');
    setIsLoading(true);

    try {
      setThinkingStatus('Looking up destination data...');
      const statusTimer = setTimeout(() => setThinkingStatus('Crafting your answer...'), 1500);
      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: boundedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        let serverMessage = `Server error: ${response.status}`;
        try {
          const err = await response.json();
          if (err?.error && typeof err.error === 'string') {
            serverMessage = err.error;
          }
        } catch {
          // Ignore JSON parse failure for error payloads.
        }
        throw new Error(serverMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      const isSse = contentType.toLowerCase().includes('text/event-stream');

      if (!isSse || !response.body) {
        const data = await response.json();
        updateAssistant(data.reply || '', {
          bookingCards: data.bookingCards,
          mapCards: data.mapCards,
          sources: data.sources,
          quickReplies: data.quickReplies,
          inlineChart: data.inlineChart,
        });
        clearTimeout(statusTimer);
        setThinkingStatus(null);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';
      let meta: Partial<Message> = {};

      const handleEventBlock = (block: string) => {
        const lines = block.split('\n');
        let eventName = 'message';
        let dataText = '';

        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          if (line.startsWith('data:')) dataText += line.slice(5).trim();
        }

        if (!dataText) return;

        let rawPayload: unknown = {};
        try {
          rawPayload = JSON.parse(dataText);
        } catch {
          rawPayload = {};
        }
        const payload = rawPayload as StreamEventPayload;

        if (eventName === 'token') {
          streamedText += String(payload.token || '');
          updateAssistant(streamedText, meta);
          return;
        }

        if (eventName === 'meta') {
          meta = {
            ...(payload.bookingCards ? { bookingCards: payload.bookingCards } : {}),
            ...(payload.mapCards ? { mapCards: payload.mapCards } : {}),
            ...(payload.sources ? { sources: payload.sources } : {}),
            ...(payload.quickReplies ? { quickReplies: payload.quickReplies } : {}),
            ...(payload.inlineChart ? { inlineChart: payload.inlineChart } : {}),
          };
          updateAssistant(streamedText, meta);
          return;
        }

        if (eventName === 'chart') {
          meta = { ...meta, inlineChart: rawPayload as InlineChartPayload };
          updateAssistant(streamedText, meta);
          return;
        }

        if (eventName === 'error') {
          throw new Error(String(payload.error || 'Streaming chat failed'));
        }
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          if (block.trim().length > 0) handleEventBlock(block);
        }
      }

      if (buffer.trim().length > 0) handleEventBlock(buffer);
      clearTimeout(statusTimer);
      setThinkingStatus(null);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      setThinkingStatus(null);
      setMessages(prev => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        const content = `Sorry, I ran into an error: ${errorText}\n\n${isLocal ? LOCAL_ERROR : DEPLOYED_ERROR}`;
        if (lastIndex >= 0 && next[lastIndex].role === 'assistant') {
          next[lastIndex] = { role: 'assistant', content };
          return next;
        }
        return [...prev, { role: 'assistant', content }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = (card: BookingCard) => {
    setBookmarkedCards(prev => {
      const exists = prev.some(saved => saved.bookingUrl === card.bookingUrl);
      if (exists) {
        trackEvent('hotel_unsaved', { hotel: card.name, location: card.location });
        return prev.filter(saved => saved.bookingUrl !== card.bookingUrl);
      }
      trackEvent('hotel_saved', { hotel: card.name, location: card.location });
      return [card, ...prev];
    });
  };

  const tripBoard = useMemo(() => {
    const total = bookmarkedCards.reduce((sum, card) => sum + parsePriceRangeMidpoint(card.priceRange), 0);
    const nightlyAverage = bookmarkedCards.length ? Math.round(total / bookmarkedCards.length) : 0;
    return {
      count: bookmarkedCards.length,
      nightlyAverage,
    };
  }, [bookmarkedCards]);

  return {
    messages,
    isLoading,
    thinkingStatus,
    inputValue,
    setInputValue,
    sendMessage,
    bookmarkedCards,
    toggleBookmark,
    tripBoard,
  };
}
