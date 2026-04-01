import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/callback',
    name: 'callback',
    component: () => import('@/views/CallbackView.vue'),
  },
  {
    path: '/playlists',
    name: 'playlists',
    component: () => import('@/views/PlaylistsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/export/:playlistId',
    name: 'export',
    component: () => import('@/views/ExportView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
})

export default router
