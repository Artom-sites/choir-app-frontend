import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, X, GripVertical } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import { useAuth } from '../context/AuthContext'

function SetRepertoirePage() {
    const navigate = useNavigate()
    const { songs, todayRepertoire, setRepertoire, refresh } = useSongs()
    const { isAdmin } = useAuth()

    const [selectedSongs, setSelectedSongs] = useState([])
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    // Initialize with current repertoire
    useEffect(() => {
        if (todayRepertoire.songs?.length > 0) {
            setSelectedSongs(todayRepertoire.songs.map(s => s.id))
        }
    }, [todayRepertoire])

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">🔒</span>
                <p className="empty-state__text">Доступ тільки для керівників</p>
            </div>
        )
    }

    function toggleSong(songId) {
        setSelectedSongs(prev =>
            prev.includes(songId)
                ? prev.filter(id => id !== songId)
                : [...prev, songId]
        )
        setSaved(false)
    }

    function moveSong(songId, direction) {
        const index = selectedSongs.indexOf(songId)
        if (index === -1) return

        const newIndex = direction === 'up' ? index - 1 : index + 1
        if (newIndex < 0 || newIndex >= selectedSongs.length) return

        const newList = [...selectedSongs]
            ;[newList[index], newList[newIndex]] = [newList[newIndex], newList[index]]
        setSelectedSongs(newList)
        setSaved(false)
    }

    async function handleSave() {
        setLoading(true)
        try {
            const today = new Date().toISOString().split('T')[0]
            await setRepertoire(today, selectedSongs)
            setSaved(true)
            setTimeout(() => navigate('/'), 1000)
        } catch (err) {
            console.error('Failed to save repertoire:', err)
        } finally {
            setLoading(false)
        }
    }

    const today = new Date().toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div>
            <button className="song-page__back" onClick={() => navigate('/admin')}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h2 className="page-title">
                <Calendar size={20} />
                Репертуар на сьогодні
            </h2>

            <p style={{
                color: 'var(--color-text-muted)',
                marginBottom: '16px',
                fontSize: '0.875rem'
            }}>
                {today}
            </p>

            {songs.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state__icon">📂</span>
                    <p className="empty-state__text">
                        Спочатку додайте пісні до бібліотеки хору
                    </p>
                </div>
            ) : (
                <>
                    {/* Selected songs */}
                    {selectedSongs.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: '12px'
                            }}>
                                Обрані пісні ({selectedSongs.length}):
                            </h3>
                            {selectedSongs.map((songId, index) => {
                                const song = songs.find(s => s.id === songId)
                                if (!song) return null
                                return (
                                    <div
                                        key={songId}
                                        className="song-card"
                                        style={{ cursor: 'default', paddingRight: '0' }}
                                    >
                                        <span className="song-card__number">
                                            {index + 1}
                                        </span>
                                        <div className="song-card__content">
                                            <div className="song-card__title">{song.title}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => moveSong(songId, 'up')}
                                                disabled={index === 0}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: index === 0 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                                                    cursor: index === 0 ? 'default' : 'pointer',
                                                    padding: '8px'
                                                }}
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveSong(songId, 'down')}
                                                disabled={index === selectedSongs.length - 1}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: index === selectedSongs.length - 1 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                                                    cursor: index === selectedSongs.length - 1 ? 'default' : 'pointer',
                                                    padding: '8px'
                                                }}
                                            >
                                                ↓
                                            </button>
                                            <button
                                                onClick={() => toggleSong(songId)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--color-error)',
                                                    cursor: 'pointer',
                                                    padding: '8px'
                                                }}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* All songs */}
                    <h3 style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '12px'
                    }}>
                        Усі пісні:
                    </h3>
                    {songs.filter(s => !selectedSongs.includes(s.id)).map(song => (
                        <button
                            key={song.id}
                            onClick={() => toggleSong(song.id)}
                            className="song-card"
                            style={{ width: '100%', textAlign: 'left' }}
                        >
                            <span className="song-card__number" style={{ background: 'var(--color-border)' }}>
                                +
                            </span>
                            <div className="song-card__content">
                                <h3 className="song-card__title">{song.title}</h3>
                                {song.author && (
                                    <div className="song-card__categories">
                                        <span className="song-card__category">{song.author}</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}

                    {/* Save button */}
                    <button
                        className="song-page__open-btn"
                        style={{
                            marginTop: '24px',
                            background: saved ? 'var(--color-success)' : undefined
                        }}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {saved ? (
                            <>
                                <Check size={20} />
                                Збережено!
                            </>
                        ) : loading ? (
                            'Збереження...'
                        ) : (
                            `Зберегти репертуар (${selectedSongs.length})`
                        )}
                    </button>
                </>
            )}
        </div>
    )
}

export default SetRepertoirePage
