import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import History from './pages/History'
import { useEffect } from 'react'

export default function App() {
    useEffect(() => {
        const link = document.createElement('link')
        link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
        link.rel = 'stylesheet'
        document.head.appendChild(link)
    }, [])

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/history" element={<History />} />
            </Routes>
        </BrowserRouter>
    )
}