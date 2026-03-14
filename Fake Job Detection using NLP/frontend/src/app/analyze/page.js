'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

/* ─── Utility: format ISO date ─── */
function formatLocalTime(isoString) {
    if (!isoString) return '—';
    try {
        const dateStr = isoString.endsWith('Z') || isoString.includes('+')
            ? isoString : isoString + 'Z';
        const d = new Date(dateStr);
        return d.toLocaleString('en-IN', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
        });
    } catch { return isoString; }
}

const SAMPLE_TEXTS = [
    { label: 'SUSPICIOUS POST', text: 'EARN $5000 WEEKLY from home! No experience needed! Send your bank details and SSN to get started. Pay $200 processing fee to secure your position. Limited spots - act now before it\'s too late! Contact us on WhatsApp immediately.' },
    { label: 'LEGITIMATE POST', text: 'We are looking for a Senior Software Engineer with 5+ years of experience in Python and React. You will work with a team of 12 engineers building our cloud infrastructure platform. Requirements: BS in Computer Science, experience with AWS, strong communication skills. Benefits include health insurance, 401k matching, and 20 days PTO. Apply through our careers page with your resume.' },
];

const RISK_COLORS = {
    'Financial Red Flag': { bg: '#e6394620', border: '#e63946', icon: '💰' },
    'Urgency Pressure': { bg: '#ff990020', border: '#ff9900', icon: '⚡' },
    'Identity Harvesting': { bg: '#ff006020', border: '#ff0060', icon: '🎣' },
    'Vague Description': { bg: '#a855f720', border: '#a855f7', icon: '🔍' },
    'Suspicious Pattern': { bg: '#64748b20', border: '#64748b', icon: '⚠' },
};

