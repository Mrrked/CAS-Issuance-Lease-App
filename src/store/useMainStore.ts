import { BillTypeRecord, CompanyRecord, MotherBillTypeRecord, PaymentType, ProjectRecord } from './types';
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

  const PAYMENT_TYPES: PaymentType[] = [
    { initial: 'A', name: 'Amortization'},
    { initial: 'R', name: 'Reservation'},
    { initial: 'D', name: 'Downpayment'},
    { initial: 'Y', name: 'Long Term Lease'},
    { initial: 'B', name: 'Amortization - Increase in Area'},
    { initial: 'E', name: 'Draw. of Lot Dimension'},
    { initial: 'F', name: 'Transfer Fee'},
    { initial: 'G', name: 'Gate Pass'},
    { initial: 'H', name: 'Processing Fee'},
    { initial: 'I', name: 'Registration Expense'},
    { initial: 'J', name: 'Lease Rental'},
    { initial: 'K', name: 'Water Meter Deposit - Sale'},
    { initial: 'L', name: 'Meter Deposit - MERALCO'},
    { initial: 'M', name: 'Water Meter Deposit - Lease'},
    { initial: 'N', name: 'A/P Notarial Fee'},
    { initial: 'O', name: 'Telephone Deposit - Sale'},
    { initial: 'P', name: 'Permit / Miscellaneous Fee'},
    { initial: 'Q', name: 'Telephone Deposit - Lease'},
    { initial: 'S', name: 'Transfer of Rights'},
    { initial: 'U', name: 'Telephone Apparatus'},
    { initial: 'W', name: 'Warehouse / R.E.T.'},
    { initial: 'X', name: 'Construction Deposit'},
    { initial: 'Z', name: 'DP Payment - Deferred DP'},
  ]

  const getPaymentTypeOptions = computed((): PaymentType[] => {
    return PAYMENT_TYPES
      .map((payment_type) => {
        return {
          ...payment_type,
          option_name: payment_type.initial + ' - ' + payment_type.name,
        }
      })
      .sort((a,b) => a.option_name.toLowerCase().localeCompare(b.option_name.toLowerCase()))
  })

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

    PAYMENT_TYPES,

    getPaymentTypeOptions,
    getProjectCodeOptions,

    fetchAllData,
  }
})