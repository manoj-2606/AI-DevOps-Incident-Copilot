const KEY = 'copilot_api_key'

export const saveApiKey = (key) => localStorage.setItem(KEY, key)
export const getApiKey = () => localStorage.getItem(KEY) || ''
export const clearApiKey = () => localStorage.removeItem(KEY)