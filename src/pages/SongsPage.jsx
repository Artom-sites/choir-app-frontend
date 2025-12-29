import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Music, ChevronRight } from 'lucide-react'
import { useSongs } from '../context/SongsContext'

function SongsPage() {
    const { categories, songs, getSongsByCategory, loading } = useSongs()
    const [selectedCategory, setSelectedCategory] = useState(null)

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <span className="loading__text">Завантаження...</span>
            </div>
        )
    }

    // Show songs for selected category
    if (selectedCategory) {
        const categorySongs = getSongsByCategory(selectedCategory.id)

        return (
            <div>
                <button
                    className="song-page__back"
                    onClick={() => setSelectedCategory(null)}
                    style={{ marginBottom: '16px' }}
                >
                    ← Всі категорії
                </button>

                <h2 className="page-title">
                    <span style={{ marginRight: '8px' }}>{selectedCategory.icon}</span>
                    {selectedCategory.name}
                </h2>

                {categorySongs.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-state__icon">📂</span>
                        <p className="empty-state__text">У цій категорії ще немає пісень</p>
                    </div>
                ) : (
                    <div className="songs-list">
                        {categorySongs.map(song => (
                            <Link
                                key={song.id}
                                to={`/song/${song.id}`}
                                className="song-card"
                            >
                                <div className="song-card__icon">
                                    <Music size={20} />
                                </div>
                                <div className="song-card__info">
                                    <div className="song-card__title">{song.title}</div>
                                    {song.author && (
                                        <div className="song-card__author">{song.author}</div>
                                    )}
                                </div>
                                <ChevronRight size={18} className="song-card__arrow" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Show categories
    return (
        <div>
            <h2 className="page-title">
                <Music size={20} />
                Пісні
            </h2>

            <div className="categories-grid">
                {categories.map(category => {
                    const songCount = getSongsByCategory(category.id).length

                    return (
                        <button
                            key={category.id}
                            className="category-card"
                            onClick={() => setSelectedCategory(category)}
                        >
                            <div className="category-card__icon">{category.icon}</div>
                            <div className="category-card__name">{category.name}</div>
                            <div className="category-card__count">({songCount})</div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default SongsPage
