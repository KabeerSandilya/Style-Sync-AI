"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

const MARQUEE_ITEMS = [
  "Curate", "Discover", "Wear", "Style", "Repeat",
  "Create", "Express", "Refine", "Archive", "Dress",
  "Curate", "Discover", "Wear", "Style", "Repeat",
  "Create", "Express", "Refine", "Archive", "Dress",
];

const FEATURES = [
  {
    number: "01",
    tag: "AI Vision",
    title: "Your wardrobe,\ndigitised.",
    body: "Upload your garments and our AI reads material, season, style, and colour for each piece, turning your closet into a searchable inventory.",
  },
  {
    number: "02",
    tag: "Weather Intelligence",
    title: "Dressed for\nthe moment.",
    body: "StyleSync checks the forecast against your wardrobe and suggests outfits that actually fit the day.",
  },
  {
    number: "03",
    tag: "Wardrobe Analytics",
    title: "Dress with\nintention.",
    body: "See what you actually wear versus what just sits there, then use it to build a wardrobe you'll reach for.",
  },
];

interface LandingPageProps {
  isSignedIn?: boolean;
}

export function LandingPage({ isSignedIn = false }: LandingPageProps) {

/* ── Scroll reveal ─────────────────────────────────────────── */
  React.useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ?? "0s";
            el.style.transitionDelay = delay;
            el.classList.add("lp-revealed");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      // Only hide elements that are below the fold on load
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) el.classList.add("lp-pending");
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <>

      <div className="lp-root">

        {/* ── NAV ─────────────────────────────────────────────────── */}
        <nav className="lp-nav">
          <div className="lp-nav-left">
            <a href="#features" className="lp-nav-link">Features</a>
            <a href="#how" className="lp-nav-link">How It Works</a>
          </div>

          <Link href="/" className="lp-nav-wordmark">
            StyleSync AI
          </Link>

          <div className="lp-nav-right">
            {isSignedIn ? (
              <Link href="/editor" className="lp-nav-cta">
                Enter Wardrobe <ArrowUpRight className="lp-icon-sm" />
              </Link>
            ) : (
              <Link href="/sign-up" className="lp-nav-cta">
                Start Styling <ArrowUpRight className="lp-icon-sm" />
              </Link>
            )}
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────── */}
        <section className="lp-hero">
          {/* Decorative horizontal rule — slides in from left */}
          <div className="lp-hero-rule" aria-hidden />

          {/* Corner indices */}
          <span className="lp-corner lp-corner--tl animate-enter-1">SS.AI</span>
          <span className="lp-corner lp-corner--br animate-enter-1">001</span>

          <div className="lp-hero-inner">
            {/* Eyebrow */}
            <p className="lp-eyebrow animate-enter-1">
              <Sparkles className="lp-spark" aria-hidden />
              <span>AI‑Powered Wardrobe Intelligence</span>
            </p>

            {/* Headline — each line clips-and-reveals */}
            <h1 className="lp-headline" aria-label="Your wardrobe, intelligently curated.">
              <span className="lp-line-wrap">
                <span className="lp-line animate-enter-2">Your wardrobe,</span>
              </span>
              <span className="lp-line-wrap">
                <span className="lp-line lp-line--accent animate-enter-3">
                  intelligently
                </span>
              </span>
              <span className="lp-line-wrap">
                <span className="lp-line animate-enter-4">curated.</span>
              </span>
            </h1>

            {/* Sub */}
            <p className="lp-sub animate-enter-5">
              StyleSync AI keeps a digital inventory of your wardrobe and checks
              real‑time weather data to suggest what to wear each day.
            </p>

            {/* Actions */}
            <div className="lp-actions animate-enter-5">
              {isSignedIn ? (
                <Link href="/editor" className="lp-cta-primary">
                  Enter Wardrobe <ArrowRight className="lp-icon" />
                </Link>
              ) : (
                <>
                  <Link href="/sign-up" className="lp-cta-primary">
                    Begin Your Wardrobe <ArrowRight className="lp-icon" />
                  </Link>
                  <Link href="/sign-in" className="lp-cta-ghost">
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Vertical editorial line */}
          <div className="lp-hero-vline animate-enter-2" aria-hidden />
        </section>

        {/* ── MARQUEE ─────────────────────────────────────────────── */}
        <div className="lp-marquee-wrap" aria-hidden>
          <div className="lp-marquee-track">
            {MARQUEE_ITEMS.map((word, i) => (
              <React.Fragment key={i}>
                <span className="lp-marquee-word">{word}</span>
                <span className="lp-marquee-sep">—</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <section id="features" className="lp-features">
          <div className="lp-features-inner">
            {FEATURES.map((f, i) => (
              <article
                key={f.number}
                className="lp-feature"
                data-reveal
                data-delay={`${i * 0.1}s`}
              >
                <span className="lp-feature-num" aria-hidden>{f.number}</span>
                <div className="lp-feature-body">
                  <span className="lp-feature-tag">{f.tag}</span>
                  <h2 className="lp-feature-title">{f.title}</h2>
                  <p className="lp-feature-text">{f.body}</p>
                </div>
                <div className="lp-feature-divider" aria-hidden />
              </article>
            ))}
          </div>
        </section>

        {/* ── STATS BAND ──────────────────────────────────────────── */}
        <section className="lp-stats" data-reveal>
          <blockquote className="lp-stats-quote">
            "The average wardrobe holds 77 items.{" "}
            <em>Most people wear 20% of them.</em>"
          </blockquote>
        </section>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <section id="how" className="lp-how">
          <header className="lp-how-header" data-reveal>
            <h2 className="lp-how-title">
              Three steps to<br /><em>styling clarity.</em>
            </h2>
          </header>

          <div className="lp-steps">
            {[
              {
                num: "01",
                title: "Upload",
                desc: "Photograph your garments. Our AI tags material, season, style, and colour for each piece in seconds.",
              },
              {
                num: "02",
                title: "Connect",
                desc: "StyleSync connects your inventory to live weather data and the style preferences you've saved.",
              },
              {
                num: "03",
                title: "Wear",
                desc: "Get an outfit suggestion each morning, picked for that day's weather.",
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="lp-step"
                data-reveal
                data-delay={`${i * 0.15}s`}
              >
                <span className="lp-step-num" aria-hidden>{step.num}</span>
                <h3 className="lp-step-title">{step.title}</h3>
                <p className="lp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ───────────────────────────────────────────── */}
        <section className="lp-final" data-reveal>
          <h2 className="lp-final-headline">
            Dress with<br /><em>intention.</em>
          </h2>
          <p className="lp-final-sub">
            Start building your wardrobe today.
          </p>
          <Link href={isSignedIn ? "/editor" : "/sign-up"} className="lp-final-btn">
            {isSignedIn ? "Enter Wardrobe" : "Create Your Wardrobe"} <ArrowRight className="lp-icon" />
          </Link>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <footer className="lp-footer">
          <span className="lp-footer-wordmark">StyleSync AI</span>
          <div className="lp-footer-links">
            {isSignedIn ? (
              <Link href="/editor" className="lp-footer-link">Enter Wardrobe</Link>
            ) : (
              <Link href="/sign-up" className="lp-footer-link">Start Styling</Link>
            )}
          </div>
          <span className="lp-footer-copy">© 2026 StyleSync AI</span>
        </footer>
      </div>

      {/* ── STYLES ──────────────────────────────────────────────── */}
      <style>{`
        /* ─── RESET & ROOT ────────────────────────────────────── */
        .lp-root {
          --lp-bg:     #faf6f0;
          --lp-fg:     #1c1917;
          --lp-sage:   #708272;
          --lp-border: #ebdcd0;
          --lp-muted:  #5e5854;
          --lp-card:   #fffefb;
          --lp-dark:   #121210;
          --lp-cream:  #fcfbf9;
          --lp-serif:  var(--font-serif), 'Cormorant Garamond', Georgia, serif;
          --lp-sans:   var(--font-sans), system-ui, sans-serif;
          background: var(--lp-bg);
          color: var(--lp-fg);
          min-height: 100svh;
          overflow-x: hidden;
        }


        /* ─── SCROLL REVEAL ───────────────────────────────────── */
        /* Content visible by default; JS adds lp-pending only to below-fold elements */
        [data-reveal] {
          transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
        [data-reveal].lp-pending {
          opacity: 0;
          transform: translateY(22px);
        }
        [data-reveal].lp-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── NAV ─────────────────────────────────────────────── */
        .lp-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 60px;
          border-bottom: 1px solid var(--lp-border);
          background: color-mix(in srgb, var(--lp-bg) 88%, transparent);
          backdrop-filter: blur(14px);
        }
        .lp-nav-left,
        .lp-nav-right {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex: 1;
        }
        .lp-nav-right { justify-content: flex-end; }
        .lp-nav-link {
          font-family: var(--lp-sans);
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--lp-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-nav-link:hover { color: var(--lp-fg); }
        .lp-nav-wordmark {
          font-family: var(--lp-serif);
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--lp-fg);
          text-decoration: none;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .lp-nav-wordmark:hover { color: var(--lp-sage); }
        @media (min-width: 768px) {
          .lp-nav-wordmark { font-size: 1.25rem; }
        }
        .lp-nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-family: var(--lp-sans);
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--lp-bg);
          background: var(--lp-fg);
          padding: 0.45rem 0.9rem;
          text-decoration: none;
          transition: background 0.22s;
        }
        .lp-nav-cta:hover { background: var(--lp-sage); }
        .lp-icon-sm { width: 11px; height: 11px; }

        /* ─── HERO ────────────────────────────────────────────── */
        .lp-hero {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 8rem 2.5rem 5rem;
          position: relative;
          overflow: hidden;
        }

        /* Horizontal rule slides in */
        .lp-hero-rule {
          position: absolute;
          top: 50%;
          left: 0; right: 0;
          height: 1px;
          background: var(--lp-border);
          transform: scaleX(0);
          transform-origin: left;
          animation: lpRuleSlide 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
          pointer-events: none;
        }
        @keyframes lpRuleSlide {
          to { transform: scaleX(1); }
        }

        /* Vertical editorial line on right */
        .lp-hero-vline {
          position: absolute;
          top: 60px; bottom: 0;
          right: 5rem;
          width: 1px;
          background: var(--lp-border);
          transform: scaleY(0);
          transform-origin: top;
          animation: lpVlineSlide 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s forwards;
          pointer-events: none;
        }
        @keyframes lpVlineSlide {
          to { transform: scaleY(1); }
        }

        /* Corner indices */
        .lp-corner {
          position: absolute;
          font-family: var(--lp-sans);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          color: var(--lp-muted);
          opacity: 0.45;
          text-transform: uppercase;
          pointer-events: none;
        }
        .lp-corner--tl { top: 1.25rem; left: 2.5rem; }
        .lp-corner--br { bottom: 2rem; right: 2.5rem; }

        .lp-hero-inner {
          max-width: 80rem;
          margin: 0 auto;
          width: 100%;
          position: relative;
          z-index: 2;
        }

        .lp-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--lp-sans);
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--lp-sage);
          margin-bottom: 2.5rem;
        }
        .lp-spark { width: 13px; height: 13px; }

        /* Each line clips — inner span animates up from below */
        .lp-line-wrap {
          display: block;
          overflow: hidden;
          line-height: 1.05;
        }
        .lp-headline {
          font-family: var(--lp-serif);
          font-size: clamp(3.8rem, 9.5vw, 8.5rem);
          font-weight: 400;
          line-height: 1.0;
          letter-spacing: -0.01em;
          color: var(--lp-fg);
          margin: 0 0 2.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.05em;
        }
        .lp-line {
          display: block;
          animation: lpLineReveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .lp-line--accent {
          font-style: italic;
          font-weight: 300;
          color: var(--lp-sage);
          padding-left: clamp(2.5rem, 7vw, 7rem);
          animation-delay: 0.12s;
        }
        @keyframes lpLineReveal {
          from { transform: translateY(105%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        /* stagger the third line */
        .lp-line-wrap:nth-child(3) .lp-line { animation-delay: 0.24s; }

        .lp-sub {
          font-family: var(--lp-sans);
          font-size: 0.9rem;
          line-height: 1.8;
          color: var(--lp-muted);
          max-width: 46ch;
          margin-bottom: 3rem;
        }

        .lp-actions {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .lp-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--lp-sans);
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--lp-bg);
          background: var(--lp-fg);
          padding: 1rem 2.25rem;
          text-decoration: none;
          box-shadow: 0 4px 28px rgba(28,25,23,0.16);
          transition: background 0.25s, letter-spacing 0.35s, box-shadow 0.25s;
        }
        .lp-cta-primary:hover {
          background: var(--lp-sage);
          letter-spacing: 0.22em;
          box-shadow: 0 8px 36px rgba(112,130,114,0.3);
        }
        .lp-icon { width: 14px; height: 14px; }
        .lp-cta-ghost {
          font-family: var(--lp-sans);
          font-size: 0.68rem;
          font-weight: 500;
          color: var(--lp-muted);
          text-decoration: underline;
          text-underline-offset: 4px;
          text-decoration-color: var(--lp-border);
          transition: color 0.2s, text-decoration-color 0.2s;
        }
        .lp-cta-ghost:hover {
          color: var(--lp-fg);
          text-decoration-color: var(--lp-fg);
        }

        /* ─── MARQUEE ─────────────────────────────────────────── */
        .lp-marquee-wrap {
          border-top: 1px solid var(--lp-border);
          border-bottom: 1px solid var(--lp-border);
          overflow: hidden;
          padding: 1rem 0;
          background: var(--lp-card);
        }
        .lp-marquee-track {
          display: inline-flex;
          align-items: center;
          gap: 1.25rem;
          animation: lpMarquee 32s linear infinite;
          white-space: nowrap;
        }
        .lp-marquee-wrap:hover .lp-marquee-track {
          animation-play-state: paused;
        }
        @keyframes lpMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .lp-marquee-word {
          font-family: var(--lp-serif);
          font-size: 0.95rem;
          font-style: italic;
          font-weight: 400;
          color: var(--lp-fg);
          letter-spacing: 0.03em;
        }
        .lp-marquee-sep {
          font-family: var(--lp-serif);
          font-size: 0.75rem;
          color: var(--lp-sage);
          opacity: 0.6;
        }

        /* ─── FEATURES ────────────────────────────────────────── */
        .lp-features {
          padding: 6rem 0;
          background: var(--lp-bg);
        }
        .lp-features-inner {
          max-width: 80rem;
          margin: 0 auto;
          padding: 0 2.5rem;
        }
        .lp-feature {
          display: grid;
          grid-template-columns: 5.5rem 1fr 1px;
          align-items: start;
          gap: 3.5rem;
          padding: 4.5rem 0;
          border-top: 1px solid var(--lp-border);
          position: relative;
          transition: background 0.35s;
          cursor: default;
        }
        .lp-feature:last-child { border-bottom: 1px solid var(--lp-border); }
        .lp-feature:hover { background: color-mix(in srgb, var(--lp-card) 80%, transparent); }
        .lp-feature-num {
          font-family: var(--lp-serif);
          font-size: 3.5rem;
          font-weight: 300;
          color: var(--lp-sage);
          opacity: 0.35;
          line-height: 1;
          letter-spacing: -0.02em;
          padding-top: 0.25rem;
          transition: opacity 0.3s;
        }
        .lp-feature:hover .lp-feature-num { opacity: 0.6; }
        .lp-feature-body {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .lp-feature-tag {
          font-family: var(--lp-sans);
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--lp-sage);
        }
        .lp-feature-title {
          font-family: var(--lp-serif);
          font-size: clamp(2rem, 4vw, 3.4rem);
          font-weight: 400;
          line-height: 1.1;
          color: var(--lp-fg);
          white-space: pre-line;
          margin: 0;
        }
        .lp-feature-text {
          font-family: var(--lp-sans);
          font-size: 0.875rem;
          line-height: 1.8;
          color: var(--lp-muted);
          max-width: 48ch;
        }
        .lp-feature-divider {
          width: 1px;
          background: var(--lp-border);
          align-self: stretch;
          opacity: 0;
          transition: opacity 0.35s;
        }
        .lp-feature:hover .lp-feature-divider { opacity: 1; }

        /* ─── STATS BAND ──────────────────────────────────────── */
        .lp-stats {
          background: var(--lp-fg);
          padding: 7rem 2.5rem;
          text-align: center;
        }
        .lp-stats-quote {
          font-family: var(--lp-serif);
          font-size: clamp(1.6rem, 4vw, 3.2rem);
          font-weight: 300;
          line-height: 1.4;
          color: rgba(252, 251, 249, 0.72);
          margin: 0 auto;
          max-width: 34ch;
        }
        .lp-stats-quote em {
          font-style: italic;
          color: #fcfbf9;
        }

        /* ─── HOW IT WORKS ────────────────────────────────────── */
        .lp-how {
          max-width: 80rem;
          margin: 0 auto;
          padding: 7rem 2.5rem;
        }
        .lp-how-header { margin-bottom: 5rem; }
        .lp-section-tag {
          display: block;
          font-family: var(--lp-sans);
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: var(--lp-sage);
          margin-bottom: 1.5rem;
        }
        .lp-how-title {
          font-family: var(--lp-serif);
          font-size: clamp(2.5rem, 5.5vw, 4.8rem);
          font-weight: 400;
          line-height: 1.08;
          color: var(--lp-fg);
          margin: 0;
        }
        .lp-how-title em {
          font-style: italic;
          font-weight: 300;
          color: var(--lp-sage);
        }
        .lp-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--lp-border);
        }
        .lp-step {
          background: var(--lp-bg);
          padding: 3.5rem 2.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          transition: background 0.3s;
        }
        .lp-step:hover { background: var(--lp-card); }
        .lp-step-num {
          font-family: var(--lp-serif);
          font-size: 2.2rem;
          font-weight: 300;
          color: var(--lp-sage);
          opacity: 0.4;
          line-height: 1;
        }
        .lp-step-title {
          font-family: var(--lp-serif);
          font-size: 1.75rem;
          font-weight: 400;
          color: var(--lp-fg);
          line-height: 1.2;
          margin: 0;
        }
        .lp-step-desc {
          font-family: var(--lp-sans);
          font-size: 0.875rem;
          line-height: 1.8;
          color: var(--lp-muted);
        }

        /* ─── FINAL CTA ───────────────────────────────────────── */
        .lp-final {
          background: var(--lp-dark);
          padding: 10rem 2.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        .lp-final-tag {
          font-family: var(--lp-sans);
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.24em;
          color: var(--lp-sage);
        }
        .lp-final-headline {
          font-family: var(--lp-serif);
          font-size: clamp(4rem, 10vw, 9rem);
          font-weight: 400;
          line-height: 1.0;
          color: var(--lp-cream);
          margin: 0;
        }
        .lp-final-headline em {
          font-style: italic;
          font-weight: 300;
          color: var(--lp-sage);
        }
        .lp-final-sub {
          font-family: var(--lp-sans);
          font-size: 0.875rem;
          color: #a8a29e;
          letter-spacing: 0.04em;
        }
        .lp-final-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--lp-sans);
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: var(--lp-dark);
          background: var(--lp-cream);
          padding: 1rem 2.5rem;
          text-decoration: none;
          margin-top: 1rem;
          transition: background 0.25s, color 0.25s, letter-spacing 0.35s;
        }
        .lp-final-btn:hover {
          background: var(--lp-sage);
          color: var(--lp-cream);
          letter-spacing: 0.22em;
        }

        /* ─── FOOTER ──────────────────────────────────────────── */
        .lp-footer {
          border-top: 1px solid var(--lp-border);
          padding: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--lp-bg);
          flex-wrap: wrap;
          gap: 1rem;
        }
        .lp-footer-wordmark {
          font-family: var(--lp-serif);
          font-size: 0.9rem;
          font-weight: 300;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--lp-fg);
        }
        .lp-footer-links {
          display: flex;
          gap: 2.5rem;
        }
        .lp-footer-link {
          font-family: var(--lp-sans);
          font-size: 0.62rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--lp-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-footer-link:hover { color: var(--lp-fg); }
        .lp-footer-copy {
          font-family: var(--lp-sans);
          font-size: 0.62rem;
          color: var(--lp-muted);
          opacity: 0.6;
        }

        /* ─── RESPONSIVE ──────────────────────────────────────── */
        @media (max-width: 768px) {
          .lp-nav { padding: 0 1.25rem; }
          .lp-nav-left { display: none; }

          .lp-hero { padding: 6.5rem 1.25rem 4rem; }
          .lp-hero-vline { display: none; }
          .lp-corner--br { display: none; }

          .lp-feature {
            grid-template-columns: 4rem 1fr;
            gap: 1.5rem;
          }
          .lp-feature-divider { display: none; }

          .lp-stats { padding: 5rem 1.25rem; }

          .lp-how { padding: 5rem 1.25rem; }
          .lp-steps { grid-template-columns: 1fr; }

          .lp-final { padding: 7rem 1.25rem; }

          .lp-footer {
            padding: 1.75rem 1.25rem;
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* ─── TOUCH DEVICES ───────────────────────────────────── */

        /* ─── REDUCED MOTION ──────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          [data-reveal],
          [data-reveal].lp-pending,
          [data-reveal].lp-revealed {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .lp-marquee-track { animation: none; }
          .lp-line {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .lp-hero-rule,
          .lp-hero-vline {
            animation: none !important;
            transform: scaleX(1) !important;
          }
          .lp-hero-vline { transform: scaleY(1) !important; }
          .animate-enter-1,
          .animate-enter-2,
          .animate-enter-3,
          .animate-enter-4,
          .animate-enter-5 { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </>
  );
}
