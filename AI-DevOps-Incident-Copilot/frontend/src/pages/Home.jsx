import { useState } from 'react'
import { getApiKey, clearApiKey } from '../utils/storage'
import ApiKeyModal from '../components/ApiKeyModal'
import LogInput from '../components/LogInput'
import AnalysisCard from '../components/AnalysisCard'
import { Link } from 'react-router-dom'

export default function Home() {
    const [apiKey, setApiKey] = useState(getApiKey())
    const [log, setLog] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleAnalyze = async () => {
        setError('')
        setResult(null)
        setLoading(true)

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
        } catch (e) {
            setError(e.message || 'Something went wrong')
        }

        setLoading(false)
    }

    const handleReset = () => {
        clearApiKey()
        setApiKey('')
        setResult(null)
        setLog('')
    }

    return (
        <div style={styles.page}>
            {!apiKey && <ApiKeyModal onSave={setApiKey} />}

            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>AI DevOps Incident Copilot</h1>
                    <p style={styles.sub}>Paste a failed pipeline log. Get root cause + fix instantly.</p>
                </div>
                <div style={styles.nav}>
                    <Link to="/history" style={styles.link}>History</Link>
                    <button onClick={handleReset} style={styles.resetBtn}>Reset Key</button>
                </div>
            </div>

            <LogInput
                value={log}
                onChange={setLog}
                onAnalyze={handleAnalyze}
                loading={loading}
            />

            {error && <p style={styles.error}>{error}</p>}

            <AnalysisCard result={result} />
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh', background: '#0f0f1a',
        color: '#fff', padding: '40px 24px', maxWidth: 760, margin: '0 auto'
    },
    header: {
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 32
    },
    title: { fontSize: 26, fontWeight: 700, margin: 0 },
    sub: { color: '#888', fontSize: 14, marginTop: 6 },
    nav: { display: 'flex', gap: 12, alignItems: 'center' },
    link: { color: '#4f46e5', fontSize: 14, textDecoration: 'none' },
    resetBtn: {
        background: 'transparent', border: '1px solid #444',
        color: '#888', borderRadius: 6, padding: '6px 12px',
        fontSize: 13, cursor: 'pointer'
    },
    error: { color: '#ef4444', fontSize: 14, marginTop: 12 }
}