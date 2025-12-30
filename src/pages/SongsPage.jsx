import { Link } from 'react-router-dom'
import { Music } from 'lucide-react'
import SongCard from '../components/SongCard'
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
                            <SongCard
                                key={song.id}
                                song={song}
                            />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Show categories
    return (
        <div style={{ paddingBottom: '80px' }}>
            <h2 className="page-title">
                <Music size={24} style={{ color: 'var(--color-accent)' }} />
                Пісні
            </h2>

            {!categories || categories.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state__icon">📂</span>
                    <p className="empty-state__text">Категорії завантажуються або відсутні</p>
                </div>
            ) : (
                <div className="categories-grid">
                    {categories.map(category => {
                        const songCount = getSongsByCategory(category.id)?.length || 0

                        return (
                            <button
                                key={category.id}
                                className="category-card"
                                onClick={() => setSelectedCategory(category)}
                            >
                                <div className="category-card__icon">
                                    {category.icon || '🎵'}
                                </div>
                                <div className="category-card__name">{category.name}</div>
                                <div className="category-card__count">({songCount})</div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Debug info (hidden in prod, but helpful if user reports black screen) */}
            {/* <div style={{display: 'none'}}>{JSON.stringify(categories)}</div> */}
        </div>
    )
}

export default SongsPage
