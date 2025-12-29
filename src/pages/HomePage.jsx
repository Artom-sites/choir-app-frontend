import { useSongs } from '../context/SongsContext'
import SongCard from '../components/SongCard'

function HomePage() {
    const { todayRepertoire, loading } = useSongs()

    if (loading) {
        return (
            <div className="loading">
                <div className="loading__spinner" />
                <span className="loading__text">Завантаження...</span>
            </div>
        )
    }

    const today = new Date().toLocaleDateString('uk-UA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    return (
        <div>
            <section className="today-section">
                <div className="today-section__header">
                    <span className="today-section__icon">🎶</span>
                    <h2 className="today-section__title">Репертуар на сьогодні</h2>
                    <span className="today-section__date">{today}</span>
                </div>

                {todayRepertoire.songs?.length > 0 ? (
                    <div>
                        {todayRepertoire.songs.map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                number={index + 1}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <span className="empty-state__icon">📋</span>
                        <p className="empty-state__text">
                            Репертуар ще не призначено.<br />
                            Перевірте пізніше 🙏
                        </p>
                    </div>
                )}
            </section>
        </div>
    )
}

export default HomePage
