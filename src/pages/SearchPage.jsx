import { useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import SongCard from '../components/SongCard'

function SearchPage() {
    const { searchQuery, setSearchQuery, searchSongs, songs, loading } = useSongs()
    const inputRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const clearSearch = () => {
        setSearchQuery('')
        inputRef.current?.focus()
    }

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <span className="loading__text">Завантаження...</span>
            </div>
        )
    }

    return (
        <div>
            <h2 className="page-title">
                <Search size={20} />
                Пошук пісні
            </h2>

            <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    className="search-input"
                    placeholder="Введіть назву..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className="search-clear" onClick={clearSearch}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {songs.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state__icon">📂</span>
                    <p className="empty-state__text">
                        В бібліотеці хору ще немає пісень
                    </p>
                </div>
            ) : searchQuery.trim() ? (
                <div>
                    {searchSongs.length > 0 ? (
                        <>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-muted)',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                Знайдено: {searchSongs.length}
                            </p>
                            {searchSongs.map(song => (
                                <SongCard key={song.id} song={song} />
                            ))}
                        </>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-state__icon">🔍</span>
                            <p className="empty-state__text">
                                Нічого не знайдено.<br />
                                Спробуйте іншу назву
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="empty-state">
                    <span className="empty-state__icon">🎵</span>
                    <p className="empty-state__text">
                        Почніть вводити назву пісні
                    </p>
                </div>
            )}
        </div>
    )
}

export default SearchPage
