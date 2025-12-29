import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

function PDFViewer({ url, title, onClose }) {
    const canvasRef = useRef(null)
    const [pdfDoc, setPdfDoc] = useState(null)
    const [pageNum, setPageNum] = useState(1)
    const [pageCount, setPageCount] = useState(0)
    const [scale, setScale] = useState(1.0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Load PDF document
    useEffect(() => {
        let isMounted = true
        setLoading(true)
        setError(null)

        pdfjsLib.getDocument(url).promise
            .then(pdf => {
                if (isMounted) {
                    setPdfDoc(pdf)
                    setPageCount(pdf.numPages)
                    setLoading(false)
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error('Error loading PDF:', err)
                    setError('Не вдалося завантажити ноти')
                    setLoading(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [url])

    // Render current page
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current) return

        let isMounted = true

        pdfDoc.getPage(pageNum).then(page => {
            if (!isMounted) return

            const canvas = canvasRef.current
            const context = canvas.getContext('2d')

            const viewport = page.getViewport({ scale })
            canvas.height = viewport.height
            canvas.width = viewport.width

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            }

            page.render(renderContext)
        })

        return () => {
            isMounted = false
        }
    }, [pdfDoc, pageNum, scale])

    const prevPage = () => {
        if (pageNum > 1) {
            setPageNum(pageNum - 1)
        }
    }

    const nextPage = () => {
        if (pageNum < pageCount) {
            setPageNum(pageNum + 1)
        }
    }

    const zoomIn = () => {
        setScale(s => Math.min(s + 0.25, 3.0))
    }

    const zoomOut = () => {
        setScale(s => Math.max(s - 0.25, 0.5))
    }

    return (
        <div className="pdf-viewer">
            <div className="pdf-viewer__header">
                <button className="pdf-viewer__close" onClick={onClose}>
                    <X size={20} />
                    <span>Закрити</span>
                </button>

                <span className="pdf-viewer__title">{title}</span>

                <div className="pdf-viewer__zoom">
                    <button onClick={zoomOut} disabled={scale <= 0.5}>
                        <ZoomOut size={18} />
                    </button>
                    <span>{Math.round(scale * 100)}%</span>
                    <button onClick={zoomIn} disabled={scale >= 3.0}>
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            <div className="pdf-viewer__content">
                {loading && (
                    <div className="loading">
                        <div className="loading__spinner" />
                        <span className="loading__text">Завантаження нот...</span>
                    </div>
                )}

                {error && (
                    <div className="empty-state">
                        <span className="empty-state__icon">📄</span>
                        <p className="empty-state__text">{error}</p>
                    </div>
                )}

                {!loading && !error && (
                    <canvas ref={canvasRef} className="pdf-viewer__canvas" />
                )}
            </div>

            {!loading && !error && pageCount > 0 && (
                <div className="pdf-viewer__footer">
                    <button
                        className="pdf-viewer__nav-btn"
                        onClick={prevPage}
                        disabled={pageNum <= 1}
                    >
                        <ChevronLeft size={20} />
                        <span>Попередня</span>
                    </button>

                    <span className="pdf-viewer__page-info">
                        {pageNum} / {pageCount}
                    </span>

                    <button
                        className="pdf-viewer__nav-btn"
                        onClick={nextPage}
                        disabled={pageNum >= pageCount}
                    >
                        <span>Наступна</span>
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    )
}

export default PDFViewer
