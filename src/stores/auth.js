import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('spotify_access_token') || null)
  const expiresAt = ref(Number(sessionStorage.getItem('spotify_expires_at')) || null)
  const userId = ref(sessionStorage.getItem('spotify_user_id') || null)

  const isAuthenticated = computed(() => {
    return !!accessToken.value && Date.now() < expiresAt.value
  })

  function setToken(token, expiresIn) {
    accessToken.value = token
    expiresAt.value = Date.now() + expiresIn * 1000
    sessionStorage.setItem('spotify_access_token', token)
    sessionStorage.setItem('spotify_expires_at', String(expiresAt.value))
  }

  function setUserId(id) {
    userId.value = id
    sessionStorage.setItem('spotify_user_id', id)
  }

  function clearToken() {
    accessToken.value = null
    expiresAt.value = null
    userId.value = null
    sessionStorage.removeItem('spotify_access_token')
    sessionStorage.removeItem('spotify_expires_at')
    sessionStorage.removeItem('spotify_user_id')
  }

  return { accessToken, expiresAt, userId, isAuthenticated, setToken, setUserId, clearToken }
})
