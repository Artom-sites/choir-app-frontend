import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileUp, Eye, Tag, Check } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

function BotSongsPage() {
    const navigate = useNavigate()
    const { categories, refreshSongs } = useSongs()
    const { isAdmin } = useAuth()

    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSong, setSelectedSong] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [updating, setUpdating] = useState(false)

    useEffect(() => {
        loadBotSongs()
    }, [])

    async function loadBotSongs() {
        setLoading(true)
        try {
            // Load songs without any category - these are bot-uploaded
            const result = await api.request('/api/songs/uncategorized')
            setSongs(result.songs || [])
        } catch (err) {
            console.error('Failed to load songs:', err)
        } finally {
            setLoading(false)
        }
    }

    async function handleCategoryChange(songId, categoryId) {
        setUpdating(true)
        try {
            await api.request(`/api/songs/${songId}/category`, {
                method: 'PUT',
                body: JSON.stringify({ categoryId })
            })
            // Remove from list (song now has a category)
            setSongs(prev => prev.filter(s => s.id !== songId))
            setSelectedSong(null)
            setSelectedCategory(null)
            await refreshSongs()
        } catch (err) {
            console.error('Failed to update category:', err)
            alert('Помилка оновлення категорії')
        } finally {
            setUpdating(false)
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

    return (
        <div>
            <button className="song-page__back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h2 className="page-title">
                <FileUp size={20} />
                Пісні з бота
            </h2>

            <p style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: '16px'
            }}>
                Тут відображаються пісні, завантажені через бота.
                Призначте їм категорію або перегляньте.
            </p>

            {loading ? (
                <div className="empty-state">
                    <span className="empty-state__icon">⏳</span>
                    <p className="empty-state__text">Завантаження...</p>
                </div>
            ) : songs.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state__icon">📭</span>
                    <p className="empty-state__text">Немає нових пісень</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '8px' }}>
                        Надішліть PDF файл боту @musicviewer_bot
                    </p>
                </div>
            ) : (
                <div className="songs-list">
                    {songs.map(song => (
                        <div key={song.id} className="song-card">
                            <span className="song-card__number">
                                {song.title.charAt(0).toUpperCase()}
                            </span>
                            <div className="song-card__content">
                                <h3 className="song-card__title">{song.title}</h3>
                                <div className="song-card__categories">
                                    <span className="song-card__category" style={{ opacity: 0.5, fontStyle: 'italic' }}>Без категорії</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Link
                                    to={`/song/${song.id}`}
                                    className="btn btn--small"
                                    style={{
                                        background: 'var(--color-surface)',
                                        color: 'var(--color-text)',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Eye size={16} />
                                </Link>
                                <button
                                    onClick={() => {
                                        setSelectedSong(song)
                                        setSelectedCategory(null)
                                    }}
                                    style={{
                                        background: 'var(--color-accent)',
                                        color: 'white',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Tag size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Category Selection Modal */}
            {selectedSong && (
                <>
                    <div
                        className="fab-backdrop"
                        onClick={() => setSelectedSong(null)}
                    />
                    <div style={{
                        position: 'fixed',
                        bottom: '80px',
                        left: '16px',
                        right: '16px',
                        background: 'var(--color-surface)',
                        borderRadius: '16px',
                        padding: '16px',
                        zIndex: 1001,
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <h3 style={{ marginBottom: '12px' }}>
                            Обрати категорію для "{selectedSong.title}"
                        </h3>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            {categories?.filter(c => c.id !== 10).map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: selectedCategory === cat.id
                                            ? '2px solid var(--color-accent)'
                                            : '1px solid var(--color-border)',
                                        background: selectedCategory === cat.id
                                            ? 'var(--color-accent)'
                                            : 'var(--color-background)',
                                        color: selectedCategory === cat.id
                                            ? 'white'
                                            : 'var(--color-text)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {cat.icon} {cat.name}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => selectedCategory && handleCategoryChange(selectedSong.id, selectedCategory)}
                            disabled={!selectedCategory || updating}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: 'none',
                                background: selectedCategory ? 'var(--color-accent)' : 'var(--color-border)',
                                color: selectedCategory ? 'white' : 'var(--color-text-muted)',
                                cursor: selectedCategory ? 'pointer' : 'not-allowed',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {updating ? 'Оновлення...' : (
                                <>
                                    <Check size={18} />
                                    Зберегти
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default BotSongsPage
