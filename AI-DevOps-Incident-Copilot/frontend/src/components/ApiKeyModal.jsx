import { useState } from 'react'
import { saveApiKey } from '../utils/storage'

export default function ApiKeyModal({ onSave }) {
    const [key, setKey] = useState('')

    const handleSave = () => {
        if (!key.trim()) return
        saveApiKey(key.trim())
        onSave(key.trim())
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.tag}>SETUP REQUIRED</div>
                <h2 style={styles.title}>Connect your<br />AI engine</h2>
                <p style={styles.sub}>
                    Get a free key at <span style={styles.link}>console.groq.com</span><br />
                    Stored locally. Never touches our servers.
                </p>
                <input
                    type="password"
                    placeholder="gsk_..."
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    style={styles.input}
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    style={styles.button}
                    onMouseEnter={e => e.target.style.background = '#00e5b3'}
                    onMouseLeave={e => e.target.style.background = '#00ffc8'}
                >
                    Initialize →
                </button>
            </div>
        </div>
    )
}

const styles = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100
    },
    modal: {
        background: '#0d0d0d',
        border: '1px solid #1e1e1e',
        borderRadius: 16, padding: '40px 36px',
        width: 440, maxWidth: '90vw',
        boxShadow: '0 0 80px rgba(0,255,200,0.06)'
    },
    tag: {
        display: 'inline-block',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, letterSpacing: 3,
        color: '#00ffc8', marginBottom: 20,
        padding: '4px 10px',
        border: '1px solid #00ffc820',
        borderRadius: 4
    },
    title: {
        fontFamily: "'Syne', sans-serif",
        fontSize: 32, fontWeight: 800,
        color: '#fff', margin: '0 0 16px',
        lineHeight: 1.15
    },
    sub: {
        fontFamily: "'JetBrains Mono', monospace",
        color: '#555', fontSize: 12,
        lineHeight: 1.8, marginBottom: 28
    },
    link: { color: '#00ffc8' },
    input: {
        width: '100%', padding: '14px 16px',
        borderRadius: 8, border: '1px solid #222',
        background: '#111', color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13, boxSizing: 'border-box',
        marginBottom: 16, outline: 'none'
    },
    button: {
        width: '100%', padding: '14px 0',
        borderRadius: 8, background: '#00ffc8',
        color: '#000', border: 'none',
        fontFamily: "'Syne', sans-serif",
        fontSize: 15, fontWeight: 700,
        cursor: 'pointer', transition: 'background 0.2s'
    }
}