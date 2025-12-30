import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import { Home, Search, FolderOpen, Settings, Music } from 'lucide-react'
import LoadingScreen from './components/LoadingScreen'
import BottomNav from './components/BottomNav'
import ChoirSelector from './pages/ChoirSelector'
import JoinChoirPage from './pages/JoinChoirPage'
import CreateChoirPage from './pages/CreateChoirPage'
import SearchChoirPage from './pages/SearchChoirPage'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import SongsPage from './pages/SongsPage'
import CategoriesPage from './pages/CategoriesPage'
import CategorySongsPage from './pages/CategorySongsPage'
import SongPage from './pages/SongPage'
import AdminPage from './pages/AdminPage'
import AddSongPage from './pages/AddSongPage'
import SetRepertoirePage from './pages/SetRepertoirePage'
import AddFromLibraryPage from './pages/AddFromLibraryPage'
import BotSongsPage from './pages/BotSongsPage'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SongsProvider } from './context/SongsContext'


function Sidebar() {
  const { currentChoir, isAdmin, clearChoir } = useAuth()

  if (!currentChoir) return null

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Music size={28} />
        Репертуар
      </div>

      <nav className="sidebar__nav">
        <NavLink
          to="/"
          className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}
          end
        >
          <Home size={22} />
          Головна
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}
        >
          <Search size={22} />
          Пошук
        </NavLink>

        <NavLink
          to="/categories"
          className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}
        >
          <FolderOpen size={22} />
          Категорії
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `sidebar__item ${isActive ? 'active' : ''}`}
          >
            <Settings size={22} />
            Керування
          </NavLink>
        )}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__choir">
          <div className="sidebar__choir-name">{currentChoir.name}</div>
          <div className="sidebar__choir-code">{currentChoir.inviteCode}</div>
        </div>
        <button
          onClick={clearChoir}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '10px',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            color: 'var(--color-text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer'
          }}
        >
          Змінити хор
        </button>
      </div>
    </aside>
  )
}

function MobileHeader() {
  const { currentChoir } = useAuth()

  return (
    <header className="header">
      <h1 className="header__title">
        <Music size={20} />
        {currentChoir ? currentChoir.name : 'Хоровий Репертуар'}
      </h1>
    </header>
  )
}

function AppRoutes() {
  const { currentChoir, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  // No choir selected - show choir selector
  if (!currentChoir) {
    return (
      <div className="app">
        <MobileHeader />
        <main className="main">
          <Routes>
            <Route path="/" element={<ChoirSelector />} />
            <Route path="/join" element={<JoinChoirPage />} />
            <Route path="/create" element={<CreateChoirPage />} />
            <Route path="/search-choir" element={<SearchChoirPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    )

  }

  // Choir selected - show full app with sidebar
  return (
    <SongsProvider>
      <div className="app">
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <MobileHeader />
          <main className="main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/songs" element={<SongsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:categoryId" element={<CategorySongsPage />} />
              <Route path="/song/:songId" element={<SongPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/add-song" element={<AddSongPage />} />
              <Route path="/admin/repertoire" element={<SetRepertoirePage />} />
              <Route path="/admin/set-repertoire" element={<SetRepertoirePage />} />
              <Route path="/admin/library" element={<AddFromLibraryPage />} />
              <Route path="/admin/bot-songs" element={<BotSongsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </div>
    </SongsProvider>
  )
}

function App() {
  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()

      // Set theme colors from Telegram
      if (tg.themeParams) {
        document.documentElement.style.setProperty(
          '--tg-theme-bg-color',
          tg.themeParams.bg_color || '#0a0a0f'
        )
      }
    }
  }, [])

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
