import { IntValueName, StringValueName } from './types';
import { computed, ref } from 'vue'

import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import axios from '../axios'
import { defineStore } from 'pinia'
import { useConfigStore } from './useConfigStore';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useToast } from 'primevue/usetoast';

export const useMainStore = defineStore('main', () => {

  interface UnitForm {
    payment_type: StringValueName
    project_code: StringValueName
    pcs_code: string
    phase: string
    block: {
      1: string
      2: string
    }
    lot: {
      1: string
      2: string
      3: string
      4: string
    }
    unit_code: {
      1: string
      2: string
    }
  }

  interface InvoiceDateForm {
    year: IntValueName
    month: IntValueName
  }

  // INITIAL

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  // STATES

  const toast = useToast();
  const dialog = useDialog();
  const configStore = useConfigStore();

  const confirm = useConfirm()

  const isMainScreen = ref<boolean>(false);

  const invoiceDateForm = ref<InvoiceDateForm>({
    year: {
      value: currentYear,
      name: String(currentYear)
    },
    month: {
      value: currentMonth + 1,
      name: `${String(currentMonth + 1).padStart(2, '0')} - ${new Date(0, currentMonth).toLocaleString('default', { month: 'long' })}`
    }
  })

  // GETTERS

  const YEARS_OPTIONS = computed((): IntValueName[] => {
    const currentYear = new Date().getFullYear();
    const startYear = 1900;

    let options:IntValueName[] = []

    for (let year = currentYear; year >= startYear; year--) {
      const option = {
        value: year,
        name: `${year}`,
      }

      options.push(option);
    }
    return options
  })

  const MONTHS_OPTIONS = computed((): IntValueName[] => {
    return [
      { value: 1,  name: '01 - January' },
      { value: 2,  name: '02 - February' },
      { value: 3,  name: '03 - March' },
      { value: 4,  name: '04 - April' },
      { value: 5,  name: '05 - May' },
      { value: 6,  name: '06 - June' },
      { value: 7,  name: '07 - July' },
      { value: 8,  name: '08 - August' },
      { value: 9,  name: '09 - September' },
      { value: 10, name: '10 - October' },
      { value: 11, name: '11 - November' },
      { value: 12, name: '12 - December' }
    ]
  })


  // ACTIONS

  const handleExecuteSearch = (tab: number ) => {

    switch (tab) {
      // Per Bill Type / PBL
      case 1:
        
        break;

      // Per Year / Month (BATCH)
      case 2:
        invoiceDateForm.value = {
          year: {
            value: currentYear,
            name: String(currentYear)
          },
          month: {
            value: currentMonth + 1,
            name: `${String(currentMonth + 1).padStart(2, '0')} - ${new Date(0, currentMonth).toLocaleString('default', { month: 'long' })}`
          }
        }
        break;

      default:
        break;
    }

    // switch (config.value.selectedOption) {

    //   // BY PBL
    //   case 'Per Bill Type / PBL':
    //     // if (queryUnitForm.value.payment_type.value) {
    //     //   if (validateQueryUnitForm()) {
    //     //     executor(activateCallback, queryUnitForm.value.payment_type)
    //     //   } else {
    //     //     toast.add({
    //     //       severity: 'warn',
    //     //       summary: 'Error',
    //     //       detail: 'Unable to execute search without any query details',
    //     //       life: 3000
    //     //     });
    //     //   }
    //     // } else {
    //     //   toast.add({
    //     //     severity: 'warn',
    //     //     summary: 'Error',
    //     //     detail: 'Please select a payment type!',
    //     //     life: 3000
    //     //   });
    //     // }
    //     break;

    //   // BY CLIENTS NAME
    //   case 'Per Year / Month':
    //     // if (validateQueryClientForm()) {
    //     //   const loadingDialogRef = dialog.open(LoadingModal, {
    //     //     data: {
    //     //       label: 'Searching Client ...'
    //     //     },
    //     //     props: {
    //     //       style: {
    //     //         paddingTop: '1.5rem',
    //     //       },
    //     //       showHeader: false,
    //     //       modal: true
    //     //     }
    //     //   })
    //     //   const data = {
    //     //     last_name: queryClientForm.value.last_name.toUpperCase(),
    //     //     first_name: queryClientForm.value.first_name.toUpperCase(),
    //     //     middle_initial: queryClientForm.value.middle_initial.toUpperCase(),
    //     //   }
    //     //   axios.post('verification/clients/', data)
    //     //   .then((response) => {
    //     //     console.log('RESPONSE ', response);
    //     //     clients.value = response.data
    //     //     activateCallback('2')
    //     //   })
    //     //   .catch((error) => {
    //     //     console.error(error);
    //     //     if (error.response) {
    //     //       if (error.response.status === 400) {
    //     //         const errData = error.response.data;
    //     //         toast.add({
    //     //           severity: 'warn',
    //     //           summary: 'Error',
    //     //           detail: errData.error,
    //     //           life: 3000
    //     //         });
    //     //       } else {
    //     //         console.error('Server responded with error:', error);
    //     //       }
    //     //     } else {
    //     //       console.error('An error occurred:', error.message);
    //     //       toast.add({
    //     //         severity: 'warn',
    //     //         summary: 'Error',
    //     //         detail: 'Can\'t reach server',
    //     //         life: 3000
    //     //       });
    //     //     }
    //     //   })
    //     //   .finally(() => {
    //     //     loadingDialogRef.close()
    //     //   })
    //     // } else {
    //     //   toast.add({
    //     //     severity: 'warn',
    //     //     summary: 'Error',
    //     //     detail: 'Unable to execute search without any query details',
    //     //     life: 3000
    //     //   });
    //     // }
    //     break;
    // }

  }

  const handleExecuteReset = (tab: number) => {
    // CLEAR FORM FIELDS
    switch (tab) {
      // Per Bill Type / PBL
      case 1:
        
        break;

      // Per Year / Month (BATCH)
      case 2:
        invoiceDateForm.value = {
          year: {
            value: currentYear,
            name: String(currentYear)
          },
          month: {
            value: currentMonth + 1,
            name: `${String(currentMonth + 1).padStart(2, '0')} - ${new Date(0, currentMonth).toLocaleString('default', { month: 'long' })}`
          }
        }
        break;

      default:
        break;
    }
  }

  return {
    isMainScreen,
    invoiceDateForm,

    YEARS_OPTIONS,
    MONTHS_OPTIONS,


    handleExecuteSearch,
    handleExecuteReset,
  }
})