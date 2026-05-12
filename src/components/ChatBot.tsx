import React, { useState } from 'react';
import ChatConversation from './ChatConversation';
import { trackEvent } from '../lib/analytics';
import { useChatMessages } from '../lib/useChatMessages';

const CHATBOT_HINT_ID = 'springbreakbot-hint';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const {
    thinkingStatus,
    messages,
    inputValue,
    setInputValue,
    isLoading,
    bookmarkedCards,
    toggleBookmark,
    sendMessage,
    tripBoard,
  } = useChatMessages();

  const exportTripBoard = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      listings: bookmarkedCards,
      averageNightlyEstimate: tripBoard.nightlyAverage,
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
                {bookmarkedCards.length} saved · Rough nightly average ${tripBoard.nightlyAverage}
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

          <ChatConversation
            messages={messages}
            isLoading={isLoading}
            thinkingStatus={thinkingStatus}
            inputValue={inputValue}
            setInputValue={setInputValue}
            sendMessage={sendMessage}
            bookmarkedCards={bookmarkedCards}
            toggleBookmark={toggleBookmark}
            expanded={isFullscreen}
            hintId={CHATBOT_HINT_ID}
          />
        </div>
      )}
    </>
  );
};

export default ChatBot;
