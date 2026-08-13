"use client";

import { useEffect, useRef, useState } from "react";
import { artist, socials, collecting, works, type Work } from "./site";

/* Build a friendly mailto for inquiring about a specific piece. */
function inquireHref(work?: Work) {
  const subject = work
    ? `About "${work.title}"`
    : "Hello from your site";
  const body = work
    ? `Hi Emma,\n\nI came across "${work.title}" (${work.year}, ${work.medium}) and I'd love to know more — availability, price, and how it would ship.\n\nThank you,\n`
    : `Hi Emma,\n\nI just spent some time with your work and wanted to reach out.\n\n`;
  return `mailto:${artist.email}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

/* Fade-up on scroll. */
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".emma-reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function EmmaCatherinePage() {
  const [active, setActive] = useState<Work | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll + allow Escape to close the lightbox.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  const price = (w: Work) =>
    collecting.showPrices && w.price ? (w.available ? w.price : "Sold") : "";

  const onSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const value = emailRef.current?.value?.trim();
    if (!value) return;
    // No backend required: opens a pre-addressed note. Swap this for a
    // Mailchimp/Buttondown/Formspree endpoint whenever you're ready.
    window.location.href = `mailto:${artist.email}?subject=${encodeURIComponent(
      "Keep me posted"
    )}&body=${encodeURIComponent(
      `Please add me to your list — I'd love to see new work.\n\nMy email: ${value}\n`
    )}`;
    setEmailed(true);
  };

  return (
    <>
      <header className="emma-header" data-scrolled={scrolled}>
        <a href="#top" className="emma-wordmark emma-display">
          {artist.wordmark}
        </a>
        <nav className="emma-nav">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#collect">Collect</a>
          <a href="#follow">Follow</a>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="emma-hero emma-wrap">
          <p className="emma-eyebrow emma-reveal">Original art &middot; one of one</p>
          <h1 className="emma-display emma-reveal">{artist.name}</h1>
          <p className="emma-tagline emma-reveal">{artist.tagline}</p>
        </section>

        {/* Gallery */}
        <section id="work" className="emma-wrap emma-section" style={{ paddingTop: 0 }}>
          <div className="emma-gallery">
            {works.map((w) => (
              <button
                key={w.id}
                className="emma-piece emma-reveal"
                onClick={() => setActive(w)}
                aria-label={`View ${w.title}`}
              >
                <span className="emma-piece-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.image} alt={w.title} loading="lazy" />
                  {!w.available && <span className="emma-piece-sold">Collected</span>}
                </span>
                <span className="emma-piece-meta">
                  <span>
                    <span className="t emma-display">{w.title}</span>
                    <br />
                    <span className="m">
                      {w.medium} &middot; {w.year}
                    </span>
                  </span>
                  {price(w) && <span className="emma-piece-price">{price(w)}</span>}
                </span>
              </button>
            ))}
          </div>
        </section>

        <hr className="emma-rule" />

        {/* About */}
        <section id="about" className="emma-wrap emma-section">
          <div className="emma-two-col">
            <div className="emma-reveal">
              <p className="emma-eyebrow">The hand behind it</p>
              <h2 className="emma-display">A note from Emma</h2>
            </div>
            <div className="emma-prose emma-reveal">
              {artist.statement.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {artist.location && (
                <p style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
                  Working from {artist.location}.
                </p>
              )}
            </div>
          </div>
        </section>

        <hr className="emma-rule" />

        {/* Collect */}
        <section id="collect" className="emma-wrap emma-section">
          <div className="emma-two-col">
            <div className="emma-reveal">
              <p className="emma-eyebrow">No cart, no pressure</p>
              <h2 className="emma-display">{collecting.heading}</h2>
            </div>
            <div className="emma-reveal">
              <div className="emma-prose">
                <p>{collecting.body}</p>
              </div>
              <a className="emma-btn emma-btn--solid" href={inquireHref()}>
                Start a note
              </a>
            </div>
          </div>
        </section>

        <hr className="emma-rule" />

        {/* Follow + signup */}
        <section id="follow" className="emma-wrap emma-section">
          <div className="emma-two-col">
            <div className="emma-reveal">
              <p className="emma-eyebrow">Mostly, come look</p>
              <h2 className="emma-display">Follow the work</h2>
              <div className="emma-prose">
                <p>
                  New pieces show up here first, then everywhere else. Follow
                  along — no obligation, just the work as it comes.
                </p>
              </div>
            </div>
            <div className="emma-reveal">
              <div className="emma-socials">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    className="emma-social"
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="l">{s.label}</span>
                    <span className="h emma-display">{s.handle}</span>
                  </a>
                ))}
              </div>

              <div style={{ marginTop: "2rem" }}>
                <p className="emma-eyebrow" style={{ marginBottom: "0.75rem" }}>
                  Or get a quiet heads-up on new work
                </p>
                {emailed ? (
                  <p className="emma-prose" style={{ margin: 0 }}>
                    <span style={{ color: "var(--clay)" }}>Thank you.</span> Your
                    note is on its way.
                  </p>
                ) : (
                  <form className="emma-signup" onSubmit={onSignup}>
                    <input
                      ref={emailRef}
                      type="email"
                      required
                      placeholder="your@email.com"
                      aria-label="Email address"
                    />
                    <button className="emma-btn" type="submit">
                      Keep me posted
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="emma-footer emma-wrap">
          <span className="emma-display" style={{ fontSize: "1.05rem", color: "var(--ink)" }}>
            {artist.wordmark}
          </span>
          <span>
            &copy; {new Date().getFullYear()} {artist.name}. All work is the
            artist&apos;s own.
          </span>
        </footer>
      </main>

      {/* Lightbox */}
      {active && (
        <div
          className="emma-lightbox"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <button className="emma-lightbox-close" onClick={() => setActive(null)}>
            Close &times;
          </button>
          <div
            className="emma-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.image} alt={active.title} />
            <div className="emma-lightbox-meta">
              <p className="emma-eyebrow">
                {active.available ? "Available" : "Collected"}
              </p>
              <h3>{active.title}</h3>
              <dl>
                <dt>Year</dt>
                <dd>{active.year}</dd>
                <dt>Medium</dt>
                <dd>{active.medium}</dd>
                <dt>Size</dt>
                <dd>{active.size}</dd>
                {collecting.showPrices && active.price && (
                  <>
                    <dt>Price</dt>
                    <dd>{active.available ? active.price : "Sold"}</dd>
                  </>
                )}
              </dl>
              {active.note && (
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1.1rem" }}>
                  {active.note}
                </p>
              )}
              {active.available ? (
                <a className="emma-btn emma-btn--solid" href={inquireHref(active)}>
                  {collecting.inquireLabel}
                </a>
              ) : (
                <a className="emma-btn" href={inquireHref()}>
                  Commission something similar
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
