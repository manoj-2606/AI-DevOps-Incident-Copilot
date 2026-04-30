const API_KEY = 'copilot_api_key'
const HISTORY_KEY = 'copilot_history'

export const saveApiKey = (key) => localStorage.setItem(API_KEY, key)
export const getApiKey = () => localStorage.getItem(API_KEY) || ''
export const clearApiKey = () => localStorage.removeItem(API_KEY)

export const saveIncident = (incident) => {
    const history = getHistory()
    const newIncident = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...incident
    }
    history.unshift(newIncident)
    const trimmed = history.slice(0, 50)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
    return newIncident
}

export const getHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
        return []
    }
}

export const clearHistory = () => localStorage.removeItem(HISTORY_KEY)