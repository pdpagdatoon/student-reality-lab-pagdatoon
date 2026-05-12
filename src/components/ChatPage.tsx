import React, { useMemo, useState } from 'react';
import ChatConversation from './ChatConversation';
import { SUGGESTED_PROMPTS, useChatMessages } from '../lib/useChatMessages';
import { trackEvent } from '../lib/analytics';
import InlineChatChart from './InlineChatChart';

interface ChatPageProps {
  onOpenDashboard: () => void;
  onBackHome: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onOpenDashboard, onBackHome }) => {
  const {
    messages,
    isLoading,
    thinkingStatus,
    inputValue,
    setInputValue,
    sendMessage,
    bookmarkedCards,
    toggleBookmark,
    tripBoard,
  } = useChatMessages();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const tripBoardLabel = useMemo(() => {
    if (tripBoard.count === 0) {
      return 'No saved hotels yet';
    }
    return `${tripBoard.count} saved hotel${tripBoard.count === 1 ? '' : 's'} · Avg $${tripBoard.nightlyAverage}/night`;
  }, [tripBoard]);

  const sidebarCharts = useMemo(() => {
    const locationCounts = bookmarkedCards.reduce<Record<string, number>>((acc, card) => {
      acc[card.location] = (acc[card.location] || 0) + 1;
      return acc;
    }, {});

    return {
      hotelsByDestination: Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value })),
      nightlyPrices: bookmarkedCards.slice(0, 6).map((card) => ({
        label: card.name.length > 14 ? `${card.name.slice(0, 14)}…` : card.name,
        value: Number(card.priceRange.match(/\d+/)?.[0] || 0),
      })),
    };
  }, [bookmarkedCards]);

  return (
    <div className="chat-page">
      <div className="chat-page-topbar">
        <button className="chat-page-nav-btn" onClick={onBackHome}>← Home</button>
        <button
          className="chat-page-nav-btn chat-page-nav-btn--sidebar"
          onClick={() => setSidebarOpen(open => !open)}
          aria-expanded={sidebarOpen}
          aria-controls="chat-page-sidebar"
        >
          ☰ Trip Tools
        </button>
      </div>

      <div className="chat-page-shell">
        <aside id="chat-page-sidebar" className={`chat-page-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="chat-page-sidebar-inner">
            <div className="chat-page-brand">
              <span className="chat-page-brand-avatar">🌊</span>
              <div>
                <strong>SpringBreakBot</strong>
                <p>NJ Student Travel Advisor</p>
              </div>
            </div>

            <section className="chat-page-panel">
              <p className="chat-page-panel-title">Suggested Questions</p>
              <div className="chat-page-chips">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    className="chatbot-suggestion-chip"
                    onClick={() => {
                      trackEvent('chat_page_suggestion_clicked', { prompt });
                      sendMessage(prompt);
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            <section className="chat-page-panel chat-page-panel--tripboard">
              <p className="chat-page-panel-title">Trip Board</p>
              <div className="chat-page-tripboard-metric">
                <strong>{tripBoard.count}</strong>
                <span>Bookmarked hotels</span>
              </div>
              <div className="chat-page-tripboard-metric">
                <strong>${tripBoard.nightlyAverage}</strong>
                <span>Nightly average</span>
              </div>
              <p className="chat-page-tripboard-summary">{tripBoardLabel}</p>
              <button
                type="button"
                className="chat-page-bookmarks-btn"
                onClick={() => setShowBookmarks(open => !open)}
                aria-expanded={showBookmarks}
              >
                {showBookmarks ? 'Hide bookmarked hotels' : 'See bookmarked hotels'}
              </button>
              {showBookmarks && (
                <div className="chat-page-bookmarks-drawer">
                  {bookmarkedCards.length === 0 ? (
                    <p className="chat-page-bookmarks-empty">No saved hotels yet. Use Save on a hotel card in chat.</p>
                  ) : (
                    <ul className="chat-page-bookmarks-list">
                      {bookmarkedCards.map((card) => (
                        <li key={card.bookingUrl} className="chat-page-bookmarks-item">
                          <div>
                            <strong>{card.name}</strong>
                            <span>{card.location} · {card.priceRange}</span>
                          </div>
                          <a href={card.bookingUrl} target="_blank" rel="noopener noreferrer">Open</a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>

            <section className="chat-page-panel">
              <p className="chat-page-panel-title">Saved Hotel Mix</p>
              {sidebarCharts.hotelsByDestination.length > 0 ? (
                <InlineChatChart
                  type="pie"
                  chartType="pie"
                  title="Hotels by destination"
                  data={sidebarCharts.hotelsByDestination}
                  unit=""
                />
              ) : (
                <p className="chat-page-bookmarks-empty">Save hotels to see mix by destination.</p>
              )}
            </section>

            <section className="chat-page-panel">
              <p className="chat-page-panel-title">Nightly Price Snapshot</p>
              {sidebarCharts.nightlyPrices.length > 0 ? (
                <InlineChatChart
                  type="bar"
                  chartType="bar"
                  title="Nightly rates"
                  data={sidebarCharts.nightlyPrices}
                />
              ) : (
                <p className="chat-page-bookmarks-empty">Save hotels to compare nightly rates here.</p>
              )}
            </section>

            <button
              className="chat-page-dashboard-link"
              onClick={onOpenDashboard}
            >
              View Charts & Data →
            </button>
          </div>
        </aside>

        <main className="chat-page-main">
          <header className="chat-page-hero">
            <span className="chat-page-kicker">AI-first trip planning</span>
            <h1>Plan your New Jersey spring break by talking it through.</h1>
            <p>
              Ask about budget, nightlife, hotel options, cost breakdowns, or what your budget can actually afford.
            </p>
          </header>

          <div className="chat-page-conversation">
            <ChatConversation
              messages={messages}
              isLoading={isLoading}
              thinkingStatus={thinkingStatus}
              inputValue={inputValue}
              setInputValue={setInputValue}
              sendMessage={sendMessage}
              bookmarkedCards={bookmarkedCards}
              toggleBookmark={toggleBookmark}
              expanded
              hintId="springbreakbot-page-hint"
              showInitialSuggestions={false}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;