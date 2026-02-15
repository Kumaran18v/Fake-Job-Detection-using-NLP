'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

function Counter({ end, label, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        color: 'var(--off-white)',
        lineHeight: 1,
      }}>
        {count.toLocaleString()}{label === 'ACCURACY' ? '%' : '+'}
      </div>
      <div className="mono" style={{ marginTop: 8 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(true), []);

  return (
    <>
      {/* ═══ HERO SECTION — Video Background ═══ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Video BG */}
        <div className="video-bg-container">
          <video autoPlay muted loop playsInline>
            <source src="/videos/hero-bg.mp4" type="video/mp4" />
          </video>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(30,29,27,0.85) 0%, rgba(30,29,27,0.7) 50%, rgba(30,29,27,0.95) 100%)',
            zIndex: 1,
          }} />
        </div>

        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 1000,
          margin: '0 auto',
          padding: '120px 40px 80px',
        }}>
          {/* Mono eyebrow */}
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.15em',
            color: 'var(--red)',
            marginBottom: 24,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(10px)',
            transition: 'all 0.6s ease 0.2s',
          }}>
            ■ FRAUD DETECTION SYSTEM // ACTIVE
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            lineHeight: 0.9,
            color: 'var(--off-white)',
            marginBottom: 32,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.4s',
          }}>
            EVERY FAKE JOB<br />
            <span style={{ color: 'var(--red)' }}>EXPOSED.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            fontWeight: 300,
            lineHeight: 1.6,
            color: 'var(--bone-dim)',
            maxWidth: 520,
            marginBottom: 48,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(15px)',
            transition: 'all 0.8s ease 0.6s',
          }}>
            AI-powered analysis that detects scam patterns, fraudulent language,
            and deceptive recruitment tactics in seconds. Stop wasting time on jobs that don't exist.
          </p>

          {/* CTA */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'none' : 'translateY(15px)',
            transition: 'all 0.8s ease 0.8s',
          }}>
            <Link href="/analyze" className="btn-primary" style={{ textDecoration: 'none' }}>
              ANALYZE A JOB POST
            </Link>
            <span className="mono" style={{ color: 'var(--bone-muted)' }}>—</span>
            <span className="mono">FREE • INSTANT • NO SIGNUP REQUIRED</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <span className="mono" style={{ fontSize: '0.65rem' }}>SCROLL</span>
          <div style={{
            width: 1,
            height: 40,
            background: 'linear-gradient(to bottom, var(--bone-muted), transparent)',
          }} />
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section style={{
        borderTop: '1px solid var(--charcoal-lighter)',
        borderBottom: '1px solid var(--charcoal-lighter)',
        padding: '60px 40px',
        background: 'var(--charcoal)',
      }}>
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 40,
        }}>
          <Counter end={97} label="ACCURACY" />
          <Counter end={50000} label="JOBS ANALYZED" />
          <Counter end={12000} label="SCAMS CAUGHT" />
          <Counter end={3} label="ML MODELS" />
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{
        padding: '120px 40px',
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <div className="mono" style={{ color: 'var(--red)', marginBottom: 16 }}>
          ■ PROCESS
        </div>
        <h2 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          marginBottom: 80,
          color: 'var(--off-white)',
        }}>
          HOW JOBCHECK<br />DETECTS FRAUD
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          background: 'var(--charcoal-lighter)',
        }}>
          {[
            {
              step: '01',
              title: 'SUBMIT',
              desc: 'Paste any job description. We accept text from job boards, emails, WhatsApp messages — any format.',
            },
            {
              step: '02',
              title: 'ANALYZE',
              desc: 'Our NLP engine extracts 40+ scam signals: urgency language, vague requirements, financial red flags, identity patterns.',
            },
            {
              step: '03',
              title: 'VERDICT',
              desc: 'Get an instant classification with confidence score. Flagged scam patterns are highlighted with explanations.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{
              background: 'var(--charcoal-warm)',
              padding: '48px 36px',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '3rem',
                color: 'var(--charcoal-lighter)',
                marginBottom: 20,
              }}>
                {step}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                marginBottom: 16,
                color: 'var(--off-white)',
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                fontWeight: 300,
                lineHeight: 1.7,
                color: 'var(--bone-muted)',
              }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ WHAT WE DETECT ═══ */}
      <section style={{
        padding: '100px 40px',
        background: 'var(--charcoal)',
        borderTop: '1px solid var(--charcoal-lighter)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="mono" style={{ color: 'var(--red)', marginBottom: 16 }}>
            ■ THREAT MODEL
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            marginBottom: 60,
            color: 'var(--off-white)',
          }}>
            SCAM PATTERNS<br />WE IDENTIFY
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            background: 'var(--charcoal-lighter)',
          }}>
            {[
              { signal: 'ADVANCE FEE SCHEMES', tag: 'FINANCIAL', desc: 'Jobs requiring upfront payment for training, equipment, or "processing fees"' },
              { signal: 'IDENTITY HARVESTING', tag: 'DATA THEFT', desc: 'Requests for SSN, bank details, or ID photos before any interview' },
              { signal: 'URGENCY MANIPULATION', tag: 'PSYCHOLOGICAL', desc: '"Limited spots", "Act now", "Expires today" — pressure tactics to bypass judgment' },
              { signal: 'VAGUE REQUIREMENTS', tag: 'STRUCTURAL', desc: 'No specific qualifications, experience, or skills needed — too-good-to-be-true roles' },
            ].map(({ signal, tag, desc }) => (
              <div key={signal} style={{
                background: 'var(--charcoal-warm)',
                padding: '40px 36px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="tag-red">{tag}</span>
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  color: 'var(--off-white)',
                }}>
                  {signal}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  fontWeight: 300,
                  lineHeight: 1.6,
                  color: 'var(--bone-muted)',
                }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{
        padding: '120px 40px',
        textAlign: 'center',
        borderTop: '1px solid var(--charcoal-lighter)',
      }}>
        <h2 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          color: 'var(--off-white)',
          marginBottom: 24,
        }}>
          DON'T APPLY<br />
          <span style={{ color: 'var(--red)' }}>BLINDLY.</span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '1.05rem',
          color: 'var(--bone-muted)',
          maxWidth: 500,
          margin: '0 auto 48px',
          lineHeight: 1.6,
        }}>
          Copy. Paste. Know the truth in seconds.
        </p>
        <Link href="/analyze" className="btn-danger" style={{ textDecoration: 'none', display: 'inline-block' }}>
          SCAN A JOB NOW
        </Link>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: '40px',
        borderTop: '1px solid var(--charcoal-lighter)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span className="mono" style={{ fontSize: '0.65rem' }}>
          © 2026 JOBCHECK — FRAUD DETECTION SYSTEM
        </span>
        <span className="mono" style={{ fontSize: '0.65rem' }}>
          BUILT WITH CONVICTION, NOT VENTURE CAPITAL
        </span>
      </footer>
    </>
  );
}
