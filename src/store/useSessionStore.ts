import { computed, defineAsyncComponent, onMounted, ref } from 'vue';

import { User } from './types';
import axios from '../axios';
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode';
import { useDialog } from 'primevue/usedialog';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const SessionTimeoutModal = defineAsyncComponent(() => import('../components/Dialog/General/SessionTimeoutModal.vue'));
const VerifyUserAuthorityModal = defineAsyncComponent(() => import('../components/Dialog/General/VerifyUserAuthorityModal.vue'));

export const useSessionStore = defineStore('session', () => {

  const toast = useToast()
  const dialog = useDialog()
  const router = useRouter()

  const utilStore = useUtilitiesStore()

  const currentDateTime = ref<Date>(new Date())
  const isSessionModalOpen = ref<boolean>(false)
  const isOpenConfirmAdminPassword = ref<boolean>(false);

  const authenticatedUser = ref<User | null>(null)

  const getCurrentDate = computed(() => {
    const DateOptions: Intl.DateTimeFormatOptions = {
      month: "long",
      day: "numeric",
    };
    return currentDateTime.value.toLocaleString("en-US", DateOptions);
  })

  const getCurrentTime = computed(() => {
    const TimeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "numeric",
      hour12: true
    };
    return currentDateTime.value.toLocaleString("en-US", TimeOptions);
  })

  const fetchAuthenticatedUser = () => {
    const token = localStorage.getItem('access')
    if (token) {
      return axios.get(`session/user_iseries_profile/`)
        .then((response) => {
          const user = response.data.data as User;
          const CAS_PROGRAM_ID = import.meta.env.VITE_CAS_PROGRAM_ID;

          if (user && user.programs.some((program) => program.id == CAS_PROGRAM_ID)) {
            authenticatedUser.value = user
          } else {
            authenticatedUser.value = null
            toast.add({
              severity: 'error',
              summary: 'Unauthorized',
              detail: 'You are not authorized to access this program. Request access from IT.',
              life: 3000
            });
            localStorage.removeItem('access')
            localStorage.removeItem('refresh')
            router.replace({name: 'Login'})
          }
        })
    }
  }

  const resetStore = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  }

  const handleActionVerifyUserAuthority = (PERMISSION_CODE: string, callback: Function) => {
    if (!isOpenConfirmAdminPassword.value) {
      isOpenConfirmAdminPassword.value = true
      const VerifyUserAuthorityRef = dialog.open(VerifyUserAuthorityModal, {
        data: {
          submit: (username: string, password: string) => {
            const loading = utilStore.startLoadingModal('Verifying credentials...')

            const data = {
              username: username,
              password: password,
              permission_code: PERMISSION_CODE
            }

            axios.post(`session/action_authorization/`, data)
              .then((response) => {
                VerifyUserAuthorityRef.close()
                callback()
                toast.add({
                  severity: 'success',
                  summary: 'Success',
                  detail: response.data.message,
                  life: 3000
                });
              })
              .catch(utilStore.handleAxiosError)
              .finally(() => {
                loading.close()
              })

          },
          cancel: () => {
            VerifyUserAuthorityRef.close()
          }
        },
        props: {
          header: '(SPECIAL ACTION) Authorization Required!',
          style: {
            width: '30rem'
          },
          showHeader: true,
          modal: true,
        },
        onClose: () => {
          isOpenConfirmAdminPassword.value = false
        }
      })
    }
  }

  onMounted(() => {
    setInterval(
      () => {
        currentDateTime.value = new Date();

        if (!isSessionModalOpen.value && localStorage.getItem('refresh')) {
          const refreshToken = localStorage.getItem('refresh') || '';

          const payload = jwtDecode(refreshToken);
          const expiryTime = (payload.exp || 0) * 1000;
          const warningTime = 1 * 60 * 1000;

          const timeUntilWarning = expiryTime - Date.now() - warningTime;
          // console.log(timeUntilWarning);

          if (timeUntilWarning < 0) {
            isSessionModalOpen.value = true;
            const SessionTimeoutDialogRef = dialog.open(SessionTimeoutModal, {
              data: {
                refresh: () => {
                  isSessionModalOpen.value = false;
                  SessionTimeoutDialogRef.close()
                  window.location.reload();
                },
                close: () => {
                  isSessionModalOpen.value = false;
                  SessionTimeoutDialogRef.close()
                  window.location.reload();
                }
              },
              props: {
                style: {
                  paddingTop: '1.5rem',
                },
                showHeader: false,
                modal: true,
              }
            })
          }
        }
      },
      1000
    )
  });

  return {
    authenticatedUser,

    getCurrentDate,
    getCurrentTime,

    fetchAuthenticatedUser,

    handleActionVerifyUserAuthority,

    resetStore,
  }
})