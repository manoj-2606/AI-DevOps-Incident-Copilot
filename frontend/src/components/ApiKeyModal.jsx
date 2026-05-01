import { useState, useEffect } from 'react'
import { saveApiKey } from '../utils/storage'

const STEPS = [
    { num: '01', title: 'Go to console.groq.com', desc: 'Sign in with your Google account — free, no card needed' },
    { num: '02', title: 'Click "API Keys" → "Create API Key"', desc: 'Name it anything, copy the key starting with gsk_...' },
    { num: '03', title: 'Paste it below and click Initialize', desc: 'Stored only in your browser. Never sent to our servers.' },
]

export default function ApiKeyModal({ onSave }) {
    const [key, setKey] = useState('')
    const [activeStep, setActiveStep] = useState(0)
    const [glowing, setGlowing] = useState(true)

    useEffect(() => {
        const t1 = setTimeout(() => setActiveStep(1), 800)
        const t2 = setTimeout(() => setActiveStep(2), 1600)
        const t3 = setTimeout(() => setActiveStep(3), 2400)
        const t4 = setTimeout(() => setGlowing(false), 3200)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
    }, [])

    const handleSave = () => {
        if (!key.trim()) return
        saveApiKey(key.trim())
        onSave(key.trim())
    }

    return (
        <div style={s.overlay}>
            <style>{`
        @keyframes modalPop { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes stepGlow { 0%,100%{box-shadow:0 0 0 rgba(0,255,200,0)} 50%{box-shadow:0 0 20px rgba(0,255,200,0.15)} }
        @keyframes borderPulse {
          0%,100%{box-shadow:0 0 20px #00ffc810}
          50%{box-shadow:0 0 40px #00ffc830, 0 0 80px #00ffc810}
        }
        @keyframes gradientRotate {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

            <div style={{
                ...s.modal,
                animation: 'modalPop 0.4s ease, borderPulse 3s ease-in-out infinite'
            }}>

                {/* Header */}
                <div style={s.header}>
                    <div style={s.logoRow}>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                            <rect width="32" height="32" rx="8" fill="#0d1117" />
                            <rect width="32" height="32" rx="8" stroke="#00ffc820" strokeWidth="1" />
                            <path d="M7 12L13 16L7 20" stroke="#00ffc8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="16" y="11" width="9" height="2.5" rx="1.25" fill="#3b82f6" />
                            <rect x="16" y="15" width="7" height="2.5" rx="1.25" fill="#3b82f6" opacity="0.7" />
                            <rect x="16" y="19" width="9" height="2.5" rx="1.25" fill="#3b82f6" opacity="0.4" />
                        </svg>
                        <div>
                            <div style={s.logoTitle}>INCIDENT COPILOT</div>
                            <div style={s.logoSub}>AI-Powered DevOps Log Analyzer</div>
                        </div>
                    </div>
                    <div style={s.tag}>FREE SETUP · 2 MINUTES</div>
                </div>

                {/* Divider */}
                <div style={s.divider} />

                {/* Steps */}
                <div style={s.stepsLabel}>HOW TO GET YOUR FREE API KEY</div>
                <div style={s.steps}>
                    {STEPS.map((step, i) => {
                        const isActive = activeStep >= i
                        return (
                            <div
                                key={i}
                                style={{
                                    ...s.step,
                                    opacity: isActive ? 1 : 0.3,
                                    transform: isActive ? 'translateX(0)' : 'translateX(-8px)',
                                    transition: 'all 0.5s ease',
                                    background: isActive ? '#111' : '#0a0a0a',
                                    borderColor: isActive ? '#00ffc820' : '#1a1a1a',
                                    animation: isActive && glowing ? 'stepGlow 1.5s ease-in-out' : 'none'
                                }}
                            >
                                <div style={{
                                    ...s.stepNum,
                                    color: isActive ? '#00ffc8' : '#333',
                                    textShadow: isActive ? '0 0 12px #00ffc860' : 'none',
                                    transition: 'all 0.5s ease'
                                }}>
                                    {step.num}
                                </div>
                                <div style={s.stepContent}>
                                    <div style={{
                                        ...s.stepTitle,
                                        color: isActive ? '#ffffff' : '#444',
                                        transition: 'color 0.5s ease'
                                    }}>
                                        {step.title}
                                    </div>
                                    <div style={{
                                        ...s.stepDesc,
                                        color: isActive ? '#888' : '#333',
                                        transition: 'color 0.5s ease'
                                    }}>
                                        {step.desc}
                                    </div>
                                </div>
                                {isActive && (
                                    <div style={s.stepCheck}>✓</div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div style={s.divider} />

                {/* Input */}
                <div style={s.inputSection}>
                    <div style={s.inputLabel}>PASTE YOUR GROQ API KEY</div>
                    <input
                        type="password"
                        placeholder="gsk_..."
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        style={{
                            ...s.input,
                            borderColor: key ? '#00ffc840' : '#2a2a2a',
                            boxShadow: key ? '0 0 16px #00ffc810' : 'none'
                        }}
                        autoFocus
                    />
                    <div style={s.inputHint}>
                        Get your free key at{' '}
                        <span
                            style={{ color: '#00ffc8', cursor: 'pointer' }}
                            onClick={() => window.open('https://console.groq.com', '_blank')}
                        >
                            console.groq.com
                        </span>
                        {' '}— no credit card needed
                    </div>
                </div>

                {/* Button */}
                <div style={{
                    borderRadius: 9, padding: 1.5,
                    background: key.trim()
                        ? 'linear-gradient(90deg, #00ffc8, #3b82f6, #a855f7, #00ffc8)'
                        : '#1a1a1a',
                    backgroundSize: '300% 300%',
                    animation: key.trim() ? 'gradientRotate 2s ease infinite' : 'none'
                }}>
                    <button
                        onClick={handleSave}
                        disabled={!key.trim()}
                        style={{
                            ...s.button,
                            color: key.trim() ? '#000' : '#333',
                            background: key.trim() ? '#00ffc8' : '#0d0d0d',
                            cursor: key.trim() ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {key.trim() ? '⚡ Initialize Incident Copilot' : 'Paste your key above to continue'}
                    </button>
                </div>

                <div style={s.footer}>
                    Your key never leaves your browser · Zero server storage · BYOK model
                </div>
            </div>
        </div>
    )
}

const s = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 100,
        padding: 24
    },
    modal: {
        background: '#0a0a0a',
        border: '1px solid #00ffc820',
        borderRadius: 16, padding: '32px 36px',
        width: 520, maxWidth: '95vw',
        fontFamily: "'JetBrains Mono', monospace"
    },
    header: { marginBottom: 24 },
    logoRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
    logoTitle: { fontSize: 16, color: '#fff', fontWeight: 700, letterSpacing: 1 },
    logoSub: { fontSize: 11, color: '#555', marginTop: 2 },
    tag: {
        display: 'inline-block', fontSize: 10,
        color: '#00ffc8', letterSpacing: 3,
        padding: '4px 12px',
        border: '1px solid #00ffc820',
        borderRadius: 4, background: '#00ffc808'
    },
    divider: { borderTop: '1px solid #1a1a1a', margin: '24px 0' },
    stepsLabel: { fontSize: 9, color: '#444', letterSpacing: 3, marginBottom: 14 },
    steps: { display: 'flex', flexDirection: 'column', gap: 10 },
    step: {
        display: 'flex', alignItems: 'flex-start', gap: 16,
        padding: '14px 16px', borderRadius: 10,
        border: '1px solid'
    },
    stepNum: { fontSize: 20, fontWeight: 800, flexShrink: 0, lineHeight: 1, marginTop: 2 },
    stepContent: { flex: 1 },
    stepTitle: { fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 },
    stepDesc: { fontSize: 12, lineHeight: 1.6 },
    stepCheck: { color: '#00ffc8', fontSize: 16, flexShrink: 0, marginTop: 2 },
    inputSection: { marginBottom: 20 },
    inputLabel: { fontSize: 9, color: '#555', letterSpacing: 3, marginBottom: 10 },
    input: {
        width: '100%', padding: '14px 16px',
        borderRadius: 8, border: '1px solid',
        background: '#0d0d0d', color: '#fff',
        fontSize: 14, boxSizing: 'border-box',
        marginBottom: 10, outline: 'none',
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'all 0.3s'
    },
    inputHint: { fontSize: 11, color: '#444', lineHeight: 1.6 },
    button: {
        width: '100%', padding: '15px 0',
        borderRadius: 8, border: 'none',
        fontSize: 15, fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'all 0.2s', letterSpacing: 0.5
    },
    footer: {
        marginTop: 16, fontSize: 10,
        color: '#333', textAlign: 'center',
        letterSpacing: 1, lineHeight: 1.8
    }
}