import { BillTypeRecord, CompanyRecord, MotherBillTypeRecord, ProjectRecord } from './types';

import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import axios from '../axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useConfigStore } from './useConfigStore';
import { useDialog } from 'primevue/usedialog';

export const useCoreDataStore = defineStore('coreData', () => {


  const dialog = useDialog();
  const configStore = useConfigStore();

  const project_codes = ref<ProjectRecord[]>([])
  const company_codes = ref<CompanyRecord[]>([])
  const bill_types = ref<BillTypeRecord[]>([])
  const mother_bill_types = ref<MotherBillTypeRecord[]>([])

  const fetchData = () => {
    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: 'System Loading ...'
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      }
    });

    Promise.all([
      axios.get('issuance_lease/core/project_codes/')
        .then((response) => {
          // console.log('RESPONSE', response);
          project_codes.value = response.data as ProjectRecord[];
        }),
      axios.get('issuance_lease/core/company_codes/')
        .then((response) => {
          // console.log('RESPONSE', response);
          company_codes.value = response.data as CompanyRecord[];
        }),
      axios.get('issuance_lease/core/bill_types/')
        .then((response) => {
          // console.log('RESPONSE', response);
          bill_types.value = response.data as BillTypeRecord[];
        }),
      axios.get('issuance_lease/core/mother_bill_types/')
        .then((response) => {
          // console.log('RESPONSE', response);
          mother_bill_types.value = response.data as MotherBillTypeRecord[];
        })
    ])
    .catch(configStore.handleError)
    .finally(() => {
      loadingDialogRef.close();
    });
  };

  return {
    project_codes,
    company_codes,
    bill_types,
    mother_bill_types,

    fetchData,
  }
})