export default function AnalyzePage() {
    const { user, token } = useAuth();
    // ─── Single analysis state ───
    const [inputMode, setInputMode] = useState('text'); // text | url | csv | image
    const [jobText, setJobText] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [phase, setPhase] = useState('input'); // input | scanning | verdict | bulk-results
    const [result, setResult] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [myHistory, setMyHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(null);
    const [companyVerify, setCompanyVerify] = useState(null);
    const [companyLoading, setCompanyLoading] = useState(false);
    const textareaRef = useRef(null);

    // ─── Bulk CSV state ───
    const [csvFile, setCsvFile] = useState(null);
    const [bulkResults, setBulkResults] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    // ─── Image upload state ───
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => { if (token) fetchMyHistory(); }, [token]);

    const fetchMyHistory = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-predictions`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { const data = await res.json(); setMyHistory(data.predictions || []); }
        } catch (err) { console.error('Failed to fetch history:', err); }
    };

    /* ─── Single analysis (text or URL) ─── */
    const analyze = async () => {
        const isUrl = inputMode === 'url';
        const input = isUrl ? urlInput.trim() : jobText.trim();
        if (!input) return;

        setLoading(true); setPhase('scanning'); setScanProgress(0);
        setResult(null); setFeedbackGiven(null); setCompanyVerify(null);

        const scanInterval = setInterval(() => {
            setScanProgress(p => { if (p >= 95) { clearInterval(scanInterval); return 95; } return p + Math.random() * 12; });
        }, 150);

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const endpoint = isUrl ? `${process.env.NEXT_PUBLIC_API_URL}/api/predict-url` : `${process.env.NEXT_PUBLIC_API_URL}/api/predict`;
            const body = isUrl ? { url: input } : { job_text: input };

            const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Analysis failed');

            clearInterval(scanInterval); setScanProgress(100);

            setTimeout(() => {
                setResult(data); setPhase('verdict'); setLoading(false);
                if (token) fetchMyHistory();
                if (data.scraped_company) verifyCompany(data.scraped_company);
            }, 600);
        } catch (err) {
            clearInterval(scanInterval); setLoading(false); setPhase('input');
            alert(err.message);
        }
    };

    /* ─── Bulk CSV analysis ─── */
    const analyzeBulk = async () => {
        if (!csvFile || !token) return;
        setLoading(true); setPhase('scanning'); setScanProgress(0);
        setBulkResults(null);

        const scanInterval = setInterval(() => {
            setScanProgress(p => { if (p >= 95) { clearInterval(scanInterval); return 95; } return p + Math.random() * 8; });
        }, 200);

        try {
            const formData = new FormData();
            formData.append('file', csvFile);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predict-bulk`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Bulk analysis failed');

            clearInterval(scanInterval); setScanProgress(100);

            setTimeout(() => {
                setBulkResults(data); setPhase('bulk-results'); setLoading(false);
            }, 400);
        } catch (err) {
            clearInterval(scanInterval); setLoading(false); setPhase('input');
            alert(err.message);
        }
    };

    /* ─── Image OCR analysis ─── */
    const analyzeImage = async () => {
        if (!imageFile) return;
        setLoading(true); setPhase('scanning'); setScanProgress(0);
        setResult(null); setFeedbackGiven(null); setCompanyVerify(null);

        const scanInterval = setInterval(() => {
            setScanProgress(p => { if (p >= 95) { clearInterval(scanInterval); return 95; } return p + Math.random() * 10; });
        }, 180);

        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predict-image`, {
                method: 'POST', headers, body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Image analysis failed');

            clearInterval(scanInterval); setScanProgress(100);
            setTimeout(() => {
                setResult(data); setPhase('verdict'); setLoading(false);
                if (token) fetchMyHistory();
            }, 600);
        } catch (err) {
            clearInterval(scanInterval); setLoading(false); setPhase('input');
            alert(err.message);
        }
    };

    const downloadBulkCsv = async () => {
        if (!csvFile || !token) return;
        try {
            const formData = new FormData();
            formData.append('file', csvFile);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predict-bulk/download`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'bulk_results.csv'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Download failed'); }
    };

    /* ─── Company verification ─── */
    const verifyCompany = async (name) => {
        if (!name) return;
        setCompanyLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-company`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company_name: name }),
            });
            if (res.ok) setCompanyVerify(await res.json());
        } catch (err) { console.error('Company verification failed:', err); }
        finally { setCompanyLoading(false); }
    };

    /* ─── Feedback ─── */
    const submitFeedback = async (feedback) => {
        if (!result?.prediction_id || !token) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ prediction_id: result.prediction_id, feedback }),
            });
            if (res.ok) setFeedbackGiven(feedback);
        } catch (err) { console.error('Feedback failed:', err); }
    };

    const reset = () => {
        setPhase('input'); setResult(null); setBulkResults(null);
        setJobText(''); setUrlInput(''); setCsvFile(null); setImageFile(null); setImagePreview(null);
        setScanProgress(0); setFeedbackGiven(null); setCompanyVerify(null);
    };

    return (
        <div style={{ minHeight: '100vh', paddingTop: 80, background: 'var(--bg-primary)' }}>
            {/* ═══════════════ INPUT PHASE ═══════════════ */}
            {phase === 'input' && (
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 40px' }}>
                    <div className="mono" style={{ color: 'var(--danger)', marginBottom: 16 }}>■ ANALYSIS MODULE</div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                        color: 'var(--text-primary)', lineHeight: 0.95, marginBottom: 12,
                    }}>
                        SCAN ANY<br />JOB POST.
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-body)', fontWeight: 300, fontSize: '0.95rem',
                        color: 'var(--text-muted)', marginBottom: 32, maxWidth: 500, lineHeight: 1.5,
                    }}>
                        Paste text, enter a URL, or upload a CSV for batch analysis. Our NLP engine scans for scam patterns, deceptive language, and structural red flags.
                        {!user && (
                            <span style={{ display: 'block', marginTop: 8, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <a href="/login" style={{ color: 'var(--success)', textDecoration: 'none', borderBottom: '1px solid var(--success)' }}>Sign in</a> to save history and use bulk analysis.
                            </span>
                        )}
                    </p>

                    {/* ─── Input Mode Tabs ─── */}
                    <div style={{ display: 'flex', gap: 0, marginBottom: 24, border: '1px solid var(--border)', width: 'fit-content' }}>
                        {[
                            { key: 'text', label: '✎ TEXT' },
                            { key: 'url', label: '🔗 URL' },
                            { key: 'csv', label: '📊 CSV' },
                            { key: 'image', label: '📷 IMAGE' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setInputMode(tab.key)}
                                className="mono"
                                style={{
                                    padding: '10px 20px', fontSize: '0.65rem', letterSpacing: '0.08em',
                                    background: inputMode === tab.key ? 'var(--border)' : 'transparent',
                                    color: inputMode === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ─── TEXT INPUT ─── */}
                    {inputMode === 'text' && (
                        <>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                {SAMPLE_TEXTS.map(({ label, text }) => (
                                    <button key={label} onClick={() => setJobText(text)} className="btn-outline" style={{ fontSize: '0.7rem', padding: '8px 14px' }}>
                                        ↓ {label}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                ref={textareaRef} value={jobText} onChange={e => setJobText(e.target.value)}
                                placeholder="Paste job description here..."
                                style={{
                                    width: '100%', minHeight: 260, resize: 'vertical', padding: '20px',
                                    background: 'var(--bg-white)', border: '1px solid var(--border)',
                                    color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                                    fontSize: '0.95rem', lineHeight: 1.7, outline: 'none', transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--text-muted)'}
                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                <span className="mono" style={{ fontSize: '0.65rem' }}>{jobText.length} CHARACTERS</span>
                                <button onClick={analyze} className="btn-primary" disabled={!jobText.trim() || loading} style={{ minWidth: 200 }}>
                                    RUN ANALYSIS
                                </button>
                            </div>
                        </>
                    )}

                    {/* ─── URL INPUT ─── */}
                    {inputMode === 'url' && (
                        <div>
                            <p className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.06em' }}>
                                PASTE A JOB POSTING URL FROM LINKEDIN, INDEED, NAUKRI, ETC.
                            </p>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <input
                                    value={urlInput} onChange={e => setUrlInput(e.target.value)}
                                    placeholder="https://www.linkedin.com/jobs/view/..."
                                    style={{
                                        flex: 1, padding: '16px 20px', background: 'var(--bg-white)',
                                        border: '1px solid var(--border)', color: 'var(--text-primary)',
                                        fontFamily: 'var(--font-mono)', fontSize: '0.85rem', outline: 'none',
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--text-muted)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                    onKeyDown={e => e.key === 'Enter' && analyze()}
                                />
                                <button onClick={analyze} className="btn-primary" disabled={!urlInput.trim() || loading} style={{ minWidth: 160 }}>
                                    SCAN URL
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                                {['LinkedIn', 'Indeed', 'Naukri', 'Glassdoor'].map(site => (
                                    <span key={site} className="mono" style={{ fontSize: '0.55rem', padding: '4px 10px', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                                        {site.toUpperCase()}
                                    </span>
                                ))}
                                <span className="mono" style={{ fontSize: '0.55rem', padding: '4px 10px', color: 'var(--text-secondary)' }}>+ ANY JOB SITE</span>
                            </div>
                        </div>
                    )}

                    {/* ─── CSV BULK INPUT ─── */}
                    {inputMode === 'csv' && (
                        <div>
                            {!token && (
                                <div style={{ padding: '16px 20px', border: '1px solid var(--danger)', background: 'var(--red-glow)', marginBottom: 20 }}>
                                    <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>
                                        ⚠ You must <a href="/login" style={{ color: 'var(--success)', textDecoration: 'underline' }}>sign in</a> to use bulk analysis.
                                    </span>
                                </div>
                            )}
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.csv')) setCsvFile(f); }}
                                onClick={() => document.getElementById('csvInput')?.click()}
                                style={{
                                    border: `2px dashed ${dragOver ? 'var(--success)' : 'var(--border)'}`,
                                    background: dragOver ? 'var(--teal-glow)' : 'var(--bg-white)',
                                    padding: '60px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s',
                                }}
                            >
                                <input id="csvInput" type="file" accept=".csv" style={{ display: 'none' }}
                                    onChange={e => { if (e.target.files[0]) setCsvFile(e.target.files[0]); }} />
                                {csvFile ? (
                                    <>
                                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>📄</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>{csvFile.name}</div>
                                        <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{(csvFile.size / 1024).toFixed(1)} KB — CLICK TO CHANGE</div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>⬆</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            DROP CSV FILE HERE OR CLICK TO BROWSE
                                        </div>
                                        <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                                            COLUMNS: job_text / description / text — MAX 500 ROWS
                                        </div>
                                    </>
                                )}
                            </div>
                            {csvFile && (
                                <button onClick={analyzeBulk} className="btn-primary" disabled={loading || !token}
                                    style={{ width: '100%', padding: '16px', fontSize: '0.85rem', marginTop: 16 }}>
                                    {loading ? '● ANALYZING...' : `ANALYZE ${csvFile.name.toUpperCase()}`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* ─── IMAGE UPLOAD ─── */}
                    {inputMode === 'image' && (
                        <div>
                            <p className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 12, letterSpacing: '0.06em' }}>
                                UPLOAD A SCREENSHOT OF A JOB POSTING — OCR WILL EXTRACT THE TEXT
                            </p>
                            <div
                                onClick={() => document.getElementById('imageInput')?.click()}
                                style={{
                                    border: `2px dashed var(--border)`, background: 'var(--bg-white)',
                                    padding: imagePreview ? '20px' : '60px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s',
                                }}
                            >
                                <input id="imageInput" type="file" accept="image/*" style={{ display: 'none' }}
                                    onChange={e => {
                                        const f = e.target.files[0];
                                        if (f) {
                                            setImageFile(f);
                                            const reader = new FileReader();
                                            reader.onload = (ev) => setImagePreview(ev.target.result);
                                            reader.readAsDataURL(f);
                                        }
                                    }} />
                                {imagePreview ? (
                                    <div>
                                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', marginBottom: 12, opacity: 0.9 }} />
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>{imageFile?.name}</div>
                                        <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>CLICK TO CHANGE</div>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.4 }}>📷</div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            CLICK TO UPLOAD A SCREENSHOT
                                        </div>
                                        <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                                            PNG, JPEG, WEBP, BMP, TIFF — MAX 10 MB
                                        </div>
                                    </>
                                )}
                            </div>
                            {imageFile && (
                                <button onClick={analyzeImage} className="btn-primary" disabled={loading}
                                    style={{ width: '100%', padding: '16px', fontSize: '0.85rem', marginTop: 16 }}>
                                    {loading ? '● EXTRACTING TEXT...' : 'ANALYZE SCREENSHOT'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* ═══ USER HISTORY ═══ */}
                    {user && myHistory.length > 0 && (
                        <div style={{ marginTop: 56 }}>
                            <div onClick={() => setShowHistory(!showHistory)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: 16 }}>
                                <div className="mono" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--success)' }}>
                                    ■ YOUR RECENT ANALYSES ({myHistory.length})
                                </div>
                                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                    {showHistory ? '▲ HIDE' : '▼ SHOW'}
                                </span>
                            </div>
                            {showHistory && (
                                <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px 120px', borderBottom: '1px solid var(--border)', padding: '10px 16px' }}>
                                        {['JOB TEXT', 'VERDICT', 'CONF.', 'TIME'].map(h => (
                                            <div key={h} className="mono" style={{ fontSize: '0.5rem', letterSpacing: '0.1em' }}>{h}</div>
                                        ))}
                                    </div>
                                    {myHistory.map((p, i) => (
                                        <div key={p.id} style={{
                                            display: 'grid', gridTemplateColumns: '1fr 90px 70px 120px',
                                            padding: '12px 16px', borderBottom: i < myHistory.length - 1 ? '1px solid var(--border)' : 'none',
                                            transition: 'background 0.1s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{p.job_text}</div>
                                            <div><span className={p.prediction === 'Fake' ? 'tag-red' : 'tag-teal'} style={{ fontSize: '0.6rem', padding: '2px 8px' }}>{p.prediction === 'Fake' ? 'FRAUD' : 'LEGIT'}</span></div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: p.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)' }}>{p.confidence}%</div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatLocalTime(p.created_at)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════ SCANNING PHASE ═══════════════ */}
            {phase === 'scanning' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '40px' }}>
                    <div className="mono" style={{ color: 'var(--danger)', marginBottom: 32, fontSize: '0.72rem', animation: 'blink 1s infinite' }}>
                        ■ {inputMode === 'csv' ? 'BULK PROCESSING' : inputMode === 'url' ? 'SCRAPING & SCANNING' : inputMode === 'image' ? 'EXTRACTING TEXT (OCR)' : 'SCANNING IN PROGRESS'}
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--text-primary)', textAlign: 'center', marginBottom: 48 }}>
                        {inputMode === 'csv' ? <>PROCESSING<br />BATCH</> : <>ANALYZING<br />SIGNALS</>}
                    </h2>
                    <div style={{ width: '100%', maxWidth: 400, height: 2, background: 'var(--border)', marginBottom: 16, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(scanProgress, 100)}%`, background: 'var(--danger)', transition: 'width 0.1s linear' }} />
                    </div>
                    <span className="mono" style={{ fontSize: '0.65rem' }}>
                        {Math.min(Math.round(scanProgress), 100)}% — {inputMode === 'csv' ? 'ANALYZING ROWS' : inputMode === 'url' ? 'SCRAPING PAGE' : inputMode === 'image' ? 'RUNNING OCR' : 'CHECKING FRAUD VECTORS'}
                    </span>
                    <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.5 }}>
                        {(inputMode === 'csv'
                            ? ['Reading CSV rows', 'Preprocessing text', 'Running ML pipeline', 'Aggregating results', 'Building report']
                            : [inputMode === 'url' ? 'Fetching page content' : 'Language patterns', 'Financial red flags', 'Identity harvesting signals', 'Structural anomalies', 'Urgency indicators']
                        ).map((item, i) => (
                            <div key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: scanProgress > i * 20 ? 'var(--text-secondary)' : 'var(--border)', letterSpacing: '0.04em', transition: 'color 0.3s' }}>
                                {scanProgress > i * 20 ? '✓' : '○'} {item.toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══════════════ SINGLE VERDICT PHASE ═══════════════ */}
            {phase === 'verdict' && result && (
                <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 40px 60px', flex: 1 }}>
                        {/* URL scraped info */}
                        {result.scraped_title && (
                            <div style={{ marginBottom: 24, padding: '12px 20px', border: '1px solid var(--border)', background: 'var(--bg-white)', maxWidth: 500, width: '100%', textAlign: 'center' }}>
                                <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: 4 }}>SCRAPED FROM URL</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{result.scraped_title}</div>
                                {result.scraped_company && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                        {result.scraped_company}
                                        {companyVerify && (
                                            <span style={{
                                                fontSize: '0.6rem', padding: '2px 8px', borderRadius: 2, fontFamily: 'var(--font-mono)',
                                                background: companyVerify.verified ? '#10b98120' : '#ef444420',
                                                color: companyVerify.verified ? '#10b981' : '#ef4444',
                                                border: `1px solid ${companyVerify.verified ? '#10b98140' : '#ef444440'}`,
                                            }}>
                                                {companyVerify.verified ? '✓ VERIFIED' : '✗ UNVERIFIED'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stamp */}
                        <div className={`verdict-stamp ${result.prediction === 'Fake' ? 'verdict-fraud' : 'verdict-legit'}`}
                            style={{ animation: 'stamp-in 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards', marginBottom: 40 }}>
                            {result.prediction === 'Fake' ? 'LIKELY FRAUD' : 'LIKELY LEGIT'}
                        </div>

                        {/* Confidence */}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 24 }}>
                            CONFIDENCE: <span style={{ color: result.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{result.confidence}%</span>
                        </div>

                        {/* Explanation */}
                        <div style={{ maxWidth: 500, padding: '20px 24px', borderLeft: `3px solid ${result.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)'}`, background: result.prediction === 'Fake' ? 'var(--red-glow)' : 'var(--teal-glow)', marginBottom: 32 }}>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.6, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                                {result.prediction === 'Fake'
                                    ? `This job posting shows patterns commonly associated with recruitment fraud. Our AI detected signals with ${result.confidence}% confidence that this is not a legitimate opportunity.`
                                    : `This job posting appears to be a legitimate opportunity. Standard job requirements, professional language, and structural integrity all check out.`}
                            </p>
                        </div>

                        {/* ═══ MULTI-LANGUAGE & A/B TEST INFO ═══ */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, width: '100%', maxWidth: 550 }}>
                            {/* Feature 7: Language Badge */}
                            {result.detected_language && result.detected_language !== 'en' && (
                                <div style={{ padding: '10px 16px', background: 'var(--bg-subtle)', borderLeft: '3px solid var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                                    <div>
                                        <div className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>DETECTED LANGUAGE</div>
                                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                            Translated from <span style={{ fontWeight: 600, textTransform: 'uppercase' }}>{result.detected_language}</span> to English for analysis
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feature 10: A/B Test Result */}
                            {result.model_b_result && (
                                <div style={{ padding: '10px 16px', background: '#e0f2fe10', border: '1px solid #e0f2fe30' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span className="mono" style={{ fontSize: '0.55rem', color: '#38bdf8' }}>🔍 MODEL A/B TEST ACTIVE</span>
                                        <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>Comparison</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Secondary Model ({result.model_b_result.model})
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                fontSize: '0.65rem', fontWeight: 600, padding: '2px 6px', borderRadius: 2,
                                                background: result.model_b_result.prediction === 'Fake' ? 'var(--danger-light)' : 'var(--success-light)',
                                                color: result.model_b_result.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)'
                                            }}>
                                                {result.model_b_result.prediction.toUpperCase()}
                                            </span>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                                {result.model_b_result.confidence}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ═══ RISK BREAKDOWN ═══ */}
                        {result.risk_factors?.length > 0 && (
                            <div style={{ width: '100%', maxWidth: 550, marginBottom: 36 }}>
                                <div className="mono" style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: result.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)', marginBottom: 14 }}>
                                    ■ RISK BREAKDOWN — TOP SIGNALS
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {result.risk_factors.map((rf, i) => {
                                        const rs = RISK_COLORS[rf.category] || RISK_COLORS['Suspicious Pattern'];
                                        const maxW = result.risk_factors[0]?.weight || 1;
                                        const barW = Math.max(10, (rf.weight / maxW) * 100);
                                        return (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: rs.bg, borderLeft: `3px solid ${rs.border}` }}>
                                                <span style={{ fontSize: '0.9rem', width: 20 }}>{rs.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600 }}>"{rf.phrase}"</span>
                                                        <span className="mono" style={{ fontSize: '0.5rem', color: rs.border, padding: '1px 6px', border: `1px solid ${rs.border}40` }}>{rf.category.toUpperCase()}</span>
                                                    </div>
                                                    <div style={{ height: 3, background: 'var(--border)', width: '100%' }}>
                                                        <div style={{ height: '100%', width: `${barW}%`, background: rs.border, transition: 'width 0.6s ease' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Company input (text mode) */}
                        {!result.scraped_company && (
                            <div style={{ width: '100%', maxWidth: 550, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input placeholder="Enter company name to verify..." id="companyInput" style={{
                                    flex: 1, padding: '10px 14px', background: 'var(--bg-white)', border: '1px solid var(--border)',
                                    color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', outline: 'none',
                                }} onKeyDown={e => { if (e.key === 'Enter') verifyCompany(e.target.value); }} />
                                <button className="btn-outline" style={{ fontSize: '0.6rem', padding: '10px 16px' }} disabled={companyLoading}
                                    onClick={() => { const inp = document.getElementById('companyInput'); if (inp?.value) verifyCompany(inp.value); }}>
                                    {companyLoading ? '...' : '✓ VERIFY'}
                                </button>
                                {companyVerify && (
                                    <span style={{
                                        fontSize: '0.6rem', padding: '4px 10px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                                        background: companyVerify.verified ? '#10b98120' : '#ef444420',
                                        color: companyVerify.verified ? '#10b981' : '#ef4444',
                                        border: `1px solid ${companyVerify.verified ? '#10b98140' : '#ef444440'}`,
                                    }}>
                                        {companyVerify.verified ? `✓ ${companyVerify.match_type.toUpperCase()} MATCH (${companyVerify.confidence}%)` : '✗ NOT FOUND'}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Confidence meter */}
                        <div style={{ width: '100%', maxWidth: 500, marginBottom: 40 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--success)' }}>LEGIT</span>
                                <span className="mono" style={{ fontSize: '0.65rem', color: 'var(--danger)' }}>FRAUD</span>
                            </div>
                            <div style={{ width: '100%', height: 4, background: 'var(--border)', position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: result.prediction === 'Fake' ? `${50 + (result.confidence / 2)}%` : `${50 - (result.confidence / 2)}%`,
                                    top: -4, width: 12, height: 12, background: result.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)',
                                    transform: 'rotate(45deg)', transition: 'left 1s ease',
                                }} />
                                <div style={{ position: 'absolute', left: '50%', top: -2, width: 1, height: 8, background: 'var(--text-muted)' }} />
                            </div>
                        </div>

                        {/* Feedback */}
                        {token && (
                            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>IS THIS VERDICT ACCURATE?</span>
                                {feedbackGiven ? (
                                    <span className="mono" style={{
                                        fontSize: '0.6rem', padding: '4px 12px',
                                        background: feedbackGiven === 'agree' ? '#10b98120' : '#ef444420',
                                        color: feedbackGiven === 'agree' ? '#10b981' : '#ef4444',
                                        border: `1px solid ${feedbackGiven === 'agree' ? '#10b98140' : '#ef444440'}`,
                                    }}>
                                        {feedbackGiven === 'agree' ? '✓ AGREED' : '✗ DISAGREED'} — THANKS!
                                    </span>
                                ) : (
                                    <>
                                        <button onClick={() => submitFeedback('agree')} style={{
                                            padding: '6px 16px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                                            background: '#10b98120', color: '#10b981', border: '1px solid #10b98140',
                                            cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.2s',
                                        }} onMouseEnter={e => e.target.style.background = '#10b98140'} onMouseLeave={e => e.target.style.background = '#10b98120'}>✓ AGREE</button>
                                        <button onClick={() => submitFeedback('disagree')} style={{
                                            padding: '6px 16px', fontSize: '0.65rem', fontFamily: 'var(--font-mono)',
                                            background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440',
                                            cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.2s',
                                        }} onMouseEnter={e => e.target.style.background = '#ef444440'} onMouseLeave={e => e.target.style.background = '#ef444420'}>✗ DISAGREE</button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button onClick={reset} className="btn-primary">ANALYZE ANOTHER</button>
                            {result.prediction === 'Fake' && token && (
                                <button className="btn-outline" onClick={async () => {
                                    try {
                                        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flag`, {
                                            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                            body: JSON.stringify({ prediction_id: result.prediction_id, reason: 'Flagged by user review' })
                                        });
                                        alert('Post flagged for review.');
                                    } catch { alert('Failed to flag.'); }
                                }}>⚑ FLAG FOR REVIEW</button>
                            )}
                        </div>

                        {!user && (
                            <div style={{ marginTop: 24, padding: '12px 20px', border: '1px solid var(--border)', background: 'var(--bg-white)' }}>
                                <span className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                    <a href="/login" style={{ color: 'var(--success)', textDecoration: 'none', borderBottom: '1px solid var(--success)' }}>Sign in</a> to save this result, give feedback, and access your analysis history
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Case File */}
                    <div style={{ borderTop: '1px solid var(--border)', padding: '40px', background: 'var(--bg-white)' }}>
                        <div style={{ maxWidth: 700, margin: '0 auto' }}>
                            <div className="mono" style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.68rem' }}>■ CASE FILE #{result.prediction_id || '—'}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)' }}>
                                {[
                                    { label: 'CLASSIFICATION', value: result.prediction?.toUpperCase(), color: result.prediction === 'Fake' ? 'var(--danger)' : 'var(--success)' },
                                    { label: 'CONFIDENCE', value: `${result.confidence}%`, color: 'var(--text-primary)' },
                                    { label: 'ANALYZED', value: formatLocalTime(result.analyzed_at), color: 'var(--text-secondary)' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ background: 'var(--bg-white)', padding: '20px 24px' }}>
                                        <div className="mono" style={{ fontSize: '0.6rem', marginBottom: 8 }}>{label}</div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════ BULK RESULTS PHASE ═══════════════ */}
            {phase === 'bulk-results' && bulkResults && (
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 40px' }}>
                    <div className="mono" style={{ color: 'var(--danger)', marginBottom: 16 }}>■ BULK ANALYSIS REPORT</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', color: 'var(--text-primary)', lineHeight: 0.95, marginBottom: 32 }}>
                        BATCH COMPLETE.
                    </h2>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)', marginBottom: 32 }}>
                        {[
                            { label: 'TOTAL', value: bulkResults.total_analyzed, color: 'var(--text-primary)' },
                            { label: 'LEGITIMATE', value: bulkResults.total_real, color: 'var(--success)' },
                            { label: 'FRAUDULENT', value: bulkResults.total_fake, color: 'var(--danger)' },
                            { label: 'FRAUD RATE', value: `${bulkResults.fraud_rate}%`, color: bulkResults.fraud_rate > 30 ? 'var(--danger)' : 'var(--success)' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ background: 'var(--bg-white)', padding: '24px 20px', textAlign: 'center' }}>
                                <div className="mono" style={{ fontSize: '0.55rem', marginBottom: 10, color: 'var(--text-muted)' }}>{label}</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color }}>{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Distribution Bar */}
                    <div style={{ marginBottom: 32 }}>
                        <div className="mono" style={{ fontSize: '0.55rem', marginBottom: 8, color: 'var(--text-muted)' }}>FRAUD VS LEGIT DISTRIBUTION</div>
                        <div style={{ display: 'flex', height: 8, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ width: `${100 - bulkResults.fraud_rate}%`, background: 'var(--success)', transition: 'width 1s ease' }} />
                            <div style={{ width: `${bulkResults.fraud_rate}%`, background: 'var(--danger)', transition: 'width 1s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--success)' }}>LEGIT {(100 - bulkResults.fraud_rate).toFixed(1)}%</span>
                            <span className="mono" style={{ fontSize: '0.55rem', color: 'var(--danger)' }}>FRAUD {bulkResults.fraud_rate}%</span>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="mono" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 12 }}>■ INDIVIDUAL RESULTS ({bulkResults.results.length} ROWS)</div>
                    <div style={{ background: 'var(--bg-white)', border: '1px solid var(--border)', overflow: 'hidden', maxHeight: 500, overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 90px 80px', padding: '10px 16px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-white)', zIndex: 1 }}>
                            {['ROW', 'PREVIEW', 'VERDICT', 'CONF.'].map(h => (
                                <div key={h} className="mono" style={{ fontSize: '0.5rem', letterSpacing: '0.1em' }}>{h}</div>
                            ))}
                        </div>
                        {bulkResults.results.map((row, i) => (
                            <div key={i} style={{
                                display: 'grid', gridTemplateColumns: '50px 1fr 90px 80px', padding: '10px 16px',
                                borderBottom: i < bulkResults.results.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.row}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{row.preview}</div>
                                <div>
                                    <span className={row.prediction === 'Fake' ? 'tag-red' : row.prediction === 'Real' ? 'tag-teal' : ''} style={{
                                        fontSize: '0.55rem', padding: '2px 8px',
                                        ...(row.prediction === 'Skipped' ? { background: '#64748b20', color: '#64748b', border: '1px solid #64748b40' } : {}),
                                    }}>
                                        {row.prediction === 'Fake' ? 'FRAUD' : row.prediction === 'Real' ? 'LEGIT' : 'SKIP'}
                                    </span>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: row.prediction === 'Fake' ? 'var(--danger)' : row.prediction === 'Real' ? 'var(--success)' : 'var(--text-muted)' }}>{row.confidence}%</div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                        <button onClick={downloadBulkCsv} className="btn-primary">↓ DOWNLOAD CSV RESULTS</button>
                        <button onClick={reset} className="btn-outline">ANALYZE MORE</button>
                    </div>
                </div>
            )}
        </div>
    );
}
