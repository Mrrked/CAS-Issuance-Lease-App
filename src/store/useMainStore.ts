import { BillTypeRecord, CompanyRecord, MotherBillTypeRecord, ProjectRecord } from './types';
import { computed, onMounted, onUnmounted, ref } from 'vue'

import axios from '../axios'
import { defineStore } from 'pinia'
import { useUtilitiesStore } from './useUtilitiesStore';

export const useMainStore = defineStore('main', () => {

  const utilStore = useUtilitiesStore()

  const allowReloadExitPage = ref<boolean>(true);

  const project_codes = ref<ProjectRecord[]>([])
  const company_codes = ref<CompanyRecord[]>([])
  const bill_types = ref<BillTypeRecord[]>([])
  const mother_bill_types = ref<MotherBillTypeRecord[]>([])

  const getProjectCodeOptions = computed(() => {
    return project_codes.value
      .filter((project_code) => {
        return project_code.PROJCD !== '000'
      })
      .map((project_code) => {
        return {
          ...project_code,
          option_name: project_code.PROJCD + ' - ' + project_code.PTITLE
        }
      })
      .sort((a,b) => a.option_name.toLowerCase().localeCompare(b.option_name.toLowerCase()))
  })

  const fetchAllData = () => {
    const loading = utilStore.startLoadingModal('System Loading ...')

    Promise.all([
      axios.get('issuance_lease/core/project_codes/')
        .then((response) => {
          project_codes.value = response.data.data as ProjectRecord[];
        }),
      axios.get('issuance_lease/core/company_codes/')
        .then((response) => {
          company_codes.value = response.data.data as CompanyRecord[];
        }),
      axios.get('issuance_lease/core/bill_types/')
        .then((response) => {
          bill_types.value = response.data.data as BillTypeRecord[];
        }),
      axios.get('issuance_lease/core/mother_bill_types/')
        .then((response) => {
          mother_bill_types.value = response.data.data as MotherBillTypeRecord[];
        })
    ])
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      loading.close();
    });
  };

  const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
    if (!allowReloadExitPage.value) {
      event.preventDefault();
      event.returnValue = "";
    }
  };

  onMounted(() => {
    window.addEventListener("beforeunload", beforeUnloadHandler);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeunload", beforeUnloadHandler);
  });

  return {
    allowReloadExitPage,

    project_codes,
    company_codes,
    bill_types,
    mother_bill_types,

    getProjectCodeOptions,

    fetchAllData,
  }
})