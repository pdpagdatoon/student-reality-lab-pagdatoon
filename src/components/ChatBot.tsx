import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  bookingCards?: BookingCard[];
  sources?: Array<{ label: string; url: string }>;
  quickReplies?: string[];
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
      </div>
    </a>
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

const SUGGESTED_PROMPTS = [
  'I have a $400 budget for 3 days — what can I afford?',
  'Where can I find the best nightlife?',
  'Recommend a hotel in Cape May under $150/night',
  'Best outdoor activities near NJ?',
  'Cheapest spring break destination?',
];

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
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
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    trackEvent('chat_message_sent', { length: userText.length });
    setMessages(updatedMessages);
    setInputValue('');
    resetTextarea();
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
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

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        bookingCards: data.bookingCards,
        sources: data.sources,
        quickReplies: data.quickReplies,
      }]);
    } catch (error) {
      const errorText = error instanceof Error ? error.message : 'Unknown error';
      const isLocal =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      const fallbackMessage = isLocal
        ? "Sorry, I couldn't connect to the server. Make sure the API is running (`npm run dev:all`)."
        : "Sorry, I couldn't connect to the chatbot API. If this is a deployed site, verify the Vercel `OPENAI_API_KEY` env var and redeploy.";

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I ran into an error: ${errorText}\n\n${fallbackMessage}`,
        },
      ]);
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
        <div className={`chatbot-window${isFullscreen ? ' chatbot-window--fullscreen' : ''}`} role="dialog" aria-label="SpringBreakBot">
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
                className="chatbot-close"
                onClick={() => {
                  const next = !showBookmarks;
                  setShowBookmarks(next);
                  trackEvent('toggle_saved_hotels_panel', { currentlyOpen: next });
                }}
                aria-label="Toggle saved hotels"
                title="Saved hotels"
              >
                ★ {bookmarkedCards.length}
              </button>
              <button
                className="chatbot-close"
                onClick={() => setIsFullscreen(f => !f)}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
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
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div className="chat-sources">
                      {msg.sources.map((source, idx) => (
                        <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer">Source: {source.label}</a>
                      ))}
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.quickReplies && msg.quickReplies.length > 0 && (
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
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-message chatbot-message--assistant">
                <div className="chatbot-bubble chatbot-bubble--typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {/* Suggested prompts — show only after first greeting */}
            {messages.length === 1 && !isLoading && (
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
