import { BillTypeRecord, CompanyRecord, MotherBillTypeRecord, ProjectRecord } from './types';
import { computed, ref } from 'vue'

import axios from '../axios'
import { defineStore } from 'pinia'
import { useUtilitiesStore } from './useUtilitiesStore';

export const useMainStore = defineStore('main', () => {
  const utilStore = useUtilitiesStore()

  const project_codes = ref<ProjectRecord[]>([])
  const company_codes = ref<CompanyRecord[]>([])
  const bill_types = ref<BillTypeRecord[]>([])
  const mother_bill_types = ref<MotherBillTypeRecord[]>([])

  // GETTERS

  const project_code_options = computed(() => {
    return project_codes.value
    .map((code) => {
      return { value: code.PROJCD, name: `${code.PROJCD} - ${code.PTITLE}`}
    })
    .filter((code) => {
      return code.value !== '000'
    })
  })

  const fetchData = () => {
    const loading = utilStore.startLoadingModal('System Loading ...')

    Promise.all([
      axios.get('issuance_lease/core/project_codes/')
        .then((response) => {
          // console.log('RESPONSE', response);
          project_codes.value = response.data.data as ProjectRecord[];
        }),
      axios.get('issuance_lease/core/company_codes/')
        .then((response) => {
          // console.log('RESPONSE', response);
          company_codes.value = response.data.data as CompanyRecord[];
        }),
      axios.get('issuance_lease/core/bill_types/')
        .then((response) => {
          // console.log('RESPONSE', response);
          bill_types.value = response.data.data as BillTypeRecord[];
        }),
      axios.get('issuance_lease/core/mother_bill_types/')
        .then((response) => {
          // console.log('RESPONSE', response);
          mother_bill_types.value = response.data.data as MotherBillTypeRecord[];
        })
    ])
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      loading.close();
    });
  };

  return {
    project_codes,
    company_codes,
    bill_types,
    mother_bill_types,

    project_code_options,

    fetchData,
  }
})