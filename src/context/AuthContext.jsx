import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [choirs, setChoirs] = useState([])
    const [currentChoir, setCurrentChoir] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Initialize auth
    useEffect(() => {
        initAuth()
    }, [])

    async function initAuth() {
        try {
            setLoading(true)

            // Check if running in Telegram
            const tg = window.Telegram?.WebApp

            if (tg?.initData) {
                // Authenticate with Telegram data
                const result = await api.authenticate(tg.initData)
                api.setUser(result.user.id)
                setUser(result.user)
                setChoirs(result.choirs)

                // Auto-select choir if only one
                if (result.choirs.length === 1) {
                    setCurrentChoir(result.choirs[0])
                }
            } else {
                // Development mode - use fake auth
                const devId = localStorage.getItem('dev_telegram_id') || '123456789'
                const result = await api.devAuth(devId, 'Dev User')
                api.setUser(result.user.id)
                setUser(result.user)
                setChoirs(result.choirs)
                localStorage.setItem('dev_telegram_id', devId)

                if (result.choirs.length === 1) {
                    setCurrentChoir(result.choirs[0])
                }
            }
        } catch (err) {
            console.error('Auth error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function refreshChoirs() {
        try {
            const result = await api.getChoirs()
            setChoirs(result.choirs)

            // Update current choir if exists
            if (currentChoir) {
                const updated = result.choirs.find(c => c.id === currentChoir.id)
                if (updated) {
                    setCurrentChoir(updated)
                } else {
                    setCurrentChoir(null)
                }
            }
        } catch (err) {
            console.error('Failed to refresh choirs:', err)
        }
    }

    async function createChoir(name) {
        const result = await api.createChoir(name)
        await refreshChoirs()
        setCurrentChoir(result.choir)
        return result.choir
    }

    async function joinChoir(code) {
        const result = await api.joinChoir(code)
        await refreshChoirs()
        setCurrentChoir(result.choir)
        return result
    }

    async function leaveChoir(choirId) {
        await api.leaveChoir(choirId)
        await refreshChoirs()
        if (currentChoir?.id === choirId) {
            setCurrentChoir(null)
        }
    }

    function selectChoir(choir) {
        setCurrentChoir(choir)
    }

    function clearChoir() {
        setCurrentChoir(null)
    }

    const value = {
        user,
        choirs,
        currentChoir,
        loading,
        error,
        isAdmin: currentChoir?.role === 'admin',
        createChoir,
        joinChoir,
        leaveChoir,
        selectChoir,
        clearChoir,
        refreshChoirs
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
