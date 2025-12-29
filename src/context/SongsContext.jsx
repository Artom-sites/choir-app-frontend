import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useAuth } from './AuthContext'
import api from '../api/client'

const SongsContext = createContext()

export function SongsProvider({ children }) {
    const { currentChoir, isAdmin } = useAuth()

    const [songs, setSongs] = useState([])
    const [categories, setCategories] = useState([])
    const [todayRepertoire, setTodayRepertoire] = useState({ date: '', songs: [] })
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)

    // Load categories once
    useEffect(() => {
        loadCategories()
    }, [])

    // Load choir-specific data when choir changes
    useEffect(() => {
        if (currentChoir) {
            loadChoirData()
        } else {
            setSongs([])
            setTodayRepertoire({ date: '', songs: [] })
        }
    }, [currentChoir?.id])

    async function loadCategories() {
        try {
            const result = await api.getCategories()
            setCategories(result.categories)
        } catch (err) {
            console.error('Failed to load categories:', err)
        }
    }

    async function loadChoirData() {
        if (!currentChoir) return

        setLoading(true)
        try {
            // Load choir songs
            const songsResult = await api.getSongs({ choirId: currentChoir.id })
            setSongs(songsResult.songs)

            // Load today's repertoire
            const repertoireResult = await api.getTodayRepertoire(currentChoir.id)
            setTodayRepertoire(repertoireResult)
        } catch (err) {
            console.error('Failed to load choir data:', err)
        } finally {
            setLoading(false)
        }
    }

    async function loadPublicSongs() {
        try {
            const result = await api.getSongs()
            return result.songs
        } catch (err) {
            console.error('Failed to load public songs:', err)
            return []
        }
    }

    // Search songs with fuzzy matching
    const searchSongs = useMemo(() => {
        if (!searchQuery.trim()) return []

        const query = searchQuery.toLowerCase().trim()
        return songs.filter(song => {
            const title = song.title.toLowerCase()
            const author = (song.author || '').toLowerCase()
            return title.includes(query) || author.includes(query)
        })
    }, [searchQuery, songs])

    // Get songs by category
    function getSongsByCategory(categoryId) {
        return songs.filter(song =>
            song.categories?.some(c => String(c.id) === String(categoryId))
        )
    }

    // Get song by ID
    function getSongById(songId) {
        return songs.find(song => String(song.id) === String(songId))
    }

    // Get category by ID
    function getCategoryById(categoryId) {
        return categories.find(cat => String(cat.id) === String(categoryId))
    }

    // Get category names for a song
    function getCategoryNames(song) {
        if (!song?.categories) return []
        return song.categories.map(c => c.name).filter(Boolean)
    }

    // Admin functions
    async function addSongToChoir(songId) {
        if (!currentChoir || !isAdmin) return
        await api.addSongToChoir(currentChoir.id, songId)
        await loadChoirData()
    }

    async function removeSongFromChoir(songId) {
        if (!currentChoir || !isAdmin) return
        await api.removeSongFromChoir(currentChoir.id, songId)
        await loadChoirData()
    }

    async function setRepertoire(date, songIds) {
        if (!currentChoir || !isAdmin) return
        await api.setRepertoire(currentChoir.id, date, songIds)
        await loadChoirData()
    }

    async function createSong(formData) {
        if (!currentChoir || !isAdmin) return
        formData.append('choirId', currentChoir.id)
        const result = await api.createSong(formData)
        await loadChoirData()
        return result.song
    }

    const value = {
        songs,
        categories,
        todayRepertoire,
        searchQuery,
        setSearchQuery,
        searchSongs,
        loading,
        getSongsByCategory,
        getSongById,
        getCategoryById,
        getCategoryNames,
        loadPublicSongs,
        refresh: loadChoirData,
        // Admin
        addSongToChoir,
        removeSongFromChoir,
        setRepertoire,
        createSong
    }

    return (
        <SongsContext.Provider value={value}>
            {children}
        </SongsContext.Provider>
    )
}

export function useSongs() {
    const context = useContext(SongsContext)
    if (!context) {
        throw new Error('useSongs must be used within a SongsProvider')
    }
    return context
}
