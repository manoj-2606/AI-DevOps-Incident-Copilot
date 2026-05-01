import { useState } from 'react'

const sev = {
    LOW: { color: '#22c55e', bg: '#052010', border: '#22c55e25' },
    MEDIUM: { color: '#f59e0b', bg: '#1a1000', border: '#f59e0b25' },
    HIGH: { color: '#f97316', bg: '#1a0800', border: '#f9731625' },
    CRITICAL: { color: '#ef4444', bg: '#1a0000', border: '#ef444425' }
}

function StatusDot({ color }) {
    return (
        <span style={{
            display: 'inline-block', width: 9, height: 9,
            borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}`, flexShrink: 0
        }} />
    )
}

export default function AnalysisCard({ result }) {
    const [copied, setCopied] = useState(false)
    if (!result) return null

    const s = sev[result.severity] || sev.MEDIUM
    const fixSteps = result.fix
        .split(/(?:\d+\.\s|\n|,\s(?=[A-Z]))/)
        .map(s => s.trim())
        .filter(Boolean)

    const handleCopy = () => {
        navigator.clipboard.writeText(result.fix)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{ ...styles.card, borderColor: s.border }}>

            {/* Header */}
            <div style={{ ...styles.header, borderBottomColor: s.border }}>
                <div style={styles.headerLeft}>
                    <StatusDot color={s.color} />
                    <span style={styles.headerTitle}>Analysis Complete</span>
                    <span style={styles.runId}>#{Date.now().toString().slice(-6)}</span>
                </div>
                <div style={{ ...styles.badge, color: s.color, background: s.bg, borderColor: s.border }}>
                    ● {result.severity}
                </div>
            </div>

            {/* Root Cause */}
            <div style={styles.block}>
                <div style={styles.blockLabel}>ROOT CAUSE</div>
                <div style={styles.logLine}>
                    <span style={styles.lineNum}>1</span>
                    <span style={{ color: '#f87171' }}>##[error]</span>
                    <span style={styles.lineText}>{result.root_cause}</span>
                </div>
            </div>

            <div style={styles.divider} />

            {/* Fix */}
            <div style={styles.block}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={styles.blockLabel}>RECOMMENDED FIX</div>
                    <button
                        onClick={handleCopy}
                        style={{
                            background: copied ? '#052010' : '#1a1a1a',
                            border: `1px solid ${copied ? '#22c55e60' : '#3a3a3a'}`,
                            color: copied ? '#22c55e' : '#aaa',
                            borderRadius: 4, padding: '5px 14px',
                            fontSize: 12, cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            transition: 'all 0.2s'
                        }}
                    >
                        {copied ? '✓ Copied' : '⎘ Copy Output'}
                    </button>
                </div>
                {fixSteps.map((step, i) => (
                    step && (
                        <div key={i} style={styles.logLine}>
                            <span style={styles.lineNum}>{i + 1}</span>
                            <span style={{ color: '#4ade80' }}>$</span>
                            <span style={styles.lineText}>{step}</span>
                        </div>
                    )
                ))}
            </div>

            <div style={styles.divider} />

            {/* Metadata */}
            <div style={styles.block}>
                <div style={styles.blockLabel}>ANALYSIS METADATA</div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    {[
                        ['Analyzed at', new Date().toLocaleTimeString()],
                        ['Engine', 'llama-3.3-70b'],
                        ['Method', 'BYOK · Groq API'],
                        ['Storage', 'localStorage'],
                        ['Version', 'v1.0.0'],
                    ].map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: 9, color: '#666', letterSpacing: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                                {k.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 12, color: '#ccc', fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    )
}

const styles = {
    card: {
        border: '1px solid',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#0d0d0d',
        animation: 'fadeSlideIn 0.3s ease'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: '1px solid',
        background: '#111'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
    headerTitle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13, color: '#ccc', fontWeight: 600
    },
    runId: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: '#333'
    },
    badge: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: 2,
        padding: '4px 10px', borderRadius: 4,
        border: '1px solid', fontWeight: 700
    },
    block: { padding: '14px 16px' },
    blockLabel: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, color: '#555', letterSpacing: 3,
        marginBottom: 10
    },
    logLine: {
        display: 'flex', gap: 12, padding: '3px 0',
        alignItems: 'flex-start',
        fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
        lineHeight: 1.7
    },
    lineNum: {
        color: '#2a2a2a', minWidth: 24,
        textAlign: 'right', userSelect: 'none',
        fontSize: 11, paddingTop: 1
    },
    lineText: { color: '#d1d5db', flex: 1 },
    divider: { borderTop: '1px solid #1a1a1a', margin: '0 16px' }
}