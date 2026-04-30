import { useState, useRef, useEffect } from 'react'
import { getApiKey, clearApiKey, saveIncident } from '../utils/storage'
import ApiKeyModal from '../components/ApiKeyModal'
import AnalysisCard from '../components/AnalysisCard'
import { Link, useNavigate } from 'react-router-dom'

const SEV_COLOR = {
    LOW: '#22c55e', MEDIUM: '#f59e0b',
    HIGH: '#f97316', CRITICAL: '#ef4444'
}
const SEV_BG = {
    LOW: '#052010', MEDIUM: '#1a1000',
    HIGH: '#1a0800', CRITICAL: '#1a0000'
}

function StatusDot({ status }) {
    const c = {
        success: '#22c55e', running: '#3b82f6',
        failed: '#ef4444', warning: '#f59e0b', idle: '#444'
    }[status] || '#444'
    return (
        <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: '50%', background: c,
            boxShadow: `0 0 8px ${c}`, flexShrink: 0,
            transition: 'background 0.3s, box-shadow 0.3s'
        }} />
    )
}

function LogViewer({ value, onChange }) {
    const lines = value ? value.split('\n') : []
    const taRef = useRef(null)
    const numRef = useRef(null)
    const displayRef = useRef(null)

    const syncScroll = () => {
        if (numRef.current && taRef.current) numRef.current.scrollTop = taRef.current.scrollTop
        if (displayRef.current && taRef.current) displayRef.current.scrollTop = taRef.current.scrollTop
    }

    const getLineColor = (line) => {
        if (line.includes('##[error]')) return '#f87171'
        if (line.includes('##[warning]')) return '#fbbf24'
        if (line.includes('##[section]')) return '#60a5fa'
        if (line.includes('##[command]')) return '#4ade80'
        if (line.startsWith('$') || line.startsWith('/usr/bin')) return '#c084fc'
        return '#e2e8f0'
    }

    return (
        <div style={lv.wrapper}>
            <div ref={numRef} style={lv.nums}>
                {(value ? lines : Array.from({ length: 25 })).map((_, i) => (
                    <div key={i} style={{ ...lv.num, color: value ? '#666' : '#222' }}>{i + 1}</div>
                ))}
            </div>
            <div style={lv.editorWrapper}>
                <div ref={displayRef} style={lv.display} aria-hidden="true">
                    {value
                        ? lines.map((line, i) => (
                            <div key={i} style={{ ...lv.displayLine, color: getLineColor(line) }}>
                                {line || '\u00A0'}
                            </div>
                        ))
                        : (
                            <div style={lv.placeholder}>
                                ##[section]Starting: Pipeline{'\n'}##[error]Paste your failed pipeline log here...{'\n'}##[error]Error: task failed{'\n'}##[section]Finishing: Build
                            </div>
                        )
                    }
                </div>
                <textarea
                    ref={taRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onScroll={syncScroll}
                    style={lv.textarea}
                    spellCheck={false}
                    autoComplete="off"
                />
            </div>
        </div>
    )
}

const lv = {
    wrapper: {
        display: 'flex', flex: 1, overflow: 'hidden', background: '#080808'
    },
    nums: {
        width: 60, background: '#0d0d0d',
        borderRight: '1px solid #2a2a2a',
        overflowY: 'hidden', flexShrink: 0,
        paddingTop: 14, userSelect: 'none'
    },
    num: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14, color: '#555',
        textAlign: 'right', paddingRight: 16,
        lineHeight: '24px', height: 24
    },
    editorWrapper: { flex: 1, position: 'relative', overflow: 'hidden' },
    display: {
        position: 'absolute', inset: 0,
        padding: '14px 20px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14, lineHeight: '24px',
        pointerEvents: 'none', overflowY: 'auto',
        whiteSpace: 'pre-wrap', wordBreak: 'break-all'
    },
    displayLine: { height: 24, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
    placeholder: { color: '#444', whiteSpace: 'pre' },
    textarea: {
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        background: 'transparent', color: 'transparent',
        caretColor: '#fff', border: 'none', outline: 'none', resize: 'none',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14, lineHeight: '24px',
        padding: '14px 20px', boxSizing: 'border-box', overflowY: 'auto'
    }
}

const PIPELINE_FEED = [
    { status: 'success', label: 'Initialize job', time: '4s', detail: 'Agent: Ubuntu 22.04' },
    { status: 'success', label: 'Checkout repository', time: '1s', detail: 'Branch: main · Commit: a3f9d12' },
    { status: 'success', label: 'Install dependencies', time: '38s', detail: 'npm ci · 847 packages' },
    { status: 'success', label: 'Run unit tests', time: '12s', detail: '124 passed · 0 failed' },
    { status: 'success', label: 'Build Docker image', time: '1m4s', detail: 'myregistry.azurecr.io/app:latest' },
    { status: 'success', label: 'Push to ACR', time: '22s', detail: 'Digest: sha256:4a9f...' },
    { status: 'success', label: 'Deploy to AKS', time: '18s', detail: 'Namespace: production' },
    { status: 'success', label: 'Health check', time: '5s', detail: 'HTTP 200 · All pods ready' },
    { status: 'success', label: 'Publish artifacts', time: '2s', detail: 'drop/ · 14.2 MB' },
    { status: 'success', label: 'Post-job: Checkout', time: '<1s', detail: 'Cleanup complete' },
    { status: 'success', label: 'Finalize job', time: '<1s', detail: 'Duration: 2m 47s' },
]

export default function Home() {
    const [apiKey, setApiKey] = useState(getApiKey())
    const [log, setLog] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('logs')
    const [elapsed, setElapsed] = useState(0)
    const timerRef = useRef(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (loading) {
            setElapsed(0)
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
        } else {
            clearInterval(timerRef.current)
        }
        return () => clearInterval(timerRef.current)
    }, [loading])

    const jobStatus = (job) => {
        if (!loading && !result) return 'idle'
        if (job === 'ingestion') return result || loading ? 'success' : 'idle'
        if (job === 'analysis') return loading ? 'running' : result ? 'success' : 'idle'
        if (job === 'severity') return result ? (result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'failed' : 'success') : 'idle'
        if (job === 'fix') return result ? 'success' : 'idle'
        return 'idle'
    }

    const handleAnalyze = async () => {
        setError('')
        setResult(null)
        setLoading(true)
        setActiveTab('logs')
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ log, api_key: apiKey })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || 'Analysis failed')
            }
            const data = await res.json()
            setResult(data)
            saveIncident({
                root_cause: data.root_cause,
                fix: data.fix,
                severity: data.severity,
                log_preview: log.slice(0, 120)
            })
            setTimeout(() => setActiveTab('analysis'), 400)
        } catch (e) {
            setError(e.message || 'Something went wrong')
        }
        setLoading(false)
    }

    const sevColor = result ? SEV_COLOR[result.severity] : null
    const sevBg = result ? SEV_BG[result.severity] : null
    const lineCount = log ? log.split('\n').length : 0

    return (
        <div style={s.page}>
            <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .job-row:hover { background: #ffffff06 !important; }
        .tab-btn:hover { color: #ccc !important; }
        .crumb-link:hover { color: #fff !important; text-decoration: underline; }
        .action-btn:hover { opacity: 0.8 !important; }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        .feed-row:hover { background: #ffffff05 !important; }
      `}</style>

            {!apiKey && <ApiKeyModal onSave={setApiKey} />}

            {/* Top nav */}
            <div style={s.topBar}>
                <div style={s.topLeft}>
                    <StatusDot status={result ? (result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'failed' : 'success') : loading ? 'running' : 'idle'} />
                    <Link to="/" className="crumb-link" style={s.orgName}>incident-copilot</Link>
                    <span style={s.slash}>/</span>
                    <span style={s.crumb}>Pipelines</span>
                    <span style={s.slash}>/</span>
                    <span style={s.crumb}>Log Analyzer</span>
                    <span style={s.slash}>/</span>
                    <span style={s.crumbActive}>Run #AI-{new Date().toISOString().slice(2, 10).replace(/-/g, '')}</span>
                </div>
                <div style={s.topRight}>
                    <Link to="/history" style={s.topBtn}>History</Link>
                    <button onClick={() => { clearApiKey(); setApiKey('') }} style={s.topBtn}>Reset Key</button>
                </div>
            </div>

            {/* Summary strip */}
            <div style={s.strip}>
                {[
                    ['AGENT', 'Groq · llama-3.3-70b'],
                    ['SOURCE', 'Azure DevOps / GitHub Actions'],
                    ['STATUS', loading ? `Running · ${elapsed}s` : result ? result.severity : 'Awaiting log',
                        loading ? '#60a5fa' : result ? sevColor : '#aaa'],
                    ['BYOK', 'Enabled', '#4ade80'],
                    ['LINES', lineCount > 0 ? `${lineCount} lines` : '—']
                ].map(([label, val, color]) => (
                    <div key={label} style={s.stripItem}>
                        <span style={s.stripLabel}>{label}</span>
                        <span style={{ ...s.stripVal, color: color || '#e2e8f0' }}>{val}</span>
                    </div>
                ))}
            </div>

            {/* Main */}
            <div style={s.main}>

                {/* Sidebar */}
                <div style={s.sidebar}>
                    <div style={s.sideLabel}>JOBS</div>
                    {[
                        ['ingestion', 'Log Ingestion', '<1s'],
                        ['analysis', 'AI Analysis', loading ? `${elapsed}s` : result ? 'done' : '—'],
                        ['severity', 'Severity Check', result ? '<1s' : '—'],
                        ['fix', 'Fix Generation', result ? '<1s' : '—'],
                    ].map(([key, label, time]) => (
                        <div key={key} className="job-row" style={s.jobRow}>
                            <StatusDot status={jobStatus(key)} />
                            <span style={s.jobLabel}>{label}</span>
                            <span style={s.jobTime}>{time}</span>
                        </div>
                    ))}

                    <div style={{ ...s.sideLabel, marginTop: 24 }}>ACTIONS</div>
                    <button
                        className="action-btn"
                        onClick={handleAnalyze}
                        disabled={loading || !log.trim()}
                        style={{
                            ...s.runBtn,
                            opacity: loading || !log.trim() ? 0.35 : 1,
                            cursor: loading || !log.trim() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading
                            ? <><span style={s.spinnerInline} /> Running · {elapsed}s</>
                            : '▶  Run Analysis'
                        }
                    </button>
                    <button className="action-btn" onClick={() => { setLog(''); setResult(null); setError(''); setActiveTab('logs') }} style={s.clearBtn}>
                        ✕  Clear
                    </button>
                    {result && (
                        <div style={{ ...s.sevChip, background: sevBg, borderColor: sevColor + '50', color: sevColor }}>
                            ● {result.severity}
                        </div>
                    )}

                    <div style={{ ...s.sideLabel, marginTop: 24 }}>AZURE DEVOPS</div>
                    {[
                        ['Trigger', 'CI · Push to main'],
                        ['Agent', 'Ubuntu 22.04'],
                        ['Queue', 'Azure Pipelines'],
                        ['Timeout', '60 minutes'],
                        ['Artifact', 'drop/ · Published'],
                        ['Environment', 'Production · AKS'],
                        ['Service Conn', 'Azure RM (OIDC)'],
                        ['Helm Chart', 'v1.0.0 · Pinned'],
                    ].map(([k, v]) => (
                        <div key={k} style={s.metaRow}>
                            <span style={s.metaKey}>{k}</span>
                            <span style={s.metaVal}>{v}</span>
                        </div>
                    ))}
                </div>

                {/* Panel */}
                <div style={s.panel}>
                    <div style={s.tabs}>
                        {['logs', 'analysis'].map(tab => (
                            <button
                                key={tab}
                                className="tab-btn"
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    ...s.tab,
                                    color: activeTab === tab ? '#ffffff' : '#888',
                                    borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent'
                                }}
                            >
                                {tab === 'logs' ? 'Logs' : 'Analysis'}
                                {tab === 'analysis' && result && (
                                    <span style={{ ...s.tabPill, background: sevBg, color: sevColor, borderColor: sevColor + '50' }}>
                                        {result.severity}
                                    </span>
                                )}
                            </button>
                        ))}
                        <div style={s.tabSpacer} />
                        {log && <span style={s.lineCountBadge}>{lineCount} lines</span>}
                    </div>

                    {activeTab === 'logs' && (
                        <div style={s.logPane}>
                            <LogViewer value={log} onChange={setLog} />
                            {error && (
                                <div style={s.errorBar}>
                                    <span style={{ color: '#f87171' }}>##[error]</span> {error}
                                </div>
                            )}
                            {!log && (
                                <div style={s.feedSection}>
                                    <div style={s.feedHeader}>
                                        <span style={s.feedHeaderLabel}>SAMPLE PIPELINE RUN</span>
                                        <span style={s.feedHeaderSub}>incident-authorization-fix · Run #20260430.3</span>
                                    </div>
                                    {PIPELINE_FEED.map((item, i) => (
                                        <div key={i} className="feed-row" style={s.feedRow}>
                                            <StatusDot status={item.status} />
                                            <span style={s.feedLabel}>{item.label}</span>
                                            <span style={s.feedDetail}>{item.detail}</span>
                                            <span style={s.feedTime}>{item.time}</span>
                                        </div>
                                    ))}
                                    <div style={s.feedFooter}>
                                        Total duration: 2m 47s · Agent: Ubuntu 22.04 · Triggered by: push to main
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div style={s.analysisPane}>
                            {!result ? (
                                <div style={s.empty}>
                                    <div style={s.emptyHex}>⬡</div>
                                    <p style={s.emptyTitle}>No analysis yet</p>
                                    <p style={s.emptyText}>Paste a log in the Logs tab and click Run Analysis.</p>
                                </div>
                            ) : (
                                <div style={{ animation: 'fadeSlideIn 0.35s ease' }}>
                                    <AnalysisCard result={result} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div style={s.footer}>
                <span style={s.footerText}>INCIDENT COPILOT · Groq AI · BYOK · Zero data retention · Local history</span>
            </div>
        </div>
    )
}

const s = {
    page: {
        height: '100vh', background: '#0a0a0a',
        backgroundImage: `
      linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px)
    `,
        backgroundSize: '40px 40px',
        color: '#fff', fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
    },
    topBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', background: '#111',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    topLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    orgName: {
        fontSize: 16, color: '#ffffff', fontWeight: 700,
        textDecoration: 'none', transition: 'color 0.15s', cursor: 'pointer'
    },
    slash: { color: '#444', fontSize: 16 },
    crumb: { fontSize: 14, color: '#aaa' },
    crumbActive: { fontSize: 14, color: '#3b82f6' },
    topRight: { display: 'flex', gap: 10 },
    topBtn: {
        background: 'transparent', border: '1px solid #2a2a2a',
        color: '#ccc', borderRadius: 4, padding: '7px 16px',
        fontSize: 13, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s'
    },
    strip: {
        display: 'flex', background: '#0d0d0d',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0, flexWrap: 'wrap'
    },
    stripItem: {
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '12px 24px', borderRight: '1px solid #2a2a2a', minWidth: 0
    },
    stripLabel: { fontSize: 10, color: '#666', letterSpacing: 3 },
    stripVal: { fontSize: 14, fontWeight: 600 },
    main: { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
    sidebar: {
        width: 250, background: '#0d0d0d',
        borderRight: '1px solid #2a2a2a',
        flexShrink: 0, paddingTop: 14,
        display: 'flex', flexDirection: 'column', overflowY: 'auto'
    },
    sideLabel: { fontSize: 10, color: '#666', letterSpacing: 3, padding: '6px 18px 8px' },
    jobRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 18px', borderBottom: '1px solid #1a1a1a',
        cursor: 'default', transition: 'background 0.15s'
    },
    jobLabel: { fontSize: 14, color: '#e2e8f0', flex: 1 },
    jobTime: { fontSize: 12, color: '#888' },
    runBtn: {
        margin: '10px 14px 6px', padding: '11px 14px',
        background: '#0f2a1a', color: '#4ade80',
        border: '1px solid #22c55e40', borderRadius: 5,
        fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'opacity 0.2s', textAlign: 'left'
    },
    clearBtn: {
        margin: '0 14px', padding: '10px 14px',
        background: 'transparent', color: '#bbb',
        border: '1px solid #2a2a2a', borderRadius: 5,
        fontSize: 14, fontFamily: "'JetBrains Mono', monospace",
        cursor: 'pointer', transition: 'opacity 0.2s', textAlign: 'left'
    },
    spinnerInline: {
        display: 'inline-block', width: 12, height: 12,
        border: '2px solid #22c55e30', borderTop: '2px solid #22c55e',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite'
    },
    sevChip: {
        margin: '14px 14px 0', padding: '9px 14px', borderRadius: 5,
        border: '1px solid', fontSize: 13, fontWeight: 700, letterSpacing: 2,
        animation: 'fadeSlideIn 0.3s ease'
    },
    metaRow: {
        display: 'flex', justifyContent: 'space-between',
        padding: '7px 18px', borderBottom: '1px solid #1a1a1a'
    },
    metaKey: { fontSize: 11, color: '#666' },
    metaVal: { fontSize: 11, color: '#bbb' },
    panel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    tabs: {
        display: 'flex', alignItems: 'center',
        background: '#0d0d0d', borderBottom: '1px solid #2a2a2a',
        padding: '0 16px', flexShrink: 0
    },
    tab: {
        padding: '13px 20px', background: 'transparent',
        border: 'none', cursor: 'pointer', fontSize: 15,
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'color 0.15s'
    },
    tabPill: {
        fontSize: 11, padding: '3px 8px',
        borderRadius: 3, letterSpacing: 1.5,
        border: '1px solid', fontWeight: 700
    },
    tabSpacer: { flex: 1 },
    lineCountBadge: { fontSize: 12, color: '#666', letterSpacing: 1 },
    logPane: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    errorBar: {
        padding: '12px 18px', background: '#1a0808',
        borderTop: '1px solid #ef444430',
        fontSize: 14, color: '#f87171', flexShrink: 0
    },
    feedSection: { borderTop: '1px solid #2a2a2a', background: '#0a0a0a', overflowY: 'auto' },
    feedHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px', borderBottom: '1px solid #1a1a1a', background: '#0d0d0d'
    },
    feedHeaderLabel: { fontSize: 10, color: '#666', letterSpacing: 3 },
    feedHeaderSub: { fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    feedRow: {
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 20px', borderBottom: '1px solid #1a1a1a',
        transition: 'background 0.15s'
    },
    feedLabel: { fontSize: 15, color: '#ffffff', fontWeight: 600, flex: '0 0 230px' },
    feedDetail: { fontSize: 13, color: '#aaa', flex: 1 },
    feedTime: { fontSize: 12, color: '#666', minWidth: 44, textAlign: 'right' },
    feedFooter: { padding: '10px 20px', fontSize: 12, color: '#555', borderTop: '1px solid #1a1a1a' },
    analysisPane: { flex: 1, padding: 20, background: '#080808', overflowY: 'auto' },
    empty: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', height: 340, gap: 14
    },
    emptyHex: { fontSize: 48, color: '#222' },
    emptyTitle: { fontSize: 16, color: '#888', margin: 0 },
    emptyText: { fontSize: 13, color: '#555', margin: 0, textAlign: 'center' },
    footer: { padding: '10px 24px', borderTop: '1px solid #1a1a1a', textAlign: 'center', flexShrink: 0 },
    footerText: { fontSize: 11, color: '#555', letterSpacing: 3 }
}