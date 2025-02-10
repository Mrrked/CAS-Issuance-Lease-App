import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Issuance for Lease System',
    component: () => import('../views/Protected/MainView.vue'),
    meta: {
      requiresAuth: true,
      header: 'Issuance for Lease System'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      header: 'Login'
    }
  },
  // NotFound Route
  {
    path: '/:pathMatch(.*)*',
    name: '404 Not Found',
    component: () => import('../views/NotFoundView.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Middleware
router.beforeEach(async (to, _from, next,) => {

  const hasToken = localStorage.getItem('access')

  // HANDLE PROTECTED ROUTES
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!hasToken) {
      return next('/login');
    }
  }

  // REDIRECT TO LANDING PAGE IF USER IS AUTHENTICATED
  else if (to.name === 'Login' && hasToken) {
    return next('/');
  }

  document.title = 'CAS  | ' + (to.meta.header as string || 'Not Found')
  next()
});

export default router;