import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useSongs } from '../context/SongsContext'
import api from '../api/client'

function SongPage() {
    const { songId } = useParams()
    const navigate = useNavigate()
    const { getSongById } = useSongs()

    const song = getSongById(songId)

    if (!song) {
        return (
            <div className="empty-state">
                <span className="empty-state__icon">❓</span>
                <p className="empty-state__text">Пісню не знайдено</p>
                <button
                    onClick={() => navigate('/')}
                    style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Повернутися на головну
                </button>
            </div>
        )
    }

    const categoryNames = song.categories?.map(c => c.name).filter(Boolean) || []
    const pdfUrl = api.getPdfUrl(song.pdfPath)

    // Open PDF using Telegram's built-in viewer
    const openPdfInTelegram = () => {
        if (!pdfUrl) return

        // Use Telegram WebApp API to open link
        // This opens the PDF in Telegram's native viewer
        if (window.Telegram?.WebApp?.openLink) {
            window.Telegram.WebApp.openLink(pdfUrl)
        } else {
            // Fallback for development/browser
            window.open(pdfUrl, '_blank')
        }
    }

    return (
        <div className="song-page">
            <button className="song-page__back" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                Назад
            </button>

            <h1 className="song-page__title">{song.title}</h1>

            {categoryNames.length > 0 && (
                <div className="song-page__categories">
                    {categoryNames.map(name => (
                        <span key={name} className="song-page__category">{name}</span>
                    ))}
                </div>
            )}

            <hr className="song-page__divider" />

            {pdfUrl ? (
                <button
                    className="song-page__open-btn"
                    onClick={openPdfInTelegram}
                >
                    <FileText size={24} />
                    Відкрити ноти
                </button>
            ) : (
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    color: 'var(--color-text-muted)'
                }}>
                    📄 PDF ще не завантажено
                </div>
            )}
        </div>
    )
}

export default SongPage
