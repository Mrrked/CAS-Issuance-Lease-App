import { computed, ref } from 'vue';

import { LeaseBill } from './types';
import { defineStore } from 'pinia';

export const usePerBillTypeStore = defineStore('1_PerBillType', () => {

  const billings = ref<LeaseBill[]>([])

  return {
    billings,
  }
})