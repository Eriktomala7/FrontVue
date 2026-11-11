import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router'

// Definimos las rutas
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { roles: ['ADMIN'] },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('../views/admin/Dashboard.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'products', name: 'AdminProducts', component: () => import('../views/admin/Products.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'categorias', name: 'AdminCategories', component: () => import('../views/admin/Categories.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'movements', name: 'AdminMovements', component: () => import('../views/admin/Movements.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'solicitudes', name: 'AdminRequests', component: () => import('../views/admin/Requests.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'reports', name: 'AdminReports', component: () => import('../views/admin/Reports.vue'), meta: { roles: ['ADMIN'] } },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/Users.vue'), meta: { roles: ['ADMIN'] } },
    ]
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/UserLayout.vue'),
    meta: { roles: ['USUARIO'] },
    children: [
      { path: '', name: 'UserDashboard', component: () => import('../views/user/Dashboard.vue'), meta: { roles: ['ADMIN', 'USUARIO'] } },
      { path: 'products', name: 'UserProducts', component: () => import('../views/user/ProductCatalog.vue'), meta: { roles: ['ADMIN', 'USUARIO'] } },
      { path: 'requests', name: 'UserRequests', component: () => import('../views/user/MyRequests.vue'), meta: { roles: ['ADMIN', 'USUARIO'] } },
      { path: 'activity', name: 'UserActivity', component: () => import('../views/user/Activity.vue'), meta: { roles: ['ADMIN', 'USUARIO'] } },
      { path: 'notifications', name: 'UserNotifications', component: () => import('../views/user/Notifications.vue'), meta: { roles: ['ADMIN', 'USUARIO'] } },
      { path: 'profile', name: 'UserProfile', component: () => import('../views/user/Profile.vue'), meta: { roles: ['ADMIN', 'USUARIO'] } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }, // Catch-all
]

// Creamos el router
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

function roleHome(rol?: string) {
  return rol === 'ADMIN' ? '/admin' : '/dashboard'
}

// Auth + Role guard
router.beforeEach((to: RouteLocationNormalized) => {
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) as { rol?: string } : null
  const userRole = user?.rol

  // Protege rutas de /admin y /dashboard si no está autenticado
  if ((to.path.startsWith('/admin') || to.path.startsWith('/dashboard')) && !isAuthenticated) {
    return { name: 'Login', replace: true, query: { redirect: to.fullPath } }
  }

  // Validación de roles usando meta.roles
  const allowedRoles = (to.matched.find(r => r.meta?.roles)?.meta?.roles as string[] | undefined)
  if (allowedRoles && isAuthenticated) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirigir al home del rol del usuario si no tiene permiso
      return { path: roleHome(userRole), replace: true }
    }
  }

  // Evita ir a /login si ya está autenticado
  if (to.name === 'Login' && isAuthenticated) {
    const redirect = (to.query?.redirect as string) || roleHome(userRole)
    return { path: redirect, replace: true }
  }

  return true
})

export default router
