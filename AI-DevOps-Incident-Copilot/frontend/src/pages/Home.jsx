import { useState, useRef, useEffect } from 'react'
import { getApiKey, clearApiKey, saveIncident } from '../utils/storage'
import ApiKeyModal from '../components/ApiKeyModal'
import AnalysisCard from '../components/AnalysisCard'
import { Link } from 'react-router-dom'

const SEV_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' }
const SEV_BG = { LOW: '#052010', MEDIUM: '#1a1000', HIGH: '#1a0800', CRITICAL: '#1a0000' }

function StatusDot({ status }) {
    const c = { success: '#22c55e', running: '#3b82f6', failed: '#ef4444', warning: '#f59e0b', idle: '#222' }[status] || '#222'
    return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: status !== 'idle' ? `0 0 8px ${c}` : 'none', flexShrink: 0, transition: 'all 0.4s' }} />
}

function PipelineFlow({ activeStep, done, severity }) {
    const steps = ['Ingest', 'Analyze', 'Classify', 'Fix']
    const sevColor = severity ? SEV_COLOR[severity] : null

    const getStepState = (i) => {
        if (done) return 'done'
        if (i < activeStep) return 'done'
        if (i === activeStep) return 'active'
        return 'idle'
    }

    const nodeColor = (state, i) => {
        if (state === 'done') {
            if (done && i === 3 && sevColor) return sevColor
            return '#22c55e'
        }
        if (state === 'active') return '#3b82f6'
        return '#1a1a1a'
    }

    const textColor = (state) => {
        if (state === 'done') return '#fff'
        if (state === 'active') return '#fff'
        return '#333'
    }

    return (
        <div style={pf.wrapper}>
            <div style={pf.label}>PIPELINE FLOW</div>
            <div style={pf.flow}>
                {steps.map((step, i) => {
                    const state = getStepState(i)
                    const bg = nodeColor(state, i)
                    return (
                        <div key={step} style={pf.stepGroup}>
                            <div style={{
                                ...pf.node,
                                background: bg,
                                borderColor: state === 'idle' ? '#2a2a2a' : bg,
                                boxShadow: state === 'active' ? `0 0 16px ${bg}80, 0 0 32px ${bg}30` : state === 'done' ? `0 0 8px ${bg}40` : 'none',
                                transform: state === 'active' ? 'scale(1.08)' : 'scale(1)',
                                animation: state === 'active' ? 'nodePulse 1.4s ease-in-out infinite' : 'none'
                            }}>
                                <span style={{ ...pf.nodeText, color: textColor(state) }}>{step}</span>
                                {state === 'active' && <span style={pf.activeDot} />}
                            </div>
                            {i < steps.length - 1 && (
                                <div style={pf.arrowWrap}>
                                    <div style={{
                                        ...pf.arrowLine,
                                        background: i < activeStep || done ? '#22c55e' : '#1e1e1e',
                                        transition: 'background 0.5s ease'
                                    }} />
                                    <div style={{
                                        ...pf.arrowHead,
                                        borderLeftColor: i < activeStep || done ? '#22c55e' : '#1e1e1e',
                                        transition: 'border-color 0.5s ease'
                                    }} />
                                    {state === 'active' && (
                                        <div style={pf.flowDot} />
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            {done && severity && (
                <div style={{
                    ...pf.resultBadge,
                    background: SEV_BG[severity],
                    borderColor: sevColor + '50',
                    color: sevColor,
                    animation: 'badgePop 0.4s ease'
                }}>
                    ● {severity} — Analysis Complete
                </div>
            )}
            {!done && activeStep >= 0 && (
                <div style={pf.statusText}>
                    {['Ingesting log data...', 'Running AI analysis...', 'Classifying severity...', 'Generating fix...'][activeStep]}
                </div>
            )}
        </div>
    )
}

const pf = {
    wrapper: {
        padding: '16px 16px 20px',
        borderTop: '1px solid #1a1a1a',
        background: '#080808'
    },
    label: { fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 16 },
    flow: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 0
    },
    stepGroup: { display: 'flex', alignItems: 'center' },
    node: {
        width: 52, height: 52, borderRadius: '50%',
        border: '1.5px solid', display: 'flex',
        flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', position: 'relative',
        transition: 'all 0.4s ease', cursor: 'default', flexShrink: 0
    },
    nodeText: {
        fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
        fontFamily: "'JetBrains Mono', monospace"
    },
    activeDot: {
        position: 'absolute', bottom: -3, left: '50%',
        transform: 'translateX(-50%)',
        width: 5, height: 5, borderRadius: '50%',
        background: '#3b82f6',
        animation: 'dotBlink 0.8s ease-in-out infinite'
    },
    arrowWrap: {
        display: 'flex', alignItems: 'center',
        position: 'relative', width: 28, flexShrink: 0
    },
    arrowLine: {
        height: 1.5, flex: 1,
        transition: 'background 0.5s'
    },
    arrowHead: {
        width: 0, height: 0,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderLeft: '6px solid',
        transition: 'border-color 0.5s'
    },
    flowDot: {
        position: 'absolute', left: 0,
        width: 6, height: 6, borderRadius: '50%',
        background: '#3b82f6',
        boxShadow: '0 0 8px #3b82f6',
        animation: 'flowMove 1s linear infinite'
    },
    resultBadge: {
        marginTop: 14, padding: '7px 12px',
        border: '1px solid', borderRadius: 6,
        fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace"
    },
    statusText: {
        marginTop: 12, fontSize: 10,
        color: '#3b82f6', letterSpacing: 1,
        textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        animation: 'textFade 1.5s ease-in-out infinite'
    }
}

function LogViewer({ value, onChange, scanning }) {
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
        <div style={{ ...lv.wrapper, position: 'relative' }}>
            {/* Scan-line overlay when analyzing */}
            {scanning && (
                <div style={lv.scanOverlay}>
                    <div style={lv.scanLine} />
                    <div style={lv.scanGlow} />
                </div>
            )}

            <div ref={numRef} style={lv.nums}>
                {(value ? lines : Array.from({ length: 20 })).map((_, i) => (
                    <div key={i} style={{ ...lv.num, color: value ? '#555' : '#222' }}>{i + 1}</div>
                ))}
            </div>
            <div style={lv.editorWrapper}>
                <div ref={displayRef} style={lv.display} aria-hidden="true">
                    {value
                        ? lines.map((line, i) => (
                            <div key={i} style={{ ...lv.displayLine, color: getLineColor(line) }}>{line || '\u00A0'}</div>
                        ))
                        : <div style={lv.placeholder}>{'##[section]Starting: Pipeline\n##[error]Paste your failed pipeline log here...\n##[error]Error: task failed\n##[section]Finishing: Build'}</div>
                    }
                </div>
                <textarea
                    ref={taRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onScroll={syncScroll}
                    style={lv.textarea}
                    spellCheck={false}
                />
            </div>
        </div>
    )
}

const lv = {
    wrapper: { display: 'flex', flex: 1, overflow: 'hidden', background: '#060606' },
    scanOverlay: {
        position: 'absolute', inset: 0, zIndex: 10,
        pointerEvents: 'none', overflow: 'hidden'
    },
    scanLine: {
        position: 'absolute', left: 0, right: 0,
        height: 2, background: 'linear-gradient(90deg, transparent, #3b82f680, #3b82f6, #3b82f680, transparent)',
        animation: 'scanMove 2s linear infinite',
        boxShadow: '0 0 12px #3b82f660'
    },
    scanGlow: {
        position: 'absolute', left: 0, right: 0,
        height: 60,
        background: 'linear-gradient(180deg, transparent, #3b82f608, transparent)',
        animation: 'scanMove 2s linear infinite',
        animationDelay: '-0.1s'
    },
    nums: {
        width: 56, background: '#0a0a0a', borderRight: '1px solid #2a2a2a',
        overflowY: 'hidden', flexShrink: 0, paddingTop: 16, userSelect: 'none'
    },
    num: {
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#555',
        textAlign: 'right', paddingRight: 14, lineHeight: '24px', height: 24
    },
    editorWrapper: { flex: 1, position: 'relative', overflow: 'hidden' },
    display: {
        position: 'absolute', inset: 0, padding: '16px 20px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '24px',
        pointerEvents: 'none', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
    },
    displayLine: { height: 24, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
    placeholder: { color: '#333', whiteSpace: 'pre' },
    textarea: {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        background: 'transparent', color: 'transparent', caretColor: '#fff',
        border: 'none', outline: 'none', resize: 'none',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '24px',
        padding: '16px 20px', boxSizing: 'border-box', overflowY: 'auto'
    }
}

export default function Home() {
    const [apiKey, setApiKey] = useState(getApiKey())
    const [log, setLog] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('logs')
    const [elapsed, setElapsed] = useState(0)
    const [pipelineStep, setPipelineStep] = useState(-1)
    const timerRef = useRef(null)
    const stepRef = useRef(null)

    useEffect(() => {
        if (loading) {
            setElapsed(0)
            setPipelineStep(0)
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
            stepRef.current = setInterval(() => {
                setPipelineStep(s => s < 3 ? s + 1 : 3)
            }, 1200)
        } else {
            clearInterval(timerRef.current)
            clearInterval(stepRef.current)
            if (!result) setPipelineStep(-1)
        }
        return () => { clearInterval(timerRef.current); clearInterval(stepRef.current) }
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
        setError(''); setResult(null); setLoading(true); setActiveTab('logs')
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ log, api_key: apiKey })
            })
            if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Analysis failed') }
            const data = await res.json()
            setResult(data)
            setPipelineStep(4)
            saveIncident({ root_cause: data.root_cause, fix: data.fix, severity: data.severity, log_preview: log.slice(0, 120) })
            setTimeout(() => setActiveTab('analysis'), 600)
        } catch (e) {
            setError(e.message || 'Something went wrong')
            setPipelineStep(-1)
        }
        setLoading(false)
    }

    const sevColor = result ? SEV_COLOR[result.severity] : null
    const sevBg = result ? SEV_BG[result.severity] : null
    const lineCount = log ? log.split('\n').length : 0
    const flowDone = !!result && pipelineStep === 4

    return (
        <div style={s.page}>
            <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes nodePulse {
          0%,100%{box-shadow:0 0 16px #3b82f680,0 0 32px #3b82f630}
          50%{box-shadow:0 0 24px #3b82f6aa,0 0 48px #3b82f650}
        }
        @keyframes dotBlink { 0%,100%{opacity:1;transform:translateX(-50%) scale(1)} 50%{opacity:0.3;transform:translateX(-50%) scale(0.6)} }
        @keyframes flowMove { from{left:0} to{left:calc(100% - 6px)} }
        @keyframes scanMove { from{top:-2px} to{top:100%} }
        @keyframes textFade { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes badgePop { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
        .crumb-link { text-decoration:none; transition:color 0.15s; }
        .crumb-link:hover { color:#fff !important; }
        .job-row:hover { background:#ffffff06 !important; }
        textarea::-webkit-scrollbar { width:4px; }
        textarea::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:2px; }
        .analyze-btn:hover:not(:disabled) { background:#00e5b3 !important; transform:translateY(-1px); box-shadow:0 4px 20px #00ffc840 !important; }
        .clear-btn:hover { border-color:#555 !important; color:#fff !important; }
        .tab-btn:hover { color:#aaa !important; }
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
                    <button onClick={() => {
                        const existing = getApiKey()
                        const confirmed = window.confirm(
                            `Reset API Key?\n\nYour current key starts with: ${existing.slice(0, 12)}...\n\nCopy it first if you need it. This cannot be undone.`
                        )
                        if (confirmed) { clearApiKey(); setApiKey('') }
                    }} style={s.topBtn}>Reset Key</button>
                </div>
            </div>

            {/* Summary strip */}
            <div style={s.strip}>
                {[
                    ['AGENT', 'Groq · llama-3.3-70b'],
                    ['SOURCE', 'Azure DevOps / GitHub Actions'],
                    ['STATUS', loading ? `Analyzing · ${elapsed}s` : result ? result.severity : 'Awaiting log',
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
                    <div style={s.sideLabel}>PIPELINE JOBS</div>
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

                    {/* Pipeline flow animation */}
                    {(loading || result) && (
                        <PipelineFlow
                            activeStep={pipelineStep}
                            done={flowDone}
                            severity={result?.severity}
                        />
                    )}

                    <div style={{ flex: 1 }} />

                    <div style={s.sideLabel}>PIPELINE INFO</div>
                    {[
                        ['Trigger', 'CI · Push to main'],
                        ['Agent', 'Ubuntu 22.04'],
                        ['Queue', 'Azure Pipelines'],
                        ['Service Conn', 'Azure RM (OIDC)'],
                        ['Environment', 'Production · AKS'],
                        ['Helm Chart', 'v1.0.0 · Pinned'],
                        ['Artifact', 'drop/ · Published'],
                        ['Timeout', '60 minutes'],
                    ].map(([k, v]) => (
                        <div key={k} style={s.metaRow}>
                            <span style={s.metaKey}>{k}</span>
                            <span style={s.metaVal}>{v}</span>
                        </div>
                    ))}
                    <div style={{ height: 16 }} />
                </div>

                {/* Panel */}
                <div style={s.panel}>

                    {/* Instruction bar */}
                    <div style={s.instructionBar}>
                        <div style={s.instructionLeft}>
                            <span style={s.instructionStep}>01</span>
                            <span style={s.instructionText}>Paste your failed Azure DevOps or GitHub Actions pipeline log below</span>
                        </div>
                        <div style={s.instructionRight}>
                            <span style={s.instructionStep}>02</span>
                            <span style={s.instructionText}>Click Analyze — get root cause, severity and fix in seconds</span>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div style={s.actionBar}>
                        <div style={s.actionLeft}>
                            {lineCount > 0 && <span style={s.lineCountBadge}>{lineCount} lines · {log.length} chars</span>}
                        </div>
                        <div style={s.actionRight}>
                            <button className="clear-btn" onClick={() => { setLog(''); setResult(null); setError(''); setActiveTab('logs'); setPipelineStep(-1) }} style={s.clearBtn}>
                                ✕ Clear
                            </button>
                            <button
                                className="analyze-btn"
                                onClick={handleAnalyze}
                                disabled={loading || !log.trim()}
                                style={{
                                    ...s.analyzeBtn,
                                    opacity: loading || !log.trim() ? 0.4 : 1,
                                    cursor: loading || !log.trim() ? 'not-allowed' : 'pointer',
                                    background: loading ? '#00d4a8' : '#00ffc8'
                                }}
                            >
                                {loading
                                    ? <><span style={s.spinner} /> Analyzing · {elapsed}s</>
                                    : '⚡ Run Analysis'
                                }
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={s.tabs}>
                        {['logs', 'analysis'].map(tab => (
                            <button
                                key={tab}
                                className="tab-btn"
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    ...s.tab,
                                    color: activeTab === tab ? '#ffffff' : '#555',
                                    borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent'
                                }}
                            >
                                {tab === 'logs' ? '📋 Logs' : '🔍 Analysis'}
                                {tab === 'analysis' && result && (
                                    <span style={{ ...s.tabPill, background: sevBg, color: sevColor, borderColor: sevColor + '50' }}>
                                        {result.severity}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Log tab */}
                    {activeTab === 'logs' && (
                        <div style={s.logPane}>
                            <LogViewer value={log} onChange={setLog} scanning={loading} />
                            {error && (
                                <div style={s.errorBar}>
                                    <span style={{ color: '#f87171' }}>##[error]</span> {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analysis tab */}
                    {activeTab === 'analysis' && (
                        <div style={s.analysisPane}>
                            {!result ? (
                                <div style={s.empty}>
                                    <div style={s.emptyIcon}>⬡</div>
                                    <p style={s.emptyTitle}>No analysis yet</p>
                                    <p style={s.emptySub}>Paste a failed pipeline log in the Logs tab, then click Run Analysis.</p>
                                    <button onClick={() => setActiveTab('logs')} style={s.emptyBtn}>→ Go to Logs</button>
                                </div>
                            ) : (
                                <div style={{ animation: 'fadeSlideIn 0.3s ease' }}>
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
        backgroundImage: `linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)`,
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
    orgName: { fontSize: 15, color: '#ffffff', fontWeight: 700 },
    slash: { color: '#333', fontSize: 15 },
    crumb: { fontSize: 13, color: '#888' },
    crumbActive: { fontSize: 13, color: '#3b82f6' },
    topRight: { display: 'flex', gap: 10 },
    topBtn: {
        background: 'transparent', border: '1px solid #2a2a2a',
        color: '#ccc', borderRadius: 4, padding: '7px 16px',
        fontSize: 13, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        textDecoration: 'none', transition: 'all 0.2s'
    },
    strip: {
        display: 'flex', background: '#0d0d0d',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    stripItem: {
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '10px 24px', borderRight: '1px solid #2a2a2a', minWidth: 0
    },
    stripLabel: { fontSize: 9, color: '#555', letterSpacing: 3 },
    stripVal: { fontSize: 13, fontWeight: 600 },
    main: { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
    sidebar: {
        width: 280, background: '#0d0d0d',
        borderRight: '1px solid #2a2a2a',
        flexShrink: 0, display: 'flex',
        flexDirection: 'column', overflowY: 'auto'
    },
    sideLabel: { fontSize: 9, color: '#444', letterSpacing: 3, padding: '12px 20px 8px', flexShrink: 0 },
    jobRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 20px', borderBottom: '1px solid #1a1a1a',
        transition: 'background 0.15s'
    },
    jobLabel: { fontSize: 14, color: '#e2e8f0', flex: 1 },
    jobTime: { fontSize: 12, color: '#666' },
    metaRow: {
        display: 'flex', justifyContent: 'space-between',
        padding: '7px 20px', borderBottom: '1px solid #1a1a1a'
    },
    metaKey: { fontSize: 11, color: '#555' },
    metaVal: { fontSize: 11, color: '#aaa' },
    panel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
    instructionBar: {
        display: 'flex', background: '#0d1117',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    instructionLeft: {
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px', flex: 1, borderRight: '1px solid #2a2a2a'
    },
    instructionRight: {
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px', flex: 1
    },
    instructionStep: { fontSize: 24, fontWeight: 800, color: '#3b82f6', flexShrink: 0, lineHeight: 1 },
    instructionText: { fontSize: 13, color: '#aaa', lineHeight: 1.5 },
    actionBar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', background: '#0d0d0d',
        borderBottom: '1px solid #2a2a2a', flexShrink: 0
    },
    actionLeft: { display: 'flex', alignItems: 'center' },
    actionRight: { display: 'flex', gap: 10, alignItems: 'center' },
    lineCountBadge: { fontSize: 12, color: '#555' },
    clearBtn: {
        background: 'transparent', border: '1px solid #2a2a2a',
        color: '#888', borderRadius: 6, padding: '9px 18px',
        fontSize: 13, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s'
    },
    analyzeBtn: {
        background: '#00ffc8', color: '#000',
        border: 'none', borderRadius: 6, padding: '10px 28px',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s', letterSpacing: 0.3
    },
    spinner: {
        display: 'inline-block', width: 12, height: 12,
        border: '2px solid #00000030', borderTop: '2px solid #000',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite'
    },
    tabs: {
        display: 'flex', alignItems: 'center',
        background: '#0d0d0d', borderBottom: '1px solid #2a2a2a',
        padding: '0 20px', flexShrink: 0
    },
    tab: {
        padding: '12px 20px', background: 'transparent',
        border: 'none', cursor: 'pointer', fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'color 0.15s'
    },
    tabPill: {
        fontSize: 10, padding: '3px 8px', borderRadius: 3,
        letterSpacing: 1.5, border: '1px solid', fontWeight: 700
    },
    logPane: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    errorBar: {
        padding: '12px 20px', background: '#1a0808',
        borderTop: '1px solid #ef444430',
        fontSize: 13, color: '#f87171', flexShrink: 0
    },
    analysisPane: { flex: 1, padding: 24, background: '#080808', overflowY: 'auto' },
    empty: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 16, minHeight: 300
    },
    emptyIcon: { fontSize: 52, color: '#1e1e1e' },
    emptyTitle: { fontSize: 18, color: '#555', margin: 0, fontWeight: 600 },
    emptySub: { fontSize: 13, color: '#333', margin: 0, textAlign: 'center', maxWidth: 400, lineHeight: 1.7 },
    emptyBtn: {
        marginTop: 8, padding: '10px 24px',
        background: '#0f1f35', color: '#3b82f6',
        border: '1px solid #3b82f630', borderRadius: 6,
        fontSize: 13, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s'
    },
    footer: { padding: '10px 24px', borderTop: '1px solid #1a1a1a', textAlign: 'center', flexShrink: 0 },
    footerText: { fontSize: 10, color: '#333', letterSpacing: 3 }
}