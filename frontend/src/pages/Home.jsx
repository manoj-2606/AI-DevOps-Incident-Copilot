import { useState, useRef, useEffect } from 'react'
import { getApiKey, clearApiKey, saveIncident } from '../utils/storage'
import ApiKeyModal from '../components/ApiKeyModal'
import AnalysisCard from '../components/AnalysisCard'
import { Link } from 'react-router-dom'

const SEV_COLOR = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' }
const SEV_BG = { LOW: '#052010', MEDIUM: '#1a1000', HIGH: '#1a0800', CRITICAL: '#1a0000' }

const TYPEWRITER_LINES = [
    '##[section]Starting: Build and Deploy Pipeline',
    '##[command]docker build -f Dockerfile -t myapp:latest .',
    '##[error]unauthorized: authentication required',
    '##[error]docker push myregistry.azurecr.io/myapp failed',
    '##[error]The process failed with exit code 1',
    '##[section]Finishing: Build and Deploy Pipeline',
]

// Tool logos as SVG paths
const TOOL_LOGOS = {
    terraform: (
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
            <path d="M12.042 7.172L20.04 11.742V20.88L12.042 16.31V7.172Z" fill="#7B42BC" />
            <path d="M21.042 11.742L29.04 7.172V16.31L21.042 20.88V11.742Z" fill="#7B42BC" opacity="0.7" />
            <path d="M2.96 2.602L10.958 7.172V16.31L2.96 11.74V2.602Z" fill="#7B42BC" opacity="0.5" />
            <path d="M12.042 18.43L20.04 23V23L12.042 27.57V18.43Z" fill="#7B42BC" opacity="0.8" />
        </svg>
    ),
    kubernetes: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#326CE5" strokeWidth="1.5" fill="none" />
            <path d="M16 6L18.5 13H25L19.5 17L22 24L16 20L10 24L12.5 17L7 13H13.5L16 6Z" fill="#326CE5" opacity="0.8" />
        </svg>
    ),
    docker: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="12" width="5" height="4" rx="0.5" fill="#2496ED" />
            <rect x="10" y="12" width="5" height="4" rx="0.5" fill="#2496ED" />
            <rect x="16" y="12" width="5" height="4" rx="0.5" fill="#2496ED" />
            <rect x="10" y="7" width="5" height="4" rx="0.5" fill="#2496ED" opacity="0.7" />
            <rect x="16" y="7" width="5" height="4" rx="0.5" fill="#2496ED" opacity="0.7" />
            <path d="M27 14.5C27 14.5 25.5 13.5 23.5 14C23 12 21.5 11 21.5 11C21.5 11 21 13 22 14.5C21 14.7 4 14.5 4 14.5C4 14.5 3.5 19 7 20.5C10 21.8 14 21.5 16 21.5C21 21.5 25.5 20 27 14.5Z" fill="#2496ED" />
        </svg>
    ),
    azure: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M14 4L4 28H10L14 18L20 28H28L18 4H14Z" fill="#0078D4" />
            <path d="M18 4L28 28H22L18 18L12 28H4L14 4H18Z" fill="#0078D4" opacity="0.6" />
        </svg>
    ),
    github: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <path d="M16 3C8.82 3 3 8.82 3 16C3 21.72 6.58 26.58 11.66 28.34C12.26 28.44 12.5 28.08 12.5 27.76V25.52C9.04 26.26 8.34 24 8.34 24C7.8 22.62 7.02 22.26 7.02 22.26C5.94 21.52 7.1 21.54 7.1 21.54C8.3 21.62 8.94 22.76 8.94 22.76C10 24.58 11.82 24.04 12.54 23.72C12.64 22.96 12.96 22.42 13.3 22.12C10.5 21.82 7.56 20.74 7.56 15.9C7.56 14.58 8.02 13.5 8.96 12.64C8.84 12.34 8.44 11.1 9.08 9.44C9.08 9.44 10.08 9.12 12.5 10.68C13.62 10.38 14.8 10.22 16 10.22C17.2 10.22 18.38 10.38 19.5 10.68C21.92 9.12 22.92 9.44 22.92 9.44C23.56 11.1 23.16 12.34 23.04 12.64C23.98 13.5 24.44 14.58 24.44 15.9C24.44 20.76 21.5 21.82 18.68 22.1C19.12 22.48 19.5 23.24 19.5 24.4V27.76C19.5 28.08 19.74 28.44 20.34 28.34C25.42 26.58 29 21.72 29 16C29 8.82 23.18 3 16 3Z" fill="#ffffff" opacity="0.8" />
        </svg>
    ),
    helm: (
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12" stroke="#0F1689" strokeWidth="1.5" fill="#0F1689" opacity="0.2" />
            <path d="M16 8L16 24M8 16L24 16M11 11L21 21M21 11L11 21" stroke="#0F1689" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
            <circle cx="16" cy="16" r="3" fill="#0F1689" />
        </svg>
    ),
}

function StatusDot({ status, idle }) {
    const c = { success: '#22c55e', running: '#3b82f6', failed: '#ef4444', warning: '#f59e0b', idle: '#333' }[status] || '#333'
    return (
        <span style={{
            display: 'inline-block', width: 10, height: 10,
            borderRadius: '50%', background: c, flexShrink: 0,
            boxShadow: status !== 'idle' ? `0 0 8px ${c}` : 'none',
            animation: idle ? 'idlePulse 3s ease-in-out infinite' : 'none',
            transition: 'all 0.4s'
        }} />
    )
}

function PipelineFlow({ activeStep, done, severity, loading, idle, hasLog }) {
    const steps = ['Ingest', 'Analyze', 'Classify', 'Fix']
    const sevColor = severity ? SEV_COLOR[severity] : null

    const getStepState = (i) => {
        if (done) return 'done'
        if (activeStep < 0) return 'idle'
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

    const textColor = (state) => state !== 'idle' ? '#fff' : '#2a2a2a'

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
                                borderColor: state === 'idle' ? '#222' : bg,
                                boxShadow: state === 'active'
                                    ? `0 0 20px ${bg}90, 0 0 40px ${bg}40`
                                    : state === 'done' ? `0 0 10px ${bg}50` : 'none',
                                transform: state === 'active' ? 'scale(1.1)' : 'scale(1)',
                                animation: state === 'active' ? 'nodePulse 1.4s ease-in-out infinite'
                                    : idle ? `idleNodePulse ${1.5 + i * 0.4}s ease-in-out infinite` : 'none'
                            }}>
                                <span style={{ ...pf.nodeText, color: textColor(state) }}>{step}</span>
                                {state === 'active' && <span style={pf.activeDot} />}
                            </div>
                            {i < steps.length - 1 && (
                                <div style={pf.arrowWrap}>
                                    <div style={{
                                        ...pf.arrowLine,
                                        background: (i < activeStep || done) ? '#22c55e' : '#1e1e1e',
                                        transition: 'background 0.6s ease'
                                    }} />
                                    <div style={{
                                        ...pf.arrowHead,
                                        borderLeftColor: (i < activeStep || done) ? '#22c55e' : '#1e1e1e',
                                        transition: 'border-color 0.6s ease'
                                    }} />
                                    {state === 'active' && <div style={pf.flowDot} />}
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
                    borderColor: sevColor + '60',
                    color: sevColor,
                    animation: 'badgePop 0.5s ease'
                }}>
                    ● {severity} — Analysis Complete
                </div>
            )}
            {loading && activeStep >= 0 && (
                <div style={pf.statusText}>
                    {['Ingesting log data...', 'Running AI analysis...', 'Classifying severity...', 'Generating fix...'][Math.min(activeStep, 3)]}
                </div>
            )}
            {idle && <div style={pf.idleText}>{hasLog ? 'Log loaded · Ready to analyze' : 'Ready · Awaiting log input'}</div>}
            {idle && (
                <div style={pf.idleCards}>
                    {[
                        ['ACR Auth', 'docker login failures', TOOL_LOGOS.docker, '#2496ED'],
                        ['Terraform', 'state lock errors', TOOL_LOGOS.terraform, '#7B42BC'],
                        ['Kubernetes', 'pod crash loops', TOOL_LOGOS.kubernetes, '#326CE5'],
                        ['GitHub Actions', 'workflow failures', TOOL_LOGOS.github, '#e2e8f0'],
                    ].map(([title, desc, logo, color]) => (
                        <div key={title} style={pf.idleCard}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                                {logo}
                                <span style={{ ...pf.idleCardTitle, color }}>{title}</span>
                            </div>
                            <span style={pf.idleCardDesc}>{desc}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const pf = {
    wrapper: { padding: '16px 16px 20px', borderTop: '1px solid #1a1a1a', background: '#080808' },
    label: { fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 16 },
    flow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 },
    stepGroup: { display: 'flex', alignItems: 'center' },
    node: {
        width: 52, height: 52, borderRadius: '50%',
        border: '1.5px solid', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
        transition: 'all 0.4s ease', cursor: 'default', flexShrink: 0
    },
    nodeText: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, fontFamily: "'JetBrains Mono', monospace" },
    activeDot: {
        position: 'absolute', bottom: -4, left: '50%',
        transform: 'translateX(-50%)', width: 5, height: 5,
        borderRadius: '50%', background: '#3b82f6',
        animation: 'dotBlink 0.8s ease-in-out infinite'
    },
    arrowWrap: { display: 'flex', alignItems: 'center', position: 'relative', width: 24, flexShrink: 0 },
    arrowLine: { height: 1.5, flex: 1 },
    arrowHead: { width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid' },
    flowDot: {
        position: 'absolute', left: 0, width: 6, height: 6,
        borderRadius: '50%', background: '#3b82f6',
        boxShadow: '0 0 8px #3b82f6', animation: 'flowMove 1s linear infinite'
    },
    resultBadge: {
        marginTop: 14, padding: '8px 12px', border: '1px solid',
        borderRadius: 6, fontSize: 11, fontWeight: 700,
        letterSpacing: 1.5, textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace"
    },
    statusText: {
        marginTop: 12, fontSize: 10, color: '#3b82f6',
        letterSpacing: 1, textAlign: 'center',
        fontFamily: "'JetBrains Mono', monospace",
        animation: 'textFade 1.5s ease-in-out infinite'
    },
    idleText: { marginTop: 10, fontSize: 9, color: '#333', letterSpacing: 2, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" },
    idleCards: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, padding: '0 4px' },
    idleCard: { display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 14px', background: '#111', border: '1px solid #2a2a2a', borderRadius: 6 },
    idleCardTitle: { fontSize: 12, color: '#ccc', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
    idleCardDesc: { fontSize: 11, color: '#666', fontFamily: "'JetBrains Mono', monospace" }
}

function TypewriterPlaceholder() {
    const [displayedLines, setDisplayedLines] = useState([''])
    const [lineIndex, setLineIndex] = useState(0)
    const [charIndex, setCharIndex] = useState(0)
    const [phase, setPhase] = useState('typing')

    useEffect(() => {
        if (phase === 'typing') {
            if (lineIndex >= TYPEWRITER_LINES.length) {
                const t = setTimeout(() => setPhase('clearing'), 2000)
                return () => clearTimeout(t)
            }
            if (charIndex < TYPEWRITER_LINES[lineIndex].length) {
                const t = setTimeout(() => {
                    setDisplayedLines(prev => {
                        const next = [...prev]
                        next[lineIndex] = TYPEWRITER_LINES[lineIndex].slice(0, charIndex + 1)
                        return next
                    })
                    setCharIndex(c => c + 1)
                }, 28)
                return () => clearTimeout(t)
            } else {
                const t = setTimeout(() => {
                    setDisplayedLines(prev => [...prev, ''])
                    setLineIndex(l => l + 1)
                    setCharIndex(0)
                }, 120)
                return () => clearTimeout(t)
            }
        }
        if (phase === 'clearing') {
            const t = setTimeout(() => {
                setDisplayedLines([''])
                setLineIndex(0)
                setCharIndex(0)
                setPhase('typing')
            }, 800)
            return () => clearTimeout(t)
        }
    }, [phase, lineIndex, charIndex])

    const getColor = (line) => {
        if (line.includes('##[error]')) return '#f8717180'
        if (line.includes('##[section]')) return '#60a5fa80'
        if (line.includes('##[command]')) return '#4ade8080'
        return '#33333380'
    }

    return (
        <div style={{ padding: '16px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '24px' }}>
            {displayedLines.map((line, i) => (
                <div key={i} style={{ height: 24, color: getColor(line) }}>
                    {line}
                    {i === displayedLines.length - 1 && phase === 'typing' && (
                        <span style={{ animation: 'cursorBlink 0.8s steps(1) infinite', color: '#3b82f680' }}>▋</span>
                    )}
                </div>
            ))}
        </div>
    )
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
            {scanning && (
                <div style={lv.scanOverlay}>
                    <div style={lv.scanLine} />
                    <div style={lv.scanGlow} />
                </div>
            )}
            <div ref={numRef} style={lv.nums}>
                {(value ? lines : Array.from({ length: 8 })).map((_, i) => (
                    <div key={i} style={{ ...lv.num, color: value ? '#555' : '#222' }}>{i + 1}</div>
                ))}
            </div>
            <div style={lv.editorWrapper}>
                {!value && <TypewriterPlaceholder />}
                {value && (
                    <div ref={displayRef} style={lv.display} aria-hidden="true">
                        {lines.map((line, i) => (
                            <div key={i} style={{ ...lv.displayLine, color: getLineColor(line) }}>{line || '\u00A0'}</div>
                        ))}
                    </div>
                )}
                <textarea
                    ref={taRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onScroll={syncScroll}
                    style={{ ...lv.textarea, opacity: value ? 1 : 0.01 }}
                    spellCheck={false}
                    placeholder=""
                />
            </div>
        </div>
    )
}

const lv = {
    wrapper: { display: 'flex', flex: 1, overflow: 'hidden', background: '#060606' },
    scanOverlay: { position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' },
    scanLine: {
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, #3b82f690, #3b82f6, #3b82f690, transparent)',
        animation: 'scanMove 2s linear infinite', boxShadow: '0 0 12px #3b82f660'
    },
    scanGlow: {
        position: 'absolute', left: 0, right: 0, height: 80,
        background: 'linear-gradient(180deg, transparent, #3b82f606, transparent)',
        animation: 'scanMove 2s linear infinite', animationDelay: '-0.1s'
    },
    nums: {
        width: 56, background: '#0a0a0a', borderRight: '1px solid #2a2a2a',
        overflowY: 'hidden', flexShrink: 0, paddingTop: 16, userSelect: 'none'
    },
    num: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, textAlign: 'right', paddingRight: 14, lineHeight: '24px', height: 24 },
    editorWrapper: { flex: 1, position: 'relative', overflow: 'hidden' },
    display: {
        position: 'absolute', inset: 0, padding: '16px 20px',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '24px',
        pointerEvents: 'none', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
    },
    displayLine: { height: 24, whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
    textarea: {
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        background: 'transparent', color: 'transparent',
        caretColor: '#fff', border: 'none', outline: 'none', resize: 'none',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: '24px',
        padding: '16px 20px', boxSizing: 'border-box', overflowY: 'auto'
    }
}

// Product logo SVG
function ProductLogo() {
    return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="6" fill="#0d1117" />
            <rect width="28" height="28" rx="6" stroke="#2a2a2a" strokeWidth="1" />
            {/* Terminal prompt */}
            <path d="M6 10L11 14L6 18" stroke="#00ffc8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pipeline bars */}
            <rect x="14" y="10" width="8" height="2" rx="1" fill="#3b82f6" />
            <rect x="14" y="14" width="6" height="2" rx="1" fill="#3b82f6" opacity="0.7" />
            <rect x="14" y="18" width="8" height="2" rx="1" fill="#3b82f6" opacity="0.4" />
        </svg>
    )
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
            stepRef.current = setInterval(() => setPipelineStep(s => s < 3 ? s + 1 : 3), 1200)
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
        setError('')
        setResult(null)
        setLoading(true)
        // Don't switch tab — keep logs visible during analysis
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
            // Switch to analysis only after done
            setActiveTab('analysis')
        } catch (e) {
            setError(e.message || 'Something went wrong')
            setPipelineStep(-1)
        }
        setLoading(false)
    }

    const handleResetKey = () => {
        const existing = getApiKey()
        const confirmed = window.confirm(
            `Reset API Key?\n\nYour current key starts with: ${existing.slice(0, 14)}...\n\nCopy it now if you need it. This cannot be undone.`
        )
        if (confirmed) { clearApiKey(); setApiKey('') }
    }

    const sevColor = result ? SEV_COLOR[result.severity] : null
    const sevBg = result ? SEV_BG[result.severity] : null
    const lineCount = log ? log.split('\n').length : 0
    const flowDone = !!result && pipelineStep === 4
    const isIdle = !loading && !result

    return (
        <div style={s.page}>
            <style>{`
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes nodePulse {
          0%,100%{box-shadow:0 0 20px #3b82f690,0 0 40px #3b82f640}
          50%{box-shadow:0 0 30px #3b82f6aa,0 0 60px #3b82f660}
        }
        @keyframes idleNodePulse {
          0%,100%{border-color:#1e1e1e;box-shadow:none}
          50%{border-color:#2a2a2a;box-shadow:0 0 8px #ffffff06}
        }
        @keyframes dotBlink { 0%,100%{opacity:1;transform:translateX(-50%) scale(1)} 50%{opacity:0.2;transform:translateX(-50%) scale(0.5)} }
        @keyframes flowMove { from{left:0} to{left:calc(100% - 6px)} }
        @keyframes scanMove { from{top:-2px} to{top:100%} }
        @keyframes textFade { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes badgePop { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes idlePulse {
          0%,100%{box-shadow:0 0 4px #22c55e40;background:#22c55e60}
          50%{box-shadow:0 0 12px #22c55e80;background:#22c55e}
        }
        @keyframes gradientRotate {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        .crumb-link { text-decoration:none; transition:color 0.15s; }
        .crumb-link:hover { color:#fff !important; }
        .job-row:hover { background:#ffffff06 !important; }
        textarea::-webkit-scrollbar { width:4px; }
        textarea::-webkit-scrollbar-thumb { background:#2a2a2a; border-radius:2px; }
        .analyze-btn:hover:not(:disabled) { background:#00e5b3 !important; transform:translateY(-1px) !important; }
        .clear-btn:hover { border-color:#555 !important; color:#fff !important; }
        .tab-btn:hover { color:#aaa !important; }
      `}</style>

            {!apiKey && <ApiKeyModal onSave={setApiKey} />}

            {/* Top nav */}
            <div style={s.topBar}>
                <div style={s.topLeft}>
                    <ProductLogo />
                    <StatusDot
                        status={result ? (result.severity === 'CRITICAL' || result.severity === 'HIGH' ? 'failed' : 'success') : loading ? 'running' : 'idle'}
                        idle={isIdle}
                    />
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
                    <button onClick={handleResetKey} style={s.topBtn}>Reset Key</button>
                </div>
            </div>

            {/* Summary strip with tool logos */}
            <div style={s.strip}>
                {[
                    ['AI AGENT', 'llama-3.3-70b', null, null],
                    ['SOURCE', 'Azure DevOps / GitHub Actions', null, null],
                    ['STATUS', loading ? `Analyzing · ${elapsed}s` : result ? result.severity : 'Awaiting log',
                        loading ? '#60a5fa' : result ? sevColor : '#888', null],
                    ['BYOK', 'Enabled', '#4ade80', null],
                    ['LINES', lineCount > 0 ? `${lineCount} lines` : '—', null, null]
                ].map(([label, val, color]) => (
                    <div key={label} style={s.stripItem}>
                        <span style={s.stripLabel}>{label}</span>
                        <span style={{ ...s.stripVal, color: color || '#e2e8f0' }}>{val}</span>
                    </div>
                ))}

                {/* Tool logos section */}
                <div style={s.toolLogos}>
                    <span style={s.toolLogosLabel}>INTEGRATES WITH</span>
                    <div style={s.toolLogosRow}>
                        {Object.entries(TOOL_LOGOS).map(([name, svg]) => (
                            <div key={name} title={name} style={s.toolLogo}>
                                {svg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main */}
            <div style={s.main}>
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

                    <PipelineFlow
                        activeStep={pipelineStep}
                        done={flowDone}
                        severity={result?.severity}
                        loading={loading}
                        idle={isIdle}
                        hasLog={!!log}
                    />

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

                <div style={s.panel}>
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

                    <div style={s.actionBar}>
                        <div style={s.actionLeft}>
                            {lineCount > 0 && <span style={s.lineCountBadge}>{lineCount} lines · {log.length} chars</span>}
                        </div>
                        <div style={s.actionRight}>
                            <button className="clear-btn" onClick={() => { setLog(''); setResult(null); setError(''); setActiveTab('logs'); setPipelineStep(-1) }} style={s.clearBtn}>
                                ✕ Clear
                            </button>
                            <div style={{
                                borderRadius: 7, padding: 1.5,
                                background: log.trim() && !loading ? 'linear-gradient(90deg, #00ffc8, #3b82f6, #a855f7, #00ffc8)' : 'transparent',
                                backgroundSize: '300% 300%',
                                animation: log.trim() && !loading ? 'gradientRotate 2.5s ease infinite' : 'none',
                                transition: 'all 0.3s'
                            }}>
                                <button
                                    className="analyze-btn"
                                    onClick={handleAnalyze}
                                    disabled={loading || !log.trim()}
                                    style={{
                                        ...s.analyzeBtn,
                                        opacity: !log.trim() ? 0.4 : 1,
                                        cursor: loading || !log.trim() ? 'not-allowed' : 'pointer',
                                        background: '#0a0a0a',
                                        color: loading ? '#60a5fa' : log.trim() ? '#00ffc8' : '#555',
                                        boxShadow: log.trim() && !loading ? '0 0 20px #00ffc820' : 'none'
                                    }}
                                >
                                    {loading ? <><span style={s.spinner} /> Analyzing · {elapsed}s</> : '⚡ Run Analysis'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={s.tabs}>
                        {['logs', 'analysis'].map(tab => (
                            <button key={tab} className="tab-btn" onClick={() => setActiveTab(tab)} style={{
                                ...s.tab,
                                color: activeTab === tab ? '#ffffff' : '#555',
                                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent'
                            }}>
                                {tab === 'logs' ? '📋 Logs' : '🔍 Analysis'}
                                {tab === 'analysis' && result && (
                                    <span style={{ ...s.tabPill, background: sevBg, color: sevColor, borderColor: sevColor + '50' }}>
                                        {result.severity}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Always render log pane, hide with display:none when on analysis tab */}
                    <div style={{ ...s.logPane, display: activeTab === 'logs' ? 'flex' : 'none' }}>
                        <LogViewer value={log} onChange={setLog} scanning={loading} />
                        {error && (
                            <div style={s.errorBar}>
                                <span style={{ color: '#f87171' }}>##[error]</span> {error}
                            </div>
                        )}
                    </div>

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
                <span style={s.footerText}>INCIDENT COPILOT · AI-Powered · BYOK · Zero data retention · Local history</span>
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
        padding: '10px 24px', background: '#111',
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
        borderBottom: '1px solid #2a2a2a', flexShrink: 0, alignItems: 'stretch'
    },
    stripItem: {
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '10px 20px', borderRight: '1px solid #2a2a2a', minWidth: 0
    },
    stripLabel: { fontSize: 9, color: '#555', letterSpacing: 3 },
    stripVal: { fontSize: 13, fontWeight: 600 },
    toolLogos: {
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '8px 20px', marginLeft: 'auto', justifyContent: 'center'
    },
    toolLogosLabel: { fontSize: 9, color: '#333', letterSpacing: 3 },
    toolLogosRow: { display: 'flex', gap: 10, alignItems: 'center' },
    toolLogo: {
        width: 32, height: 32, display: 'flex', alignItems: 'center',
        justifyContent: 'center', borderRadius: 6,
        background: '#1a1a1a', border: '1px solid #333',
        transition: 'border-color 0.2s', cursor: 'default'
    },
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
        padding: '14px 24px', flex: 1, minWidth: 0
    },
    instructionText: { fontSize: 13, color: '#aaa', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    instructionStep: { fontSize: 24, fontWeight: 800, color: '#3b82f6', flexShrink: 0, lineHeight: 1 },
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
        background: '#0a0a0a', color: '#00ffc8',
        border: 'none', borderRadius: 6, padding: '10px 28px',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s', letterSpacing: 0.3
    },
    spinner: {
        display: 'inline-block', width: 12, height: 12,
        border: '2px solid #3b82f630', borderTop: '2px solid #3b82f6',
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
    logPane: { flex: 1, flexDirection: 'column', overflow: 'hidden' },
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