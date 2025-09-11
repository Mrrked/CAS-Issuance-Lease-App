import { defineAsyncComponent, onMounted, ref } from 'vue'

import axios from '../axios';
import { defineStore } from 'pinia'
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
        .then(async(response) => {
          const tokens = response.data.tokens
          localStorage.setItem('access', tokens.access)
          localStorage.setItem('refresh', tokens.refresh)

          await sessionStore.fetchAuthenticatedUser()

          if(sessionStore.authenticatedUser){
            toast.add({
              severity: 'success',
              summary: 'Success',
              detail: response.data.message,
              life: 3000
            });
            router.push({name: 'Issuance for Lease System'});
          }

          resetStore()
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