import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import InlineChatChart from './InlineChatChart';
import { getFallbackImageDataUrl } from '../lib/imageFallback';
import { trackEvent } from '../lib/analytics';
import {
  parsePriceRangeMidpoint,
  SUGGESTED_PROMPTS,
  type BookingCard,
  type Message,
} from '../lib/useChatMessages';

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

interface ChatConversationProps {
  messages: Message[];
  isLoading: boolean;
  thinkingStatus: string | null;
  inputValue: string;
  setInputValue: (value: string) => void;
  sendMessage: (text: string) => void | Promise<void>;
  bookmarkedCards: BookingCard[];
  toggleBookmark: (card: BookingCard) => void;
  expanded?: boolean;
  placeholder?: string;
  hintId?: string;
  showInitialSuggestions?: boolean;
  topSlot?: React.ReactNode;
}

const DEFAULT_HINT_ID = 'springbreakbot-hint';

const ChatConversation: React.FC<ChatConversationProps> = ({
  messages,
  isLoading,
  thinkingStatus,
  inputValue,
  setInputValue,
  sendMessage,
  bookmarkedCards,
  toggleBookmark,
  expanded = false,
  placeholder = 'Ask about hotels, budget, attractions… (Shift+Enter for new line)',
  hintId = DEFAULT_HINT_ID,
  showInitialSuggestions = true,
  topSlot,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;
    const ta = textareaRef.current;
    const maxHeight = expanded ? 220 : 180;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, [expanded, inputValue]);

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
    resetTextarea();
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const ta = e.target;
    const maxHeight = expanded ? 220 : 180;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
      resetTextarea();
    }
  };

  const isBookmarked = (card: BookingCard) => bookmarkedCards.some(saved => saved.bookingUrl === card.bookingUrl);

  return (
    <div className={`chat-conversation${expanded ? ' chat-conversation--expanded' : ''}`}>
      {topSlot}
      <p id={hintId} className="sr-only">
        Type a question about budgets, hotels, or destinations. Press Enter to send, or Shift+Enter for a new line.
      </p>
      <p className="sr-only" aria-live="polite" role="status">
        {thinkingStatus || ''}
      </p>

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

        {showInitialSuggestions && messages.length === 1 && !isLoading && !thinkingStatus && (
          <div className="chatbot-suggestions">
            {SUGGESTED_PROMPTS.map((prompt, index) => (
              <button key={index} className="chatbot-suggestion-chip" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chatbot-input-row" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="chatbot-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-describedby={hintId}
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
  );
};

export default ChatConversation;