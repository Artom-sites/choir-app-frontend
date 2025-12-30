import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useSongs } from '../context/SongsContext'

function SongPage() {
    const { songId } = useParams()
    const navigate = useNavigate()
    const { getSongById } = useSongs()
    const song = getSongById(songId)

    if (!song) return null

    const categoryNames = song.categories?.map(c => c.name).filter(Boolean) || []

    function handleOpenPdf() {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openLink(song.pdfPath, { try_instant_view: false })
        } else {
            window.open(song.pdfPath, '_blank')
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
