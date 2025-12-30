import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import api from '../api/client'

function SongPage() {
    const { songId } = useParams()
    const navigate = useNavigate()
    const { getSongById } = useSongs()

    // Try to get from context first, otherwise load from API
    const contextSong = getSongById(songId)
    const [song, setSong] = useState(contextSong)
    const [loading, setLoading] = useState(!contextSong)

    useEffect(() => {
        // If song not in context, fetch from API
        if (!contextSong && songId) {
            loadSong()
        }
    }, [songId, contextSong])

    async function loadSong() {
        setLoading(true)
        try {
            const result = await api.getSong(songId)
            setSong(result.song)
        } catch (err) {
            console.error('Failed to load song:', err)
        } finally {
            setLoading(false)
        }
    }

    // Update local state if context changes
    useEffect(() => {
        if (contextSong) {
            setSong(contextSong)
        }
    }, [contextSong])

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <span className="loading__text">Завантаження...</span>
            </div>
        )
    }

    if (!song) {
        return (
            <div style={{ padding: '0 0 80px 0' }}>
                <button className="song-page__back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                    Назад
                </button>
                <div className="empty-state">
                    <span className="empty-state__icon">😕</span>
                    <p className="empty-state__text">Пісню не знайдено</p>
                </div>
            </div>
        )
    }

    const categoryNames = song.categories?.map(c => c.name).filter(Boolean) || []

    function handleOpenPdf() {
        if (!song.pdfPath) return

        // Use Google Docs Viewer for reliable PDF viewing on mobile
        const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(song.pdfPath)}&embedded=true`

        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openLink(viewerUrl)
        } else {
            window.open(viewerUrl, '_blank')
        }
    }

    return (
        <div style={{ padding: '0 0 80px 0' }}>
            <button className="song-page__back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h1 className="song-page__title">{song.title}</h1>

            {song.author && (
                <div className="song-page__author">{song.author}</div>
            )}

            {categoryNames.length > 0 && (
                <div className="song-page__categories">
                    {categoryNames.map(name => (
                        <span key={name} className="song-page__category">{name}</span>
                    ))}
                </div>
            )}

            <hr className="song-page__divider" />

            {song.pdfPath ? (
                <button
                    className="song-page__open-btn"
                    onClick={handleOpenPdf}
                >
                    <FileText size={20} />
                    Відкрити ноти
                </button>
            ) : (
                <div className="empty-state">
                    <p className="empty-state__text">PDF файл відсутній</p>
                </div>
            )}

            <div style={{ marginTop: '24px', opacity: 0.6, fontSize: '0.8rem', textAlign: 'center' }}>
                <p>ID: {song.id}</p>
            </div>
        </div>
    )
}

export default SongPage
