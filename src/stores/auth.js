import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('spotify_access_token') || null)
  const expiresAt = ref(Number(sessionStorage.getItem('spotify_expires_at')) || null)

  const isAuthenticated = computed(() => {
    return !!accessToken.value && Date.now() < expiresAt.value
  })

  function setToken(token, expiresIn) {
    accessToken.value = token
    expiresAt.value = Date.now() + expiresIn * 1000
    sessionStorage.setItem('spotify_access_token', token)
    sessionStorage.setItem('spotify_expires_at', String(expiresAt.value))
  }

  function clearToken() {
    accessToken.value = null
    expiresAt.value = null
    sessionStorage.removeItem('spotify_access_token')
    sessionStorage.removeItem('spotify_expires_at')
  }

  return { accessToken, expiresAt, isAuthenticated, setToken, clearToken }
})
