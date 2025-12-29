import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Library, Plus, Check } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import { useAuth } from '../context/AuthContext'

function AddFromLibraryPage() {
    const navigate = useNavigate()
    const { songs, loadPublicSongs, addSongToChoir } = useSongs()
    const { isAdmin } = useAuth()

    const [publicSongs, setPublicSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState({})

    useEffect(() => {
        loadSongs()
    }, [])

    async function loadSongs() {
        setLoading(true)
        try {
            const allSongs = await loadPublicSongs()
            // Filter out songs already in choir
            const choirSongIds = songs.map(s => s.id)
            const available = allSongs.filter(s => !choirSongIds.includes(s.id))
            setPublicSongs(available)
        } catch (err) {
            console.error('Failed to load public songs:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">🔒</span>
                <p className="empty-state__text">Доступ тільки для керівників</p>
            </div>
        )
    }

    async function handleAdd(songId) {
        setAdding(prev => ({ ...prev, [songId]: true }))
        try {
            await addSongToChoir(songId)
            setPublicSongs(prev => prev.filter(s => s.id !== songId))
        } catch (err) {
            console.error('Failed to add song:', err)
        } finally {
            setAdding(prev => ({ ...prev, [songId]: false }))
        }
    }

    return (
        <div>
            <button className="song-page__back" onClick={() => navigate('/admin')}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h2 className="page-title">
                <Library size={20} />
                Бібліотека пісень
            </h2>

            <p style={{
                color: 'var(--color-text-muted)',
                marginBottom: '24px',
                fontSize: '0.875rem'
            }}>
                Додайте пісні з загальної бібліотеки до вашого хору
            </p>

            {loading ? (
                <div className="loading">
                    <div className="loading__spinner" />
                    <span className="loading__text">Завантаження...</span>
                </div>
            ) : publicSongs.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state__icon">✓</span>
                    <p className="empty-state__text">
                        Всі доступні пісні вже додано до вашого хору
                    </p>
                </div>
            ) : (
                <div>
                    {publicSongs.map(song => (
                        <div
                            key={song.id}
                            className="song-card"
                            style={{ cursor: 'default' }}
                        >
                            <div className="song-card__content">
                                <h3 className="song-card__title">{song.title}</h3>
                                <div className="song-card__categories">
                                    {song.author && (
                                        <span className="song-card__category">{song.author}</span>
                                    )}
                                    {song.categories?.map(c => (
                                        <span key={c.id} className="song-card__category">{c.name}</span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => handleAdd(song.id)}
                                disabled={adding[song.id]}
                                style={{
                                    background: 'var(--color-accent)',
                                    color: 'var(--color-primary)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600'
                                }}
                            >
                                {adding[song.id] ? (
                                    '...'
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Додати
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default AddFromLibraryPage
