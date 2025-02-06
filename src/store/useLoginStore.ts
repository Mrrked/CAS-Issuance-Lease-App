import { ExtendedJWTPayload } from './types';
import axios from '../axios';
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode';
import { ref } from 'vue'
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import { useSessionStore } from './useSessionStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

export const useLoginStore = defineStore('login', () => {

  const confirm = useConfirm();
  const toast = useToast()
  const router = useRouter();
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore();

  // STATES
  const username = ref<string>('');
  const password = ref<string>('');

  // ACTIONS
  const handleExecuteLogin = () => {
    const data = {
      username: username.value,
      password: password.value
    }

    if (data.username && data.password) {
      const loading = utilStore.startLoadingModal('Logging In ...')

      axios.post('auth/login/', data)
      .then((response) => {

        const tokens = response.data.tokens
        const access_token_decoded = jwtDecode(tokens.access) as ExtendedJWTPayload;
        localStorage.setItem('access', tokens.access)
        localStorage.setItem('refresh', tokens.refresh)

        sessionStore.authenticatedUser = {
          username: access_token_decoded.username,
          department: access_token_decoded.department,
          company_code: access_token_decoded.company_code,
        }

        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: response.data.message,
          life: 3000
        });

        username.value = ''
        password.value = ''
        router.push('/')
      })
      .catch(utilStore.handleAxiosError)
      .finally(() => {
        loading.close()
      })

    } else {
      alert("Missing User ID or Password");
    }
  }

  const handleExecuteLogout = () => {
    confirm.require({
      message: 'Are you sure you want to logout?',
      header: 'Confirm Logout',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Logout'
      },
      accept: () => {
        axios.post('auth/logout/')
        .then((response) => {
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message,
            life: 3000
          });

          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          router.push('/login')
        });
      },
      reject: () => {
      }
    });
  }

  return {
    username,
    password,
    handleExecuteLogin,
    handleExecuteLogout,
  }
})