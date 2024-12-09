import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import { ExtendedJWTPayload } from '../store/types';
import { jwtDecode } from 'jwt-decode';

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

const hasValidTokens = (): boolean => {
  const accessToken = localStorage.getItem('access') || '';
  const refreshToken = localStorage.getItem('refresh') || '';

  if (!accessToken || !refreshToken) {
    console.log('NO TOKEN')
    return false
  } else {
    const currentTime = Math.floor(Date.now() / 1000);
    const access_token_decoded = jwtDecode(accessToken) as ExtendedJWTPayload;
    const refresh_token_decoded = jwtDecode(refreshToken) as ExtendedJWTPayload;

    console.log(new Date(), currentTime);
    console.log(new Date(access_token_decoded.exp as number * 1000), access_token_decoded.exp);
    console.log(new Date(refresh_token_decoded.exp as number * 1000), refresh_token_decoded.exp);
    console.log(currentTime > (access_token_decoded.exp as number), currentTime > (refresh_token_decoded.exp as number));

    if (currentTime > (access_token_decoded.exp as number)) {
      console.log('EXPIRED ACCESS TOKEN')

      if (currentTime > (refresh_token_decoded.exp as number)) {
        console.log('NO: EXPIRED REFRESH TOKEN')
        return false
      }
      console.log('YES: EXPIRED ACCESS TOKEN BUT ACTIVE REFRESH TOKEN')
      return true
    }

    console.log('YES: ACTIVE ACCESS TOKEN')
    return true
  }

}

// Middleware
router.beforeEach(async (to, _from, next,) => {

  // HANDLE PROTECTED ROUTES
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!hasValidTokens()) {
      return next('/login');
    }
  }

  // REDIRECT TO LANDING PAGE IF USER IS AUTHENTICATED
  else if (to.name === 'Login' && hasValidTokens()) {
    return next('/');
  }

  document.title = 'CAS  | ' + (to.meta.header as string || 'Not Found')
  next()
});

export default router;