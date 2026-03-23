import React from 'react';
import { getFallbackImageDataUrl } from '../lib/imageFallback';
import { getDestinationBackupImage, getDestinationPrimaryImage } from '../lib/destinationImages';

interface HomePageProps {
  onEnter: () => void;
}

const DESTINATIONS_PREVIEW = [
  {
    name: 'Atlantic City',
    emoji: '🎰',
    tag: 'Nightlife',
    tagColor: '#7c3aed',
    tagBg: '#ede9fe',
    desc: 'Casinos, boardwalk, and great seafood on the East Coast.',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/A_sunset_view_of_the_beach_in_Atlantic_City%2C_NJ.jpg/800px-A_sunset_view_of_the_beach_in_Atlantic_City%2C_NJ.jpg',
    cost: '$343',
  },
  {
    name: 'Cape May',
    emoji: '🏛️',
    tag: 'Historic',
    tagColor: '#b45309',
    tagBg: '#fef3c7',
    desc: 'Victorian architecture & whale-watching at a National Landmark.',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Cape_May_Beach_Ave_from_the_sea_3.JPG/800px-Cape_May_Beach_Ave_from_the_sea_3.JPG',
    cost: '$507',
  },
  {
    name: 'Sandy Hook',
    emoji: '⛺',
    tag: 'Budget Pick',
    tagColor: '#0f766e',
    tagBg: '#ccfbf1',
    desc: 'Free national park beach & America\'s oldest lighthouse.',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Sandy_Hook_Aerial_1_%2811022025%29.jpg/800px-Sandy_Hook_Aerial_1_%2811022025%29.jpg',
    cost: '$91',
  },
  {
    name: 'Asbury Park',
    emoji: '🎵',
    tag: 'Music',
    tagColor: '#0e7490',
    tagBg: '#cffafe',
    desc: 'Indie music, Art Deco boardwalk, and a creative beach scene.',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Paramount_Theatre_Asbury_Park_Convention_Hall_NJ2.jpg/800px-Paramount_Theatre_Asbury_Park_Convention_Hall_NJ2.jpg',
    cost: '$323',
  },
];

const FEATURES = [
  {
    icon: '💸',
    title: 'Budget Planner',
    desc: 'Set your budget, trip length, and group size. Instantly see which NJ destinations you can actually afford.',
  },
  {
    icon: '📊',
    title: 'Visual Cost Breakdown',
    desc: 'Interactive charts compare travel, lodging, food, and activity costs across all 10 destinations side-by-side.',
  },
  {
    icon: '🌊',
    title: 'AI Travel Assistant',
    desc: 'Chat with SpringBreakBot — powered by GPT-4o — to find hotels, attractions, and tips tailored to your preferences.',
  },
];

const HomePage: React.FC<HomePageProps> = ({ onEnter }) => {
  return (
    <div className="homepage">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hp-hero">
        <div className="hp-hero-bg" aria-hidden="true">
          {/* Wave 1 — fast, subtle */}
          <svg className="hp-wave hp-wave-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 120" preserveAspectRatio="none">
            <path d="M0,60 C240,0 480,120 720,60 C960,0 1200,120 1440,60 C1680,0 1920,120 2160,60 C2400,0 2640,120 2880,60 L2880,120 L0,120 Z" fill="white" fillOpacity="0.14"/>
          </svg>
          {/* Wave 2 — slow, slightly more opaque */}
          <svg className="hp-wave hp-wave-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 120" preserveAspectRatio="none">
            <path d="M0,80 C360,20 720,110 1080,50 C1260,20 1440,80 1440,80 C1800,20 2160,110 2520,50 C2700,20 2880,80 2880,80 L2880,120 L0,120 Z" fill="white" fillOpacity="0.22"/>
          </svg>
          {/* Wave 3 — solid page-colour fill, static */}
          <svg className="hp-wave hp-wave-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,55 C200,110 500,10 720,55 C940,100 1140,20 1440,50 L1440,100 L0,100 Z" fill="#fffaf0"/>
          </svg>
        </div>

        <div className="hp-hero-content">
          <span className="hp-eyebrow">🏖️ New Jersey · Spring Break 2026</span>
          <h1 className="hp-title">
            Find Your Perfect<br />
            <span className="hp-title-accent">Spring Break</span> on a Student Budget
          </h1>
          <p className="hp-subtitle">
            Explore 10 NJ destinations with real cost data, interactive charts, and an AI trip planner — 
            all built for students who want sun without debt.
          </p>

          <div className="hp-hero-actions">
            <button className="hp-cta-primary" onClick={onEnter}>
              Start Exploring
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <a className="hp-cta-secondary" href="#features">See What's Inside</a>
          </div>

          <div className="hp-stats-bar">
            <div className="hp-stat">
              <strong>10</strong>
              <span>Destinations</span>
            </div>
            <div className="hp-stat-divider" />
            <div className="hp-stat">
              <strong>$91</strong>
              <span>Cheapest Trip</span>
            </div>
            <div className="hp-stat-divider" />
            <div className="hp-stat">
              <strong>140 mi</strong>
              <span>Farthest Away</span>
            </div>
            <div className="hp-stat-divider" />
            <div className="hp-stat">
              <strong>GPT-4o</strong>
              <span>AI Chatbot</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="hp-features" id="features">
        <div className="hp-section-inner">
          <h2 className="hp-section-title">Everything you need to plan your trip</h2>
          <div className="hp-feature-cards">
            {FEATURES.map(f => (
              <div className="hp-feature-card" key={f.title}>
                <span className="hp-feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Destination Preview ─────────────────────────────── */}
      <section className="hp-destinations">
        <div className="hp-section-inner">
          <h2 className="hp-section-title">A taste of what's waiting</h2>
          <p className="hp-section-sub">From $91 day-trips to $500+ getaways — there's a destination for every budget.</p>
          <div className="hp-dest-grid">
            {DESTINATIONS_PREVIEW.map(d => (
              <div className="hp-dest-card" key={d.name}>
                <div className="hp-dest-img-wrap">
                  <img
                    src={getDestinationPrimaryImage(d.name)}
                    alt={d.name}
                    loading="lazy"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (!img.dataset.backupApplied) {
                        img.dataset.backupApplied = '1';
                        img.src = getDestinationBackupImage(d.name);
                        return;
                      }
                      img.src = getFallbackImageDataUrl(d.name);
                    }}
                  />
                  <span
                    className="hp-dest-tag"
                    style={{ color: d.tagColor, backgroundColor: d.tagBg }}
                  >
                    {d.tag}
                  </span>
                </div>
                <div className="hp-dest-body">
                  <div className="hp-dest-header">
                    <span className="hp-dest-emoji">{d.emoji}</span>
                    <h3>{d.name}</h3>
                    <strong className="hp-dest-cost">{d.cost}<span>/3 days</span></strong>
                  </div>
                  <p>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="hp-dest-cta-wrap">
            <button className="hp-cta-primary" onClick={onEnter}>
              Explore All 10 Destinations
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="hp-footer">
        <p>Built for the Student Reality Lab · Data current for Spring 2026</p>
      </footer>
    </div>
  );
};

export default HomePage;
