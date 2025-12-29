const API_URL = import.meta.env.VITE_API_URL || 'https://choir-app-backend-production.up.railway.app'

class ApiClient {
    constructor() {
        this.userId = null
        this.token = null
    }

    setUser(userId) {
        this.userId = userId
    }

    async request(endpoint, options = {}) {
        const url = `${API_URL}${endpoint}`

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }

        if (this.userId) {
            headers['X-User-Id'] = this.userId
        }

        const response = await fetch(url, {
            ...options,
            headers
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(error.error || `HTTP ${response.status}`)
        }

        return response.json()
    }

    // Auth
    async authenticate(initData) {
        return this.request('/api/auth', {
            method: 'POST',
            body: JSON.stringify({ initData })
        })
    }

    async devAuth(telegramId, name) {
        return this.request('/api/auth/dev', {
            method: 'POST',
            body: JSON.stringify({ telegramId, name })
        })
    }

    // Choirs
    async getChoirs() {
        return this.request('/api/choirs')
    }

    async createChoir(name) {
        return this.request('/api/choirs', {
            method: 'POST',
            body: JSON.stringify({ name })
        })
    }

    async joinChoir(code) {
        return this.request('/api/choirs/join', {
            method: 'POST',
            body: JSON.stringify({ code })
        })
    }

    async getChoir(id) {
        return this.request(`/api/choirs/${id}`)
    }

    async getChoirMembers(id) {
        return this.request(`/api/choirs/${id}/members`)
    }

    async leaveChoir(id) {
        return this.request(`/api/choirs/${id}/leave`, {
            method: 'DELETE'
        })
    }

    async searchChoirs(query) {
        return this.request(`/api/choirs/search?q=${encodeURIComponent(query)}`)
    }

    async requestJoinChoir(choirId) {
        return this.request(`/api/choirs/${choirId}/request-join`, {
            method: 'POST'
        })
    }


    async getSongs(params = {}) {
        const query = new URLSearchParams()
        if (params.choirId) query.set('choirId', params.choirId)
        if (params.categoryId) query.set('categoryId', params.categoryId)
        if (params.search) query.set('search', params.search)

        const queryString = query.toString()
        return this.request(`/api/songs${queryString ? '?' + queryString : ''}`)
    }

    async getSong(id) {
        return this.request(`/api/songs/${id}`)
    }

    async getCategories() {
        return this.request('/api/songs/categories')
    }

    async createSong(formData) {
        const url = `${API_URL}/api/songs`

        const headers = {}
        if (this.userId) {
            headers['X-User-Id'] = this.userId
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData // FormData for file upload
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(error.error || `HTTP ${response.status}`)
        }

        return response.json()
    }

    async addSongToChoir(choirId, songId) {
        return this.request(`/api/songs/choir/${choirId}/add/${songId}`, {
            method: 'POST'
        })
    }

    async removeSongFromChoir(choirId, songId) {
        return this.request(`/api/songs/choir/${choirId}/remove/${songId}`, {
            method: 'DELETE'
        })
    }

    // Repertoire
    async getTodayRepertoire(choirId) {
        return this.request(`/api/repertoire/${choirId}/today`)
    }

    async getRepertoire(choirId, date) {
        return this.request(`/api/repertoire/${choirId}/${date}`)
    }

    async setRepertoire(choirId, date, songIds) {
        return this.request(`/api/repertoire/${choirId}`, {
            method: 'POST',
            body: JSON.stringify({ date, songIds })
        })
    }

    async clearRepertoire(choirId, date) {
        return this.request(`/api/repertoire/${choirId}/${date}`, {
            method: 'DELETE'
        })
    }

    // PDF URL
    getPdfUrl(pdfPath) {
        if (!pdfPath) return null
        if (pdfPath.startsWith('http')) return pdfPath
        return `${API_URL}${pdfPath}`
    }
}

export const api = new ApiClient()
export default api
