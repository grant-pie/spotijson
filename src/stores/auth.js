import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('spotify_access_token') || null)
  const expiresAt = ref(Number(localStorage.getItem('spotify_expires_at')) || null)
  const userId = ref(localStorage.getItem('spotify_user_id') || null)
  const refreshToken = ref(localStorage.getItem('spotify_refresh_token') || null)

  const isAuthenticated = computed(() => {
    return !!accessToken.value && Date.now() < expiresAt.value
  })

  const isExpired = computed(() => {
    return !!expiresAt.value && Date.now() >= expiresAt.value
  })

  function setToken(token, expiresIn) {
    accessToken.value = token
    expiresAt.value = Date.now() + expiresIn * 1000
    localStorage.setItem('spotify_access_token', token)
    localStorage.setItem('spotify_expires_at', String(expiresAt.value))
  }

  function setRefreshToken(token) {
    refreshToken.value = token
    localStorage.setItem('spotify_refresh_token', token)
  }

  function setUserId(id) {
    userId.value = id
    localStorage.setItem('spotify_user_id', id)
  }

  function clearToken() {
    accessToken.value = null
    expiresAt.value = null
    userId.value = null
    refreshToken.value = null
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_expires_at')
    localStorage.removeItem('spotify_user_id')
    localStorage.removeItem('spotify_refresh_token')
  }

  return { accessToken, expiresAt, userId, refreshToken, isAuthenticated, isExpired, setToken, setRefreshToken, setUserId, clearToken }
})
