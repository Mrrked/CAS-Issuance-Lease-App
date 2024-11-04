import { IntValueName, StringValueName } from './types';
import { computed, ref } from 'vue'

import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import axios from '../axios'
import { defineStore } from 'pinia'
import { useConfigStore } from './useConfigStore';
import { useDialog } from 'primevue/usedialog';
import { usePerBillTypeStore } from './usePerBillTypeStore';
import { usePerYearMonthStore } from './usePerYearMonthStore';
import { useToast } from 'primevue/usetoast';

export const useMainStore = defineStore('main', () => {

  // INITIAL

  // STATES

  const toast = useToast();
  const dialog = useDialog();
  const configStore = useConfigStore();

  const perYearMonthStore = usePerYearMonthStore()
  const perBillTypeStore = usePerBillTypeStore()

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
        const loadingDialogRef = dialog.open(LoadingModal, {
          data: {
            label: 'Fetching ...'
          },
          props: {
            style: {
              paddingTop: '1.5rem',
            },
            showHeader: false,
            modal: true
          }
        })
        const data = {
          year: perYearMonthStore.invoiceDateForm.year.value,
          month: perYearMonthStore.invoiceDateForm.month.value,
        }
        axios.post(`issuance_lease/month_year/`, data)
        .then((response) => {
          console.log(response.data);
          perYearMonthStore.billings = response.data;
          perYearMonthStore.handleOpenMainDialogBox()
        })
        .catch(configStore.handleError)
        .finally(() => {
          loadingDialogRef.close()
        })
        break;

      default:
        break;
    }
  }

  const handleExecuteReset = (tab: number) => {
    // CLEAR FORM FIELDS
    switch (tab) {
      // Per Bill Type / PBL
      case 1:
        
        break;

      // Per Year / Month (BATCH)
      case 2:
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        perYearMonthStore.invoiceDateForm = {
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
    YEARS_OPTIONS,
    MONTHS_OPTIONS,


    handleExecuteSearch,
    handleExecuteReset,
  }
})