import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import InlineChatChart, { type InlineChartPayload } from './InlineChatChart';
import { getFallbackImageDataUrl } from '../lib/imageFallback';
import { trackEvent } from '../lib/analytics';

interface BookingCard {
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

interface MapCard {
  destination: string;
  coordinates: string;
  mapUrl: string;
}

interface Message {
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

const BOOKMARK_STORAGE_KEY = 'springbreakbot.hotelBookmarks';

const parsePriceRangeMidpoint = (priceRange: string): number => {
  const nums = priceRange.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length >= 2) return Math.round((nums[0] + nums[1]) / 2);
  if (nums.length === 1) return nums[0];
  return 0;
};

const BookingCardItem: React.FC<{
  card: BookingCard;
  isSaved: boolean;
  onToggleSave: (card: BookingCard) => void;
}> = ({ card, isSaved, onToggleSave }) => (
  <div className="chat-booking-card">
    <a
      href={card.bookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="chat-booking-card-main"
      onClick={() => {
        trackEvent('hotel_link_clicked', { hotel: card.name, platform: card.platform, location: card.location });
      }}
      aria-label={`${card.name}, ${card.location}, opens booking details in a new tab`}
    >
      <div className="chat-booking-card-img">
        <img
          src={card.imageUrl}
          alt={card.location}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getFallbackImageDataUrl(card.location);
          }}
        />
      </div>
      <div className="chat-booking-card-body">
        <span className="chat-booking-card-tag">{card.tag}</span>
        <h4 className="chat-booking-card-name">{card.name}</h4>
        <p className="chat-booking-card-loc">📍 {card.location}, NJ</p>
        <div className="chat-booking-card-footer">
          <strong className="chat-booking-card-price">{card.priceRange}</strong>
          <span className="chat-booking-card-cta">{card.platform} →</span>
        </div>
      </div>
    </a>
    {card.backupUrl && (
      <a
        className="chat-booking-card-backup"
        href={card.backupUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Backup: Booking search
      </a>
    )}
    <button
      type="button"
      className={`chat-bookmark-btn${isSaved ? ' is-saved' : ''}`}
      onClick={() => onToggleSave(card)}
      aria-label={isSaved ? `Remove ${card.name} from bookmarks` : `Save ${card.name} to bookmarks`}
    >
      {isSaved ? '★ Saved' : '☆ Save'}
    </button>
  </div>
);

const HotelPriceHistogram: React.FC<{ cards: BookingCard[] }> = ({ cards }) => {
  const points = cards
    .map((card) => ({
      name: card.name,
      midpoint: parsePriceRangeMidpoint(card.priceRange),
    }))
    .sort((a, b) => a.midpoint - b.midpoint);

  const maxPrice = Math.max(...points.map((p) => p.midpoint), 1);

  return (
    <div className="chat-cost-chart chat-hotel-histogram">
      <p className="chat-booking-header">Hotel Price Histogram (Nightly Midpoint)</p>
      <div className="chat-histogram-vertical">
        {points.map((point) => {
          const height = Math.max((point.midpoint / maxPrice) * 100, 10);
          return (
            <div key={point.name} className="chat-histogram-bin">
              <div className="chat-histogram-value">${point.midpoint}</div>
              <div className="chat-histogram-bar-track">
                <div className="chat-histogram-bar-fill" style={{ height: `${height}%` }} />
              </div>
              <div className="chat-histogram-label" title={point.name}>{point.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const HotelMapGrid: React.FC<{ cards: BookingCard[] }> = ({ cards }) => (
  <div className="chat-map-cards chat-hotel-maps">
    <p className="chat-booking-header">Hotel Locations</p>
    <div className="chat-hotel-map-grid">
      {cards.map((card) => {
        const query = encodeURIComponent(`${card.name} ${card.location} New Jersey`);
        const embedUrl = `https://www.google.com/maps?q=${query}&output=embed`;
        const mapUrl = card.mapUrl || `https://www.google.com/maps/search/?api=1&query=${query}`;
        return (
          <div key={`${card.name}-${card.location}`} className="chat-hotel-map-card">
            <iframe
              title={`Map of ${card.name}`}
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a href={mapUrl} target="_blank" rel="noopener noreferrer">
              Open {card.name} in Maps
            </a>
          </div>
        );
      })}
    </div>
  </div>
);

const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="chat-collapsible">
      <button
        type="button"
        className="chat-collapsible-toggle"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        <span className={`chat-collapsible-caret${isOpen ? ' is-open' : ''}`}>▾</span>
      </button>
      {isOpen && <div className="chat-collapsible-content">{children}</div>}
    </div>
  );
};

const SUGGESTED_PROMPTS = [
  'I have a $400 budget for 3 days — what can I afford?',
  'Where can I find the best nightlife?',
  'Recommend a hotel in Cape May under $150/night',
  'Best outdoor activities near NJ?',
  'Cheapest spring break destination?',
];

const CHATBOT_HINT_ID = 'springbreakbot-hint';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hey! 👋 I'm SpringBreakBot. Tell me your budget, trip length, or interests and I'll find the perfect NJ destination for you!",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkedCards, setBookmarkedCards] = useState<BookingCard[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) textareaRef.current?.focus();
  }, [isOpen]);

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    const maxHeight = isFullscreen ? 220 : 180;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const maxHeight = isFullscreen ? 220 : 180;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, maxHeight) + 'px';
  }, [isFullscreen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
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
    resetTextarea();
    setIsLoading(true);

    try {
      setThinkingStatus('Looking up destination data...');
      // secondary micro-status after a short delay to feel responsive
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
          // Keep fallback status message if error payload is not JSON.
        }
        throw new Error(serverMessage);
      }

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

      const contentType = response.headers.get('content-type') || '';
      const isSse = contentType.toLowerCase().includes('text/event-stream');

      if (!isSse || !response.body) {
        const data = await response.json();
        updateAssistant(data.reply || '', {
          bookingCards: data.bookingCards,
          mapCards: data.mapCards,
          sources: data.sources,
          quickReplies: data.quickReplies,
        });
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
          // chart event payload is the InlineChartPayload itself
          const chartPayload = rawPayload as InlineChartPayload;
          meta = { ...(meta || {}), inlineChart: chartPayload };
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
      clearTimeout((statusTimer as unknown) as number);
      setThinkingStatus(null);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const fallbackMessage = isLocal
        ? "Sorry, I couldn't connect to the server. Make sure the API is running (`npm run dev:all`)."
        : "Sorry, I couldn't connect to the chatbot API. If this is a deployed site, verify the Vercel `OPENAI_API_KEY` env var and redeploy.";

      setThinkingStatus(null);
      setMessages(prev => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        if (lastIndex >= 0 && next[lastIndex].role === 'assistant') {
          next[lastIndex] = {
            role: 'assistant',
            content: `Sorry, I ran into an error: ${errorText}\n\n${fallbackMessage}`,
          };
          return next;
        }
        return [...prev, {
          role: 'assistant',
          content: `Sorry, I ran into an error: ${errorText}\n\n${fallbackMessage}`,
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const isBookmarked = (card: BookingCard) =>
    bookmarkedCards.some(saved => saved.bookingUrl === card.bookingUrl);

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

  const tripBoardEstimate = bookmarkedCards.reduce((sum, card) => sum + parsePriceRangeMidpoint(card.priceRange), 0);
  const tripBoardNightlyAverage = bookmarkedCards.length
    ? Math.round(tripBoardEstimate / bookmarkedCards.length)
    : 0;

  const exportTripBoard = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      listings: bookmarkedCards,
      averageNightlyEstimate: tripBoardNightlyAverage,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'springbreak-trip-board.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    trackEvent('trip_board_exported', { listingCount: bookmarkedCards.length });
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close chat' : 'Open SpringBreakBot chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {!isOpen && <span className="chatbot-toggle-label">Ask me anything!</span>}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className={`chatbot-window${isFullscreen ? ' chatbot-window--fullscreen' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-label="SpringBreakBot chat"
          aria-describedby={CHATBOT_HINT_ID}
        >
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-avatar">🌊</span>
              <div>
                <strong>SpringBreakBot</strong>
                <p>NJ Student Travel Advisor</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-star"
                onClick={() => {
                  const next = !showBookmarks;
                  setShowBookmarks(next);
                  trackEvent('toggle_saved_hotels_panel', { currentlyOpen: next });
                }}
                aria-label="Toggle saved hotels"
                title="Saved hotels"
                aria-pressed={showBookmarks}
              >
                ★ {bookmarkedCards.length}
              </button>
              <button
                className="chatbot-close"
                onClick={() => setIsFullscreen(f => !f)}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                  </svg>
                )}
              </button>
              <button
                className="chatbot-close"
                onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          <p id={CHATBOT_HINT_ID} className="sr-only">
            Type a question about budgets, hotels, or destinations. Press Enter to send, or Shift+Enter for a new line.
          </p>
          <p className="sr-only" aria-live="polite" role="status">
            {thinkingStatus || ''}
          </p>

          {showBookmarks && (
            <div className="chat-bookmarks-panel">
              <p className="chat-bookmarks-title">Saved Hotels</p>
              <p className="chat-bookmarks-summary">
                {bookmarkedCards.length} saved · Rough nightly average ${tripBoardNightlyAverage}
              </p>
              <div className="chat-bookmarks-actions">
                <button type="button" onClick={exportTripBoard} disabled={bookmarkedCards.length === 0}>Export</button>
                <button
                  type="button"
                  onClick={() => {
                    setBookmarkedCards([]);
                    trackEvent('trip_board_cleared');
                  }}
                  disabled={bookmarkedCards.length === 0}
                >
                  Clear
                </button>
              </div>
              {bookmarkedCards.length === 0 ? (
                <p className="chat-bookmarks-empty">No saved listings yet. Use ☆ Save on any hotel card.</p>
              ) : (
                <ul className="chat-bookmarks-list">
                  {bookmarkedCards.map((card) => (
                    <li key={card.bookingUrl} className="chat-bookmarks-item">
                      <a href={card.bookingUrl} target="_blank" rel="noopener noreferrer">
                        {card.name}
                      </a>
                      <button type="button" onClick={() => toggleBookmark(card)} aria-label={`Remove ${card.name}`}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-message chatbot-message--${msg.role}`}>
                <div className={`chatbot-bubble${msg.role === 'assistant' ? ' chatbot-bubble--md' : ''}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                          {msg.role === 'assistant' && msg.inlineChart && (
                            <div className="chat-inline-chart-wrapper">
                              <InlineChatChart {...msg.inlineChart} />
                            </div>
                          )}
                          {msg.role === 'assistant' && msg.content && msg.content.trim().length > 0 && (
                            <div className="chatbot-message-actions">
                              <button
                                type="button"
                                className="chatbot-copy-btn"
                                onClick={() => {
                                  navigator.clipboard?.writeText(msg.content || '').then(() => trackEvent('chat_copy_response'));
                                }}
                                aria-label="Copy response"
                              >
                                Copy
                              </button>
                            </div>
                          )}
                  {msg.role === 'assistant' && msg.bookingCards && msg.bookingCards.length > 0 && (
                    <div className="chat-booking-cards">
                      <p className="chat-booking-header">Hotel Options</p>
                      {msg.bookingCards.map((card, j) => (
                        <BookingCardItem
                          key={j}
                          card={card}
                          isSaved={isBookmarked(card)}
                          onToggleSave={toggleBookmark}
                        />
                      ))}
                      <HotelPriceHistogram cards={msg.bookingCards} />
                      <HotelMapGrid cards={msg.bookingCards} />
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.mapCards && msg.mapCards.length > 0 && (
                    <CollapsibleSection title="Map quick links">
                      <div className="chat-map-cards">
                        <div className="chat-map-grid">
                          {msg.mapCards.map((mapCard) => (
                            <a
                              key={mapCard.destination}
                              href={mapCard.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="chat-map-card"
                            >
                              <strong>{mapCard.destination}</strong>
                              <span>{mapCard.coordinates}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <CollapsibleSection title="Sources">
                      <div className="chat-sources">
                        {msg.sources.map((source, idx) => (
                          <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer">Source: {source.label}</a>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                  {msg.role === 'assistant' && msg.quickReplies && msg.quickReplies.length > 0 && (
                    <CollapsibleSection title="Suggested follow-ups" defaultOpen={messages.length <= 2}>
                      <div className="chatbot-suggestions chat-quick-replies">
                        {msg.quickReplies.map((reply, idx) => (
                          <button
                            key={idx}
                            className="chatbot-suggestion-chip"
                            onClick={() => {
                              trackEvent('quick_reply_clicked', { reply });
                              sendMessage(reply);
                            }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>
              </div>
            ))}

            {(isLoading || Boolean(thinkingStatus)) && (
              <div className="chatbot-message chatbot-message--assistant">
                <div className="chatbot-bubble chatbot-bubble--typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {/* Suggested prompts — show only after first greeting */}
            {messages.length === 1 && !isLoading && !thinkingStatus && (
              <div className="chatbot-suggestions">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button key={i} className="chatbot-suggestion-chip" onClick={() => sendMessage(p)}>
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chatbot-input-row" onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              className="chatbot-input"
              placeholder="Ask about hotels, budget, attractions… (Shift+Enter for new line)"
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-describedby={CHATBOT_HINT_ID}
              aria-busy={isLoading || Boolean(thinkingStatus)}
              maxLength={500}
              rows={1}
            />
            <button
              className="chatbot-send"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
