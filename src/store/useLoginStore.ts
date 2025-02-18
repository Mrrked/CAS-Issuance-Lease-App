import { defineAsyncComponent, onMounted, ref } from 'vue'

import { ExtendedJWTPayload } from './types';
import axios from '../axios';
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode';
import { useConfirm } from "primevue/useconfirm";
import { useDialog } from 'primevue/usedialog';
import { useRouter } from 'vue-router';
import { useSessionStore } from './useSessionStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const ForgotPasswordModal = defineAsyncComponent(() => import('../components/Dialog/ForgotPasswordModal.vue'));

export const useLoginStore = defineStore('login', () => {

  const toast = useToast()
  const router = useRouter()
  const dialog = useDialog()
  const confirm = useConfirm()

  const utilStore = useUtilitiesStore();
  const sessionStore = useSessionStore();

  const username = ref<string>('');
  const password = ref<string>('');

  const handleActionLogin = () => {
    const data = {
      username: username.value,
      password: password.value
    }

    if (data.username && data.password) {
      const loading = utilStore.startLoadingModal('Logging In ...')

      axios.post('session/login/', data)
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

  const handleActionLogout = () => {
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
        axios.post('session/logout/')
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

  const handleActionForgotPassword = () => {
    dialog.open(ForgotPasswordModal, {
      props: {
        header: 'Contact Us',
        style: {
          width: '20rem',
        },
        showHeader: true,
        modal: true,
      }
    })
  }

  const resetStore = () => {
    username.value = ''
    password.value = ''
  }

  onMounted(() => {
    resetStore()
  })

  return {
    username,
    password,

    handleActionLogin,
    handleActionLogout,
    handleActionForgotPassword,
  }
})