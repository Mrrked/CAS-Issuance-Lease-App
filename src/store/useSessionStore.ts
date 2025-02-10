import { computed, defineAsyncComponent, onMounted, ref } from 'vue';

import { ExtendedJWTPayload } from './types';
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode';
import { useDialog } from 'primevue/usedialog';

const SessionTimeoutModal = defineAsyncComponent(() => import('../components/Dialog/General/SessionTimeoutModal.vue'));

export const useSessionStore = defineStore('session', () => {

  const dialog = useDialog()

  const currentDateTime = ref<Date>(new Date())
  const isSessionModalOpen = ref<boolean>(false)

  const authenticatedUser = ref<ExtendedJWTPayload>({
    username: '',
    department: '',
    company_code: [0],
  })

  const currentTime = ref('');
  const currentDate = ref('');

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

  const updateTime = () => {

    const padZero = (value: number) => {
      return value < 10 ? '0' + value : value;
    };

    const now = new Date();
    const hours = padZero(now.getHours() % 12);
    const minutes = padZero(now.getMinutes());
    const period = now.getHours() >= 12 ? 'PM' : 'AM';
    currentTime.value = `${hours}:${minutes} ${period}`;
    const month = now.toLocaleString('default', { month: 'long' });
    const day = padZero(now.getDate());
    currentDate.value = `${month} ${day}`;
  }

  const resetStore = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  }

  onMounted(() => {
    updateTime();
    setInterval(updateTime, 1000);

    const token = localStorage.getItem('access')
    if (token) {
      const access_token_decoded = jwtDecode(token) as ExtendedJWTPayload;

      authenticatedUser.value = {
        username: access_token_decoded.username,
        department: access_token_decoded.department,
        company_code: access_token_decoded.company_code,
      }
    }
  });

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

    resetStore,
  }
})