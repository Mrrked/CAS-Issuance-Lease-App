import { onMounted, ref } from 'vue';

import { ExtendedJWTPayload } from './types';
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode';

export const useSessionStore = defineStore('session', () => {

  const authenticatedUser = ref<ExtendedJWTPayload>({
    username: '',
    department: '',
    company_code: [0],
  })

  const currentTime = ref('');
  const currentDate = ref('');

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

  return {
    authenticatedUser,

    currentDate,
    currentTime,
  }
})