import { InvoiceRecord, LeaseBill } from './types';

import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import axios from '../axios'
import { defineStore } from 'pinia'
import { useConfigStore } from './useConfigStore';
import { useDialog } from 'primevue/usedialog';
import { usePerBatchRunStore } from './usePerBatchRunStore';
import { usePerBillTypeRunStore } from './usePerBillTypeRunStore';
import { useToast } from 'primevue/usetoast';

export const useMainStore = defineStore('main', () => {

  // INITIAL

  // STATES

  const toast = useToast()
  const dialog = useDialog();
  const configStore = useConfigStore();

  const perBatchRunStore = usePerBatchRunStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()

  // ACTIONS

  const getSplitClientAddress = (CLIENT_ADDRESS: string) => {
    const firstPart = CLIENT_ADDRESS.slice(0, 80);
    const secondPart = CLIENT_ADDRESS.slice(80, 160);
    return [firstPart, secondPart];
  }

  const getDeptCode = (TCLTNO: number): number => {
    if (TCLTNO <= 500) {
      return 11
    } else if (TCLTNO >= 501 && TCLTNO <= 700 ) {
      return 55
    } else if (TCLTNO >= 701 && TCLTNO <= 800 ) {
      return 44
    } else if (TCLTNO >= 801) {
      return 33
    } else {
      return 0
    }
  }

  const getItemName = (bill: LeaseBill) => {

    let [extractYear, extractMonth] = bill.YYYYMM.split("/").map(Number);

    let dateObj = new Date(extractYear, extractMonth - 1, 1);

    const [bill_desc, month, year, type] = [
      bill.BDESC,
      dateObj.toLocaleString('default', { month: 'long' }),
      dateObj.getFullYear(),
      'VATable'
    ]

    return `${bill_desc} ( ${month} ${year} ) ${type}`
  }


  const processBillings = (billings: LeaseBill[]): LeaseBill[] => {
    console.log('PROCESS BILLINGS', billings);

    return billings.map((bill, index) => {
      const BT_UNIQUE_STYPE = [1, 4, 2]

      const SALES_TYPE = bill.SALTYP === 'ZERO' ? 'Z' :
        bill.SALTYP === 'VAT'  ? 'V' :
        bill.SALTYP === 'NVAT' ? 'N' : ''

      const VAT_RATE = bill.VAT_RATE ? bill.VAT_RATE / 100 : 0
      const WHTAX_RATE = bill.WHTAX_RATE ? bill.WHTAX_RATE / 100 : 0

      const GROSS = bill.BALAMT
      const GROSS_VAT_RATE = 1 + VAT_RATE

      let VAT_SALES = 0
      let VAT_EXEMPT = 0
      let ZERO_RATE = 0

      const VAT = configStore.getRoundedTwoDecimals((GROSS / GROSS_VAT_RATE) * VAT_RATE)
      const TEMP = configStore.getRoundedTwoDecimals(GROSS - VAT)
      const WHTAX = configStore.getRoundedTwoDecimals(TEMP * WHTAX_RATE)

      if (BT_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'Z') {
        ZERO_RATE = TEMP
      } else {
        VAT_SALES = TEMP
      }

      const TOTAL_AMOUNT = configStore.getRoundedTwoDecimals(VAT_SALES + VAT_EXEMPT + ZERO_RATE + VAT - WHTAX)

      return {
        ...bill,
        INDEX: index++,

        UNIT_COST: TEMP,
        AMOUNT: GROSS,

        VAT_SALES: VAT_SALES,
        VAT_EXEMPT: VAT_EXEMPT,
        ZERO_RATE: ZERO_RATE,

        // ADD
        GOVT_TAX: 0,
        VAT: VAT,

        // LESS
        WITHHOLDING_TAX: WHTAX,

        TOTAL_AMOUNT: TOTAL_AMOUNT,
      }
    })
  }

  const handleExecuteSearch = (tab: number ) => {

    switch (tab) {
      // Per Bill Type / PBL
      case 1:
        // if (perBatchRunStore.perBatchRunForm.invoiceDate?.toISOString()) {
        //   const loadingDialogRef = dialog.open(LoadingModal, {
        //     data: {
        //       label: 'Fetching ...'
        //     },
        //     props: {
        //       style: {
        //         paddingTop: '1.5rem',
        //       },
        //       showHeader: false,
        //       modal: true
        //     }
        //   })
        //   const data = {
        //     year: perBatchRunStore.perBatchRunForm.invoiceDate.getFullYear(),
        //     month: perBatchRunStore.perBatchRunForm.invoiceDate.getMonth() + 1
        //   };
        //   axios.post(`issuance_lease/per_batch/`, data)
        //   .then((response) => {
        //     console.log('FETCHED OPEN BILLINGS', response.data);
        //     perBatchRunStore.billings = response.data;
        //     perBatchRunStore.handleOpenMainDialogBox()
        //   })
        //   .catch(configStore.handleError)
        //   .finally(() => {
        //     loadingDialogRef.close()
        //   })
        // } else {
        //   toast.add({
        //     severity: 'warn',
        //     summary: 'Missing Invoice Date',
        //     detail: 'Please enter a valid invoice date!',
        //     life: 3000
        //   })
        // }
        break;

      // Per Year / Month (BATCH)
      case 2:
        if (perBatchRunStore.perBatchRunForm.invoiceDate?.toISOString()) {
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
            year: perBatchRunStore.perBatchRunForm.invoiceDate.getFullYear(),
            month: perBatchRunStore.perBatchRunForm.invoiceDate.getMonth() + 1
          };
          axios.post(`issuance_lease/per_batch/`, data)
          .then((response) => {
            console.log('FETCHED OPEN BILLINGS', response.data);
            perBatchRunStore.billings = response.data;
            perBatchRunStore.handleOpenMainDialogBox()
          })
          .catch(configStore.handleError)
          .finally(() => {
            loadingDialogRef.close()
          })
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Missing Invoice Date',
            detail: 'Please enter a valid invoice date!',
            life: 3000
          })
        }
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
        perBillTypeRunStore.perBillTypeRunForm = {
          invoiceDate: new Date()
        }
        break;

      // Per Year / Month (BATCH)
      case 2:
        perBatchRunStore.perBatchRunForm.invoiceDate = new Date()
        break;

      default:
        break;
    }
  }

  const handleExecuteIssueFinalInvoices = (
    data: {
      type: string
      invoices: InvoiceRecord[]
    },
    callback: Function,
    closeLoading: Function
  ) => {
    axios.post('issuance_lease/invoice/', data)
    .then((response) => {
      callback(response)
    })
    .catch(configStore.handleError)
    .finally(() => {
      closeLoading()
    })
  }

  return {
    getSplitClientAddress,
    getDeptCode,
    getItemName,

    processBillings,

    handleExecuteSearch,
    handleExecuteReset,

    handleExecuteIssueFinalInvoices,
  }
})