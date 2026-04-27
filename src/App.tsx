import React, { Suspense, lazy, useState, useMemo, useEffect, useCallback } from 'react';
import { loadData } from './lib/loadData';
import { enrichDestinationRecords } from './lib/transforms';
import { UserControls } from './lib/schema';
import ChatBot from './components/ChatBot';
import HomePage from './components/HomePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { trackEvent } from './lib/analytics';
import { DATA_METADATA } from './lib/metadata';
import { encodeControlsToUrl, decodeControlsFromUrl } from './lib/urlState';
import './index.css';

const Controls = lazy(() => import('./components/Controls'));
const DestinationCostChart = lazy(() => import('./components/DestinationCostChart'));
const CostBreakdown = lazy(() => import('./components/CostBreakdown'));
const DistanceScatter = lazy(() => import('./components/DistanceScatter'));
const DestinationInfo = lazy(() => import('./components/DestinationInfo'));
const StoryText = lazy(() => import('./components/StoryText'));
const AnnotationCallout = lazy(() => import('./components/AnnotationCallout'));

const App: React.FC = () => {
  // Decode URL params for initial state
  const urlState = decodeControlsFromUrl();

  const [page, setPage] = useState<'home' | 'dashboard'>(
    Object.keys(urlState).length > 0 ? 'dashboard' : 'home'
  );
  const [showMethodology, setShowMethodology] = useState(false);
  const rawData = useMemo(() => loadData(), []);
  const [controls, setControls] = useState<UserControls>({
    budget: urlState.budget ?? 500,
    tripLength: urlState.tripLength ?? 3,
    lodgingMode: urlState.lodgingMode ?? 1,
  });
  const [selectedDestination, setSelectedDestination] = useState<string | undefined>(urlState.destination);
  const [copied, setCopied] = useState(false);

  const enrichedData = useMemo(() => enrichDestinationRecords(rawData, controls), [rawData, controls]);

  const affordableDestinations = useMemo(
    () => enrichedData.filter((destination) => destination.affordability === 'affordable'),
    [enrichedData]
  );

  const cheapestAffordable = useMemo(() => {
    if (!affordableDestinations.length) {
      return null;
    }

    return affordableDestinations.reduce((cheapest, current) =>
      current.total_trip_cost < cheapest.total_trip_cost ? current : cheapest
    );
  }, [affordableDestinations]);

  const mostExpensiveAffordable = useMemo(() => {
    if (!affordableDestinations.length) {
      return null;
    }

    return affordableDestinations.reduce((mostExpensive, current) =>
      current.total_trip_cost > mostExpensive.total_trip_cost ? current : mostExpensive
    );
  }, [affordableDestinations]);


  const handleControlsChange = useCallback((newControls: Partial<UserControls>) => {
    trackEvent('controls_changed', newControls);
    setControls(prev => ({ ...prev, ...newControls }));
  }, []);

  // Keep URL in sync when on dashboard
  useEffect(() => {
    if (page !== 'dashboard') return;
    const url = encodeControlsToUrl(controls, selectedDestination);
    window.history.replaceState(null, '', url);
  }, [controls, selectedDestination, page]);

  const handleShare = async () => {
    const url = encodeControlsToUrl(controls, selectedDestination);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent('trip_shared', { destination: selectedDestination });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: show the URL in a prompt
      window.prompt('Copy this link:', url);
    }
  };
  return (
    <>
      {page === 'home' ? (
        <HomePage onEnter={() => {
          trackEvent('enter_dashboard');
          setPage('dashboard');
        }} />
      ) : (
        <div className="db-page">
          {/* ── Dashboard header banner ── */}
          <header className="db-header">
            <div className="db-header-inner">
              <button
                className="back-home-btn back-home-btn--hero"
                onClick={() => {
                  trackEvent('back_to_home');
                  setPage('home');
                }}
              >
                ← Home
              </button>
              <button
                className="share-btn"
                onClick={handleShare}
                aria-label="Copy shareable link"
                title="Copy shareable link"
              >
                {copied ? '✓ Copied!' : '🔗 Share'}
              </button>
              <div className="db-header-text">
                <h1>Spring Break on a Student Budget</h1>
                <p>New Jersey Edition · 10 Destinations · Real Cost Data</p>
              </div>
            </div>
            <div className="db-header-waves" aria-hidden="true">
              {/* Wave 1 — fast, subtle */}
              <svg className="db-wave db-wave-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 80" preserveAspectRatio="none">
                <path d="M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 C1680,0 1920,80 2160,40 C2400,0 2640,80 2880,40 L2880,80 L0,80 Z" fill="white" fillOpacity="0.14"/>
              </svg>
              {/* Wave 2 — slow, more opaque */}
              <svg className="db-wave db-wave-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 80" preserveAspectRatio="none">
                <path d="M0,55 C360,10 720,75 1080,35 C1260,15 1440,55 1440,55 C1800,10 2160,75 2520,35 C2700,15 2880,55 2880,55 L2880,80 L0,80 Z" fill="white" fillOpacity="0.22"/>
              </svg>
              {/* Wave 3 — solid page-colour fill, static */}
              <svg className="db-wave db-wave-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 60" preserveAspectRatio="none">
                <path d="M0,35 C200,65 500,5 720,35 C940,65 1140,10 1440,30 L1440,60 L0,60 Z" fill="#fffaf0"/>
              </svg>
            </div>
          </header>

          <div className="container db-content">
            <p className="claim">Most popular New Jersey shore destinations exceed a typical student travel budget unless the trip length is short or lodging costs are shared.</p>

            <section className="data-freshness" aria-live="polite">
              <p>
                <strong>Data refreshed:</strong> {DATA_METADATA.refreshedOn} · <strong>Displayed:</strong> {DATA_METADATA.displayedAsOf}
              </p>
              <p>{DATA_METADATA.confidenceNote}</p>
              <button
                type="button"
                className="data-freshness-btn"
                onClick={() => setShowMethodology(v => !v)}
              >
                {showMethodology ? 'Hide calculation details' : 'How estimates are calculated'}
              </button>
              {showMethodology && (
                <p className="data-methodology">
                  {DATA_METADATA.methodology} Estimate band shown in tooltips is +/-{Math.round(DATA_METADATA.estimateBandPct * 100)}%.
                </p>
              )}
            </section>

            <Suspense fallback={<div className="chart">Loading dashboard modules...</div>}>
              <Controls controls={controls} onChange={handleControlsChange} affordableCount={affordableDestinations.length} />

              <AnnotationCallout
                cheapest={cheapestAffordable}
                mostExpensive={mostExpensiveAffordable}
                controls={controls}
                data={enrichedData}
              />




              <ErrorBoundary fallback={<div className="chart">Could not load cost chart.</div>}>
                <DestinationCostChart
                  data={enrichedData}
                  selectedDestination={selectedDestination}
                  onSelectDestination={(dest) => setSelectedDestination(dest)}
                />
              </ErrorBoundary>

              <ErrorBoundary fallback={<div className="chart">Could not load breakdown chart.</div>}>
                <CostBreakdown data={enrichedData} selectedDestination={selectedDestination} onSelectDestination={(dest) => setSelectedDestination(dest)} controls={controls} />
              </ErrorBoundary>

              <ErrorBoundary fallback={<div className="chart">Could not load destination details.</div>}>
                <DestinationInfo selectedDestination={selectedDestination} data={enrichedData} />
              </ErrorBoundary>

              <ErrorBoundary fallback={<div className="chart">Could not load distance chart.</div>}>
                <DistanceScatter data={enrichedData} selectedDestination={selectedDestination} />
              </ErrorBoundary>

              <StoryText />
            </Suspense>
          </div>

        </div>
      )}

      <ChatBot />
    </>
  );
};

export default App;