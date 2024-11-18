import { COMPANIES, COMPANY_DETAILS } from '../components/Dialog/PerMonthYear/data';
import { InvoiceRecord, LeaseBill } from './types';

import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import axios from '../axios'
import { defineStore } from 'pinia'
import { useConfigStore } from './useConfigStore';
import { useCoreDataStore } from './useCoreDataStore';
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
  const coreDataStore = useCoreDataStore()

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

  const processInvoiceRecords = (billings: LeaseBill[], invoice_date: Date): InvoiceRecord[] => {
    const mergedMap: { [key: string]: InvoiceRecord } = {};

    billings.forEach((bill) => {
      const key = bill.ID;

      const BT_BillingInvoice = [5, 6, 7, 51, 61, 71]

      const invoiceDate: number = invoice_date ? configStore.formatDateToInteger(invoice_date) : 0
      const invoiceType: 'BI' | 'VI'  = BT_BillingInvoice.includes(bill.BILL_TYPE) ? 'BI' : 'VI'

      const orKeyParts = {
        COMPCD:         bill.COMPCD || 0,
        BRANCH:         bill.BRANCH || 0,
        DEPTCD:         bill.TCLTNO > 0 ? getDeptCode(bill.TCLTNO % 1000) : 0,
        ORCOD:          '',
        ORNUM:          0,
      }

      const completeOrKey: string =
        configStore.fillNumberWithZeroes(orKeyParts.COMPCD, 2) +
        orKeyParts.BRANCH + configStore.fillNumberWithZeroes(orKeyParts.DEPTCD, 2) +
        ( orKeyParts.ORCOD || 'xx' ) +
        ( orKeyParts.ORNUM ? configStore.fillNumberWithZeroes(orKeyParts.ORNUM,6) : 'xxxxxx' )

      // EXISTING INVOICE GROUP
      if (mergedMap[key]) {
        mergedMap[key] = {
          ...mergedMap[key],

          BILLINGS: [
            ...mergedMap[key].BILLINGS,
            bill
          ],

          ITEM_BREAKDOWNS: [
            ...mergedMap[key].ITEM_BREAKDOWNS,
            {
              // KEY
              RECTYP:         invoiceType,
              ORNUM:          completeOrKey,

              // TRACKING
              ITEMNO:         mergedMap[key].ITEM_BREAKDOWNS.length + 1,
              BILTYP:         bill.OLD_BILL_TYPE || 0,
              ITEM:           getItemName(bill),
              QTY:            1,

              // VALUES
              UNTCST:         bill.UNIT_COST || 0,
              VATAMT:         bill.VAT || 0,
              VATSAL:         bill.VAT_SALES || 0,
              VATEXM:         bill.VAT_EXEMPT || 0,
              ZERSAL:         bill.ZERO_RATE || 0,
              NETVAT:         bill.UNIT_COST || 0,
              WTHTAX:         bill.WITHHOLDING_TAX || 0,
              GOVTAX:         bill.GOVT_TAX || 0,
              WTXRAT:         bill.WHTAX_RATE || 0,
              AMTDUE:         bill.AMOUNT || 0,

              // PERIOD
              FRDATE:         bill.FRBILL || 0,
              TODATE:         bill.TOBILL || 0,
              DUEDAT:         bill.DATDUE || 0,
            }
          ],

          TOTAL_BREAKDOWN: {
            ...mergedMap[key].TOTAL_BREAKDOWN,

            VATSAL:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.VATSAL + bill.VAT_SALES),
            VATEXM:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.VATEXM + bill.VAT_EXEMPT),
            ZERSAL:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.ZERSAL + bill.ZERO_RATE),
            GOVTAX:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.GOVTAX + bill.GOVT_TAX),

            TOTSAL:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.TOTSAL + bill.AMOUNT),
            NETVAT:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.NETVAT + bill.UNIT_COST),
            VATAMT:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.VATAMT + bill.VAT),
            PRDTAX:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.PRDTAX + bill.WITHHOLDING_TAX),
            AMTDUE:         configStore.getRoundedTwoDecimals(mergedMap[key].TOTAL_BREAKDOWN.AMTDUE + bill.TOTAL_AMOUNT),
          }
        }

      }

      // NEW INVOICE GROUP
      else {
        const selectedProject = coreDataStore.project_codes.find((code) => code.PROJCD === bill.PROJCD)
        const selectedCompany = COMPANIES.find((c) => c.COMPCD === bill.COMPCD) as COMPANY_DETAILS

        const [CLIENT_ADDRESS_1, CLIENT_ADDRESS_2] = getSplitClientAddress(bill.CLIENT_ADDRESS)

        mergedMap[key] = {
          PBL_KEY:          bill.PBL_KEY || '',
          TCLTNO:           bill.TCLTNO || 0,
          CLIENT_KEY_RAW:   bill.CLIENT_KEY_RAW || '',

          BILLINGS:         [ bill ],

          HEADER: {
            COMPANY_NAME:   selectedCompany?.CONAME || '',
            ADDRESS:        selectedCompany?.ADDRESS || '',
            LOGO_URL:       selectedCompany?.IMG_URL || '',
          },

          INVOICE_KEY:      {
            RECTYP:           invoiceType,
            COMPLETE_OR_KEY:  completeOrKey,
            ...orKeyParts,
            INVOICE_NAME:   invoiceType === 'VI' ? 'SERVICE' : 'BILLING',
            INVOICE_NUMBER: invoiceType + completeOrKey,
            INVOICE_DATE:   invoiceDate,
          },

          // CIRCLTPF
          DETAILS: {
            // KEY
            RECTYP:         invoiceType,
            ORNUM:          completeOrKey,

            PAYTYP:         'Y',
            PIBIG:          '',
            SLSTYP:         'V',
            DATVAL:         invoiceDate,

            // COMPANY INFO
            COMPCD:         bill.COMPCD || 0,
            TELNO:          selectedCompany?.TEL_NO || '',
            REGTIN:         selectedCompany?.TIN    || '',

            // CLIENT INFO
            CLTNME:         bill.CLIENT_NAME || '',
            RADDR1:         CLIENT_ADDRESS_1 || '',
            RADDR2:         CLIENT_ADDRESS_2 || '',
            CLTTIN:         bill.CLIENT_TIN  || '',
            CLTKEY:         bill.CLIENT_KEY  || '',
            PRJNAM:         selectedProject ? selectedProject.PTITLE : '-',
            UNIT:           bill.CLIENT_UNIT || '',

            // FOOTER
            DATSTP:         0,
            TIMSTP:         0,
            AUTHSG:         '',

            // TRACKING
            STATUS:         '',
            RUNDAT:         0,
            RUNTME:         0,
            RUNBY:          '',

            RPDATE:         0,
            RPTIME:         0,
            REPRBY:         '',

            SERIES_RANGE:   '',
          },
          // CIRBRKPF
          ITEM_BREAKDOWNS: [
            {
              // KEY
              RECTYP:         invoiceType,
              ORNUM:          completeOrKey,

              // TRACKING
              ITEMNO:         1,
              BILTYP:         bill.OLD_BILL_TYPE || 0,
              ITEM:           getItemName(bill),
              QTY:            1,

              // VALUES
              UNTCST:         bill.UNIT_COST || 0,
              VATAMT:         bill.VAT || 0,
              VATSAL:         bill.VAT_SALES || 0,
              VATEXM:         bill.VAT_EXEMPT || 0,
              ZERSAL:         bill.ZERO_RATE || 0,
              NETVAT:         bill.UNIT_COST || 0,
              WTHTAX:         bill.WITHHOLDING_TAX || 0,
              GOVTAX:         bill.GOVT_TAX || 0,
              WTXRAT:         bill.WHTAX_RATE || 0,
              AMTDUE:         bill.AMOUNT || 0,

              // PERIOD
              FRDATE:         bill.FRBILL || 0,
              TODATE:         bill.TOBILL || 0,
              DUEDAT:         bill.DATDUE || 0,
            }
          ],
          // CIRVATPF
          TOTAL_BREAKDOWN: {
            // KEY
            RECTYP:         invoiceType,
            ORNUM:          completeOrKey,

            BILTYP:         0,

            // VALUES
            VATSAL:         bill.VAT_SALES || 0,
            VATEXM:         bill.VAT_EXEMPT || 0,
            ZERSAL:         bill.ZERO_RATE || 0,
            GOVTAX:         bill.GOVT_TAX || 0,

            TOTSAL:         bill.AMOUNT || 0,
            NETVAT:         bill.UNIT_COST || 0,
            VATAMT:         bill.VAT || 0,
            PRDTAX:         bill.WITHHOLDING_TAX || 0,
            AMTDUE:         bill.TOTAL_AMOUNT || 0,
          }
        }

      }

    })

    return [...Object.values(mergedMap)] as InvoiceRecord[]
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
    console.log('FOR ISSUANCE OF INVOICES', data.type, data.invoices);
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
    processInvoiceRecords,

    handleExecuteSearch,
    handleExecuteReset,

    handleExecuteIssueFinalInvoices,
  }
})