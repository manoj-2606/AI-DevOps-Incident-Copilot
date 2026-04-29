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
                <h2 style={styles.title}>Enter Your Anthropic API Key</h2>
                <p style={styles.sub}>
                    Get your free key at console.groq.com — stored only in your browser.
                </p>
                <input
                    type="password"
                    placeholder="gsk_..."
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    style={styles.input}
                />
                <button onClick={handleSave} style={styles.button}>
                    Save & Continue
                </button>
            </div>
        </div>
    )
}

const styles = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100
    },
    modal: {
        background: '#1a1a2e', border: '1px solid #333',
        borderRadius: 12, padding: 32, width: 420, maxWidth: '90vw'
    },
    title: { color: '#fff', marginBottom: 8, fontSize: 20 },
    sub: { color: '#888', fontSize: 13, marginBottom: 20 },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: 8,
        border: '1px solid #444', background: '#0f0f1a',
        color: '#fff', fontSize: 14, boxSizing: 'border-box', marginBottom: 16
    },
    button: {
        width: '100%', padding: '11px 0', borderRadius: 8,
        background: '#4f46e5', color: '#fff', border: 'none',
        fontSize: 15, cursor: 'pointer', fontWeight: 600
    }
}