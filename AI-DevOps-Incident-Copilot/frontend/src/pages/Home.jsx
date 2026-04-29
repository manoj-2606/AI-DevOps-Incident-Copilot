import { useState } from 'react'
import { getApiKey, clearApiKey } from '../utils/storage'
import ApiKeyModal from '../components/ApiKeyModal'
import { Link } from 'react-router-dom'

const sev = {
    LOW: { color: '#22c55e', bg: '#052010' },
    MEDIUM: { color: '#f59e0b', bg: '#1a1000' },
    HIGH: { color: '#f97316', bg: '#1a0800' },
    CRITICAL: { color: '#ef4444', bg: '#1a0000' }
}

function StatusDot({ status }) {
    const colors = { success: '#22c55e', running: '#3b82f6', failed: '#ef4444', warning: '#f59e0b' }
    return (
        <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: '50%', background: colors[status] || '#555',
            boxShadow: `0 0 6px ${colors[status] || '#555'}`,
            flexShrink: 0
        }} />
    )
}

function PipelineRow({ icon, label, status, detail, time }) {
    return (
        <div style={rowStyles.row}>
            <StatusDot status={status} />
            <span style={rowStyles.label}>{label}</span>
            {detail && <span style={rowStyles.detail}>{detail}</span>}
            {time && <span style={rowStyles.time}>{time}</span>}
        </div>
    )
}

const rowStyles = {
    row: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 16px',
        borderBottom: '1px solid #ffffff08',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12
    },
    label: { color: '#ccc', flex: 1 },
    detail: { color: '#555', fontSize: 11 },
    time: { color: '#444', fontSize: 11, minWidth: 40, textAlign: 'right' }
}

export default function Home() {
    const [apiKey, setApiKey] = useState(getApiKey())
    const [log, setLog] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('logs')

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
            setActiveTab('analysis')
        } catch (e) {
            setError(e.message || 'Something went wrong')
        }
        setLoading(false)
    }

    const s = result ? (sev[result.severity] || sev.MEDIUM) : null

    return (
        <div style={{ ...styles.page, maxWidth: '100%', margin: 0 }}>
            {!apiKey && <ApiKeyModal onSave={setApiKey} />}

            {/* Top bar — ADO style */}
            <div style={styles.topBar}>
                <div style={styles.topLeft}>
                    <StatusDot status={result ? (result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'failed' : 'success') : 'running'} />
                    <span style={styles.pipelineName}>incident-copilot</span>
                    <span style={styles.breadcrumb}>/</span>
                    <span style={styles.breadcrumbSub}>Pipelines</span>
                    <span style={styles.breadcrumb}>/</span>
                    <span style={styles.breadcrumbSub}>Log Analyzer</span>
                    <span style={styles.breadcrumb}>/</span>
                    <span style={styles.breadcrumbActive}>Run #AI</span>
                </div>
                <div style={styles.topRight}>
                    <Link to="/history" style={styles.topBtn}>History</Link>
                    <button onClick={() => { clearApiKey(); setApiKey('') }} style={styles.topBtn}>
                        Reset Key
                    </button>
                </div>
            </div>

            {/* Pipeline summary bar */}
            <div style={styles.summaryBar}>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Agent</span>
                    <span style={styles.summaryValue}>Groq · llama-3.3-70b</span>
                </div>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Source</span>
                    <span style={styles.summaryValue}>Azure DevOps / GitHub Actions</span>
                </div>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Status</span>
                    <span style={{
                        ...styles.summaryValue,
                        color: result ? (s.color) : loading ? '#3b82f6' : '#888'
                    }}>
                        {loading ? 'Analyzing...' : result ? result.severity : 'Awaiting log'}
                    </span>
                </div>
                <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>BYOK</span>
                    <span style={{ ...styles.summaryValue, color: '#22c55e' }}>Enabled</span>
                </div>
            </div>

            {/* Main layout */}
            <div style={styles.main}>

                {/* Left sidebar — job list */}
                <div style={styles.sidebar}>
                    <div style={styles.sidebarTitle}>JOBS</div>
                    <PipelineRow status={result ? 'success' : 'running'} label="Log Ingestion" time="<1s" />
                    <PipelineRow status={loading ? 'running' : result ? 'success' : 'warning'} label="AI Analysis" time={loading ? '...' : result ? 'done' : '-'} />
                    <PipelineRow status={result ? (result.severity === 'CRITICAL' ? 'failed' : 'success') : 'warning'} label="Severity Check" />
                    <PipelineRow status={result ? 'success' : 'warning'} label="Fix Generation" />

                    <div style={{ ...styles.sidebarTitle, marginTop: 24 }}>ACTIONS</div>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !log.trim()}
                        style={{
                            ...styles.runBtn,
                            opacity: loading || !log.trim() ? 0.4 : 1,
                            cursor: loading || !log.trim() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '⏳ Running...' : '▶ Run Analysis'}
                    </button>
                    <button
                        onClick={() => { setLog(''); setResult(null); setError('') }}
                        style={styles.clearBtn}
                    >
                        ✕ Clear
                    </button>
                </div>

                {/* Right panel */}
                <div style={styles.content}>

                    {/* Tabs */}
                    <div style={styles.tabs}>
                        {['logs', 'analysis'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    ...styles.tab,
                                    borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                                    color: activeTab === tab ? '#fff' : '#555'
                                }}
                            >
                                {tab === 'logs' ? 'Logs' : 'Analysis'}
                                {tab === 'analysis' && result && (
                                    <span style={{ ...styles.tabBadge, background: s.bg, color: s.color }}>
                                        {result.severity}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Log input tab */}
                    {activeTab === 'logs' && (
                        <div style={styles.logPane}>
                            <div style={styles.logHeader}>
                                <span style={styles.logHeaderText}>PIPELINE LOG INPUT</span>
                                {log && <span style={styles.lineCount}>{log.split('\n').length} lines</span>}
                            </div>
                            <textarea
                                value={log}
                                onChange={e => setLog(e.target.value)}
                                placeholder={`##[section]Starting: Pipeline
##[error]Paste your failed pipeline log here...
##[error]Error: task failed
##[section]Finishing: Build`}
                                style={styles.textarea}
                                rows={20}
                            />
                            {error && (
                                <div style={styles.errorLine}>
                                    <span style={{ color: '#ef4444' }}>##[error]</span> {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analysis tab */}
                    {activeTab === 'analysis' && (
                        <div style={styles.analysisPane}>
                            {!result ? (
                                <div style={styles.emptyState}>
                                    <span style={styles.emptyIcon}>⬡</span>
                                    <p style={styles.emptyText}>No analysis yet. Paste a log and run analysis.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Severity banner */}
                                    <div style={{ ...styles.sevBanner, background: s.bg, borderColor: s.color + '30' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <StatusDot status={result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'failed' : result.severity === 'MEDIUM' ? 'warning' : 'success'} />
                                            <span style={{ ...styles.sevLabel, color: s.color }}>
                                                {result.severity} SEVERITY
                                            </span>
                                        </div>
                                    </div>

                                    {/* Root cause block */}
                                    <div style={styles.block}>
                                        <div style={styles.blockHeader}>
                                            <span style={styles.blockIcon}>⬢</span>
                                            <span style={styles.blockTitle}>Root Cause</span>
                                        </div>
                                        <div style={styles.blockBody}>
                                            <span style={{ color: '#ef4444' }}>##[error]</span>{' '}
                                            <span style={styles.blockText}>{result.root_cause}</span>
                                        </div>
                                    </div>

                                    {/* Fix block */}
                                    <div style={styles.block}>
                                        <div style={styles.blockHeader}>
                                            <span style={styles.blockIcon}>⬡</span>
                                            <span style={styles.blockTitle}>Recommended Fix</span>
                                        </div>
                                        <div style={styles.blockBody}>
                                            {result.fix.split(/[,.]|\d+\./).filter(Boolean).map((step, i) => (
                                                step.trim() && (
                                                    <div key={i} style={styles.fixLine}>
                                                        <span style={{ color: '#22c55e' }}>$</span>{' '}
                                                        <span style={styles.blockText}>{step.trim()}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.footer}>
                <span style={styles.footerText}>
                    INCIDENT COPILOT · Groq AI · BYOK · Zero data retention
                </span>
            </div>
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh', background: '#0e0e0e',
        color: '#fff', fontFamily: "'JetBrains Mono', monospace",
    },
    topBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px', background: '#141414',
        borderBottom: '1px solid #1e1e1e'
    },
    topLeft: { display: 'flex', alignItems: 'center', gap: 8 },
    pipelineName: { fontSize: 13, color: '#fff', fontWeight: 600 },
    breadcrumb: { color: '#333', fontSize: 13 },
    breadcrumbSub: { fontSize: 12, color: '#555' },
    breadcrumbActive: { fontSize: 12, color: '#3b82f6' },
    topRight: { display: 'flex', gap: 12 },
    topBtn: {
        background: 'transparent', border: '1px solid #222',
        color: '#555', borderRadius: 4, padding: '5px 12px',
        fontSize: 11, cursor: 'pointer', textDecoration: 'none',
        fontFamily: "'JetBrains Mono', monospace"
    },
    summaryBar: {
        display: 'flex', gap: 0,
        background: '#111', borderBottom: '1px solid #1e1e1e'
    },
    summaryItem: {
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: '12px 32px', borderRight: '1px solid #1e1e1e'
    },
    summaryLabel: { fontSize: 9, color: '#333', letterSpacing: 2 },
    summaryValue: { fontSize: 12, color: '#888' },
    main: {
        display: 'flex', minHeight: 'calc(100vh - 120px)'
    },
    sidebar: {
        width: 280, background: '#111',
        borderRight: '1px solid #1e1e1e',
        flexShrink: 0, paddingTop: 12
    },
    sidebarTitle: {
        fontSize: 9, color: '#333', letterSpacing: 3,
        padding: '8px 16px 6px'
    },
    runBtn: {
        width: 'calc(100% - 32px)', margin: '8px 16px 4px',
        background: '#1a3a2a', color: '#22c55e',
        border: '1px solid #22c55e30', borderRadius: 4,
        padding: '8px', fontSize: 11, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        textAlign: 'left'
    },
    clearBtn: {
        width: 'calc(100% - 32px)', margin: '0 16px',
        background: 'transparent', color: '#444',
        border: '1px solid #1e1e1e', borderRadius: 4,
        padding: '8px', fontSize: 11, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        textAlign: 'left'
    },
    content: { flex: 1, display: 'flex', flexDirection: 'column' },
    tabs: {
        display: 'flex', background: '#111',
        borderBottom: '1px solid #1e1e1e', padding: '0 16px'
    },
    tab: {
        padding: '10px 16px', background: 'transparent',
        border: 'none', cursor: 'pointer', fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'color 0.15s'
    },
    tabBadge: {
        fontSize: 9, padding: '2px 6px',
        borderRadius: 3, letterSpacing: 1
    },
    logPane: { flex: 1, display: 'flex', flexDirection: 'column' },
    logHeader: {
        display: 'flex', justifyContent: 'space-between',
        padding: '8px 16px', background: '#0d0d0d',
        borderBottom: '1px solid #1a1a1a'
    },
    logHeaderText: { fontSize: 9, color: '#333', letterSpacing: 3 },
    lineCount: { fontSize: 10, color: '#3b82f640' },
    textarea: {
        flex: 1, background: '#0a0a0a', border: 'none',
        color: '#888', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13, padding: '16px', resize: 'none',
        outline: 'none', lineHeight: 1.8,
        minHeight: 1000
    },
    errorLine: {
        padding: '10px 16px', background: '#1a0808',
        borderTop: '1px solid #ef444420',
        fontSize: 12, color: '#ef4444'
    },
    analysisPane: { flex: 1, padding: 20, background: '#0a0a0a' },
    emptyState: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: 300, gap: 16
    },
    emptyIcon: { fontSize: 32, color: '#222' },
    emptyText: { fontSize: 12, color: '#333' },
    sevBanner: {
        padding: '12px 16px', borderRadius: 6,
        border: '1px solid', marginBottom: 16
    },
    sevLabel: { fontSize: 11, fontWeight: 600, letterSpacing: 2 },
    block: {
        background: '#0d0d0d', border: '1px solid #1a1a1a',
        borderRadius: 6, marginBottom: 12, overflow: 'hidden'
    },
    blockHeader: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid #1a1a1a',
        background: '#111'
    },
    blockIcon: { fontSize: 12, color: '#333' },
    blockTitle: { fontSize: 11, color: '#666', letterSpacing: 1 },
    blockBody: { padding: '14px 16px' },
    fixLine: { marginBottom: 8 },
    blockText: { color: '#aaa', fontSize: 12, lineHeight: 1.8 },
    footer: {
        padding: '12px 20px', borderTop: '1px solid #1a1a1a',
        textAlign: 'center'
    },
    footerText: { fontSize: 9, color: '#222', letterSpacing: 3 }
}