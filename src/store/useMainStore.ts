import { BusinessDay, CompanyRecord, LeaseBillTypeRecord, MotherLeaseBillTypeRecord, PaymentType, ProjectRecord } from './types';
import { computed, onMounted, onUnmounted, ref } from 'vue'

import axios from '../axios'
import { defineStore } from 'pinia'
import { useCompanyHeaderStore } from './useCompanyHeaderStore';
import { useForBillingGroupStore } from './useForBillingGroupStore';
import { useForRecordingGroupStore } from './useForRecordingGroupStore';
import { usePerVerificationRunStore } from './usePerVerificationStore';
import { useSessionStore } from './useSessionStore';
import { useUtilitiesStore } from './useUtilitiesStore';

// import { usePerBatchRunStore } from './usePerBatchRunStore';
// import { usePerBillTypeRunStore } from './usePerBillTypeRunStore';

export const useMainStore = defineStore('main', () => {

  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()
  // const perBatchRunStore = usePerBatchRunStore()
  // const perBillTypeRunStore = usePerBillTypeRunStore()
  const forBillingGroupStore = useForBillingGroupStore()
  const forRecordingGroupStore = useForRecordingGroupStore()
  const perVerificationStore = usePerVerificationRunStore()
  const companyHeaderStore = useCompanyHeaderStore()

  const allowReloadExitPage = ref<boolean>(true);

  const project_codes = ref<ProjectRecord[]>([])
  const company_codes = ref<CompanyRecord[]>([])
  const lease_bill_types = ref<LeaseBillTypeRecord[]>([])
  const mother_lease_bill_types = ref<MotherLeaseBillTypeRecord[]>([])
  const first_business_days = ref<BusinessDay[]>([])

  const currentValueDate = ref<Date | null>()

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
      sessionStore.fetchAuthenticatedUser(),
      axios.get('general/project_code/')
        .then((response) => {
          project_codes.value = response.data.data as ProjectRecord[];
        }),
      axios.get('general/company_code/')
        .then((response) => {
          company_codes.value = response.data.data as CompanyRecord[];
        }),
      axios.get('general/lease_bill_type/')
        .then((response) => {
          lease_bill_types.value = response.data.data as LeaseBillTypeRecord[];
        }),
      axios.get('general/mother_lease_bill_type/')
        .then((response) => {
          mother_lease_bill_types.value = response.data.data as MotherLeaseBillTypeRecord[];
        }),
      axios.get('issuance_lease/business_day/' + new Date().getFullYear())
        .then((response) => {
          first_business_days.value = response.data.data as BusinessDay[];
        }),
      axios.get('issuance_lease/value_date/')
        .then((response) => {
          currentValueDate.value = new Date(response.data.date);
          // perBatchRunStore.perBatchRunForm.invoiceDate = new Date(response.data.date);
          // perBillTypeRunStore.perBillTypeRunForm.invoiceDate = new Date(response.data.date);
          perVerificationStore.perVerificationRunForm.invoiceDate = new Date(response.data.date);
          forBillingGroupStore.forBillingGroupForm.invoiceDate = new Date(response.data.date);
          forRecordingGroupStore.forRecordingGroupForm.invoiceDate = new Date(response.data.date);
        }),
      companyHeaderStore.fetchAllCompanyHeaderDetails(),
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
    lease_bill_types,
    mother_lease_bill_types,
    first_business_days,

    currentValueDate,

    PAYMENT_TYPES,

    getPaymentTypeOptions,
    getProjectCodeOptions,

    fetchAllData,
  }
})