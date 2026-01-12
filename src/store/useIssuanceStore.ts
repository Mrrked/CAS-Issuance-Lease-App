import { ACCOUNTING_ENTRIES, CRMKPF, GFL2PF, GPARPF, INVOICE_PER_COMPANY_AND_PROJECT, InvoicePDF, InvoiceRecord, LeaseBill } from './types';
import jsPDF, { jsPDFOptions } from 'jspdf';

import autoTable from 'jspdf-autotable'
import axios from '../axios'
import { defineStore } from 'pinia'
import { useCompanyHeaderStore } from './useCompanyHeaderStore';
import { useFileStore } from './useFileStore';
import { useMainStore } from './useMainStore';
import { usePerBatchRunStore } from './usePerBatchRunStore';
import { usePerBillTypeRunStore } from './usePerBillTypeRunStore';
import { useSessionStore } from './useSessionStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';
import { usePerVerificationRunStore } from './usePerVerificationStore';

export const useIssuanceStore = defineStore('issuance', () => {

  const toast = useToast()

  const fileStore = useFileStore()
  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()
  const companyHeaderStore = useCompanyHeaderStore()

  const perBatchRunStore = usePerBatchRunStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()
  const perVerificationStore = usePerVerificationRunStore()

  const BILL_TYPES_WITH_PENALTY_TYPE  = [1, 2, 3, 4, 5, 6, 7]
  const PENALTY_BILL_TYPES            = [11, 21, 31, 41, 51, 61, 71]
  const UTILITY_BILL_TYPES            = [5, 6, 7]
  const BILL_TYPES_WITH_UNIQUE_STYPE  = [1, 4, 2]
  const UTILITY_BILL_TYPES_WITH_PENALTY = [5, 6, 7, 51, 61, 71]
  const UTILITY_MOTHER_BILL_TYPE_GROUPS  = [
    {
      current: 5,
      ungroup: [53, 54, 55, 56],
    },
    {
      current: 6,
      ungroup: [63, 64, 65, 66],
    },
    {
      current: 7,
      ungroup: [73, 74],
    },
  ]
  const UTILITY_BILL_TYPE_PER_CLASSIFICATION = {
    VAT_SALES:  [53, 63, 73],
    VAT:        [54, 64, 74],
    VAT_EXEMPT: [55, 65],
    GOVT_TAX:   [56, 66],
  }

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

    const [bill_desc, month, year] = [
      bill.BDESC,
      dateObj.toLocaleString('default', { month: 'long' }),
      dateObj.getFullYear(),
    ]

    if (BILL_TYPES_WITH_UNIQUE_STYPE.includes(bill.BILL_TYPE)) {
      const SALES_TYPE = bill.SALTYP === 'ZERO' ? 'Z' :
      bill.SALTYP === 'VAT'  ? 'V' :
      bill.SALTYP === 'NVAT' ? 'N' : ''

      let type = BILL_TYPES_WITH_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'Z' ?
        '(Zero-Rated)' :
        BILL_TYPES_WITH_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'N' ?
          '(VAT-Exempt)' :
          '(VATable)'

      return `${bill_desc} (${month} ${year}) ${type}`

    } else {
      let type = ''
      if (bill.VAT_SALES !== 0) {
        type = '(VATable)'
      } else if (bill.VAT_EXEMPT !== 0) {
        type = '(VAT-Exempt)'
      } else if (bill.ZERO_RATE !== 0) {
        type = '(Zero-Rated)'
      } else if (bill.GOVT_TAX !== 0) {
        type = "(Gov't-Taxes)"
      }

      return `${bill_desc} (${month} ${year}) ${type}`
    }

  }

  const getNOMOS = (invoiceRecord: InvoiceRecord, billTypes: number[]) => {
    const billings = invoiceRecord.BILLINGS
    const uniqueBillings = Array.from(
      new Map(
        billings.map(b => [`${b.YYYYMM}-${b.MBTYPE}`, b])
      ).values()
    )

    var max = 0
    billTypes.forEach(billType => {
      const count = uniqueBillings.filter((bill) => bill.BILL_TYPE === billType)?.length || 0
      if (count > max) {
        max = count
      }
    });

    return max
  }

  const getInvoiceRemarks = (bill: LeaseBill, currentCRMK?: CRMKPF) => {
    const remarksBillTypeDescription = bill.BDESC
    const remarksPeriod = utilStore.formatDateNumberToStringYYYYMMDD(bill.FRBILL) + ' - ' + utilStore.formatDateNumberToStringYYYYMMDD(bill.TOBILL)

    if (currentCRMK) {

      if (remarksBillTypeDescription.startsWith('PEN')) {
        return [
          currentCRMK.RMARK1,
          currentCRMK.RMARK2,
          currentCRMK.RMARK3,
          currentCRMK.RMARK4,
        ]
      }

      if (currentCRMK.RMARK1.startsWith('PEN')) {
        return [
          remarksBillTypeDescription,
          'for the period of',
          remarksPeriod,
          '',
        ]
      }

      if (currentCRMK.RMARK1 === remarksBillTypeDescription && currentCRMK.RMARK2 === 'for the period of') {
        return [
          currentCRMK.RMARK1,
          currentCRMK.RMARK2,
          remarksPeriod,
          currentCRMK.RMARK4,
        ]
      }

      if (currentCRMK.RMARK2 === remarksBillTypeDescription && currentCRMK.RMARK3 === 'for the period of') {
        return [
          currentCRMK.RMARK1,
          currentCRMK.RMARK2,
          currentCRMK.RMARK3,
          remarksPeriod
        ]
      }

      if (currentCRMK.RMARK2 === 'for the period of' && currentCRMK.RMARK1 !== remarksBillTypeDescription) {
        return [
          currentCRMK.RMARK1,
          remarksBillTypeDescription,
          currentCRMK.RMARK2,
          currentCRMK.RMARK3,
        ]
      }

      return [
        currentCRMK.RMARK1,
        remarksBillTypeDescription,
        currentCRMK.RMARK2,
        currentCRMK.RMARK3,
      ]
    }

    return [
      remarksBillTypeDescription,
      'for the period of',
      remarksPeriod,
      ''
    ]
  }

  const getParticularsPeriod = (FRDATE: number, TODATE: number): string => {
    const formatDate = (dateNum: number, includeYear = false): string => {
      const dateStr = dateNum.toString();
      const yyyy = dateStr.slice(0, 4);
      const mm = dateStr.slice(4, 6);
      const dd = dateStr.slice(6, 8);

      if (includeYear) {
        return `${mm}/${dd}/${yyyy.slice(2)}`; // e.g., 12/31/25
      }
      return `${mm}/${dd}`; // e.g., 12/31
    };

    return `${formatDate(FRDATE)}-${formatDate(TODATE, true)}`;
  }

  const generateAccountingEntry = (invoiceRecord: InvoiceRecord): ACCOUNTING_ENTRIES | undefined => {
    const RENTAL_CUSA_BT = [1, 4, 11, 41]
    const ELEC_GENSET_BT = [5, 7, 51, 71]

    // const RENTAL_PEN_BT = [1, 11]
    const CUSA_PEN_BT   = [4, 41]
    // const ELEC_BT   = [5, 51]
    // const GENSET_BT = [7, 71]
    const WATER_BT  = [6, 61]


    var GPARPF: GPARPF[] = []
    var GFL2PF: GFL2PF[] = []
    var MAIN_PAR = ''

    // RENTAL AND CUSA
    if (invoiceRecord.BILLINGS.some((bill) => RENTAL_CUSA_BT.includes(bill.BILL_TYPE))) {

      const hasCUSA = invoiceRecord.BILLINGS.some((bill) => CUSA_PEN_BT.includes(bill.BILL_TYPE))

      // PARTICULARS
      GPARPF  = [
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 1,
          PARCLR: (hasCUSA ? 'RENTAL, CUSA, AND PEN BILLING ' : 'RENTAL AND PEN BILLING ') +
            invoiceRecord.INVOICE_KEY.PROJCD
        },
      ]

      // MAIN PARTICULAR
      MAIN_PAR = 'RENT'

      // ENTRIES (1,4)
      const PROJ = invoiceRecord.INVOICE_KEY.PROJCD
      // 1
      var RENTAL_VAT_DEBIT = 0
      var RENTAL_NVAT_DEBIT = 0
      var RENTAL_ZERO_DEBIT = 0

      var RENTAL_VAT_CREDIT = 0
      var RENTAL_NET_VAT_CREDIT = 0

      // 4
      var CUSA_VAT_DEBIT = 0
      var CUSA_ZERO_DEBIT = 0

      var CUSA_NET_VAT_CREDIT = 0
      var CUSA_VAT_CREDIT = 0

      // 41
      var PENALTY_CUSA_DEBIT = 0
      var PENALTY_CUSA_VAT_CREDIT = 0
      var PENALTY_CUSA_NET_VAT_CREDIT = 0

      invoiceRecord.BILLINGS.forEach((bill) => {
        // RENTAL
        if (bill.BILL_TYPE === 1) {
          if (bill.SALTYP === 'VAT') {
            RENTAL_VAT_DEBIT = utilStore.convertNumberToRoundedNumber(RENTAL_VAT_DEBIT + bill.AMOUNT)
          } else if (bill.SALTYP === 'NVAT') {
            RENTAL_NVAT_DEBIT = utilStore.convertNumberToRoundedNumber(RENTAL_NVAT_DEBIT + bill.AMOUNT)
          } else if (bill.SALTYP === 'ZERO') {
            RENTAL_ZERO_DEBIT = utilStore.convertNumberToRoundedNumber(RENTAL_ZERO_DEBIT + bill.AMOUNT)
          }

          if (bill.VAT) {
            RENTAL_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(RENTAL_VAT_CREDIT + bill.VAT)
          }

          RENTAL_NET_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(RENTAL_NET_VAT_CREDIT + bill.AMOUNT - bill.VAT)
        }

        // PENALTY ON RENTAL [NONE]

        // CUSA
        else if (bill.BILL_TYPE === 4) {
          if (bill.SALTYP === 'VAT') {
            CUSA_VAT_DEBIT = utilStore.convertNumberToRoundedNumber(CUSA_VAT_DEBIT + bill.AMOUNT)
          } else if (bill.SALTYP === 'ZERO') {
            CUSA_ZERO_DEBIT = utilStore.convertNumberToRoundedNumber(CUSA_ZERO_DEBIT + bill.AMOUNT)
          }

          CUSA_NET_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(CUSA_NET_VAT_CREDIT + bill.AMOUNT - bill.VAT)

          if (bill.VAT) {
            CUSA_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(CUSA_VAT_CREDIT + bill.VAT)
          }
        }

        // PENALTY ON CUSA
        else if (bill.BILL_TYPE === 41) {
          PENALTY_CUSA_DEBIT = utilStore.convertNumberToRoundedNumber(PENALTY_CUSA_DEBIT + bill.AMOUNT)
          PENALTY_CUSA_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(PENALTY_CUSA_VAT_CREDIT + bill.VAT)
          PENALTY_CUSA_NET_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(PENALTY_CUSA_NET_VAT_CREDIT + bill.AMOUNT - bill.VAT)
        }
      })

      if (RENTAL_VAT_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0000006`,
          DEBIT:  RENTAL_VAT_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (RENTAL_NVAT_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0000007`,
          DEBIT:  RENTAL_NVAT_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (RENTAL_ZERO_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0000008`,
          DEBIT:  RENTAL_ZERO_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (RENTAL_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `2001${PROJ}0000001`,
          DEBIT:  0,
          CREDIT: RENTAL_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (RENTAL_NET_VAT_CREDIT > 0) {
        var account_code = `4006${PROJ}`

        if (PROJ.startsWith('CL')) {
          // IF PARKING FOR LEASE
          if (
            ['LP', 'LM'].includes(invoiceRecord.CODEA) ||
            ['P',  'B'].includes(invoiceRecord.CODEE)
          ) {
            if (invoiceRecord.SALTYP === 'VAT') {
              account_code += '0000020'
            } else if (invoiceRecord.SALTYP === 'ZERO') {
              account_code += '0000021'
            }
          }

          // IF SIGNAGE FOR LEASE
          else if (
            ['LC', 'LB'].includes(invoiceRecord.CODEA) ||
            ['C'].includes(invoiceRecord.CODEE)
          ) {
            if (invoiceRecord.SALTYP === 'VAT') {
              account_code += '0000030'
            } else if (invoiceRecord.SALTYP === 'ZERO') {
              account_code += '0000031'
            }
          }

          else {
            if (invoiceRecord.SALTYP === 'VAT') {
              account_code += '0000010'
            } else if (invoiceRecord.SALTYP === 'ZERO') {
              account_code += '0000011'
            }
          }

        } else {
          // 1
          if (PROJ === 'O16') {
            if (invoiceRecord.SALTYP === 'VAT') {
              if (invoiceRecord.CODEE === 'P') {
                account_code += '0000001'
              } else {
                account_code += '0000000'
              }
            } else if (invoiceRecord.SALTYP === 'NVAT') {
              account_code += '0000002'
            }
          }

          // 2
          else if (PROJ !== 'O16' && PROJ.startsWith('O')) {
            if (invoiceRecord.SALTYP === 'VAT') {
              account_code += '0000010'
            } else if (invoiceRecord.SALTYP === 'ZERO') {
              account_code += '0000011'
            }
          }

          // 3
          else if (['C60', 'C65'].includes(PROJ)) {
            if (['P','B'].includes(invoiceRecord.CODEE)) {
              if (invoiceRecord.SALTYP === 'VAT') {
                account_code += '0000020'
              } else if (invoiceRecord.SALTYP === 'ZERO') {
                account_code += '0000021'
              }
            }

            else if (['C'].includes(invoiceRecord.CODEE)) {
              if (invoiceRecord.SALTYP === 'VAT') {
                account_code += '0000030'
              } else if (invoiceRecord.SALTYP === 'ZERO') {
                account_code += '0000031'
              }
            }

            else {
              if (invoiceRecord.SALTYP === 'VAT') {
                account_code += '0000010'
              } else if (invoiceRecord.SALTYP === 'ZERO') {
                account_code += '0000011'
              }
            }
          }

          // 4
          else {
            if (invoiceRecord.SALTYP === 'VAT') {
              account_code += '0000000'
            } else if (invoiceRecord.SALTYP === 'ZERO') {
              account_code += '0000002'
            }
          }
        }

        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: account_code,
          DEBIT:  0,
          CREDIT: RENTAL_NET_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      // CUSA

      if (CUSA_VAT_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0000003`,
          DEBIT:  CUSA_VAT_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (CUSA_ZERO_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0000004`,
          DEBIT:  CUSA_ZERO_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (CUSA_NET_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000010`,
          DEBIT:  0,
          CREDIT: CUSA_NET_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (CUSA_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `2001${PROJ}0000015`,
          DEBIT:  0,
          CREDIT: CUSA_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      // PENALTY ON CUSA

      if (PENALTY_CUSA_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0000005`,
          DEBIT:  PENALTY_CUSA_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (PENALTY_CUSA_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `2001${PROJ}0000015`,
          DEBIT:  0,
          CREDIT: PENALTY_CUSA_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (PENALTY_CUSA_NET_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6010${PROJ}0000003`,
          DEBIT:  0,
          CREDIT: PENALTY_CUSA_NET_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      // SET FIRST ENTRY TO PRNTCD = 'P'

      GFL2PF = GFL2PF.map((entry, index) => {
        if (index === 0) {
          return {
            ...entry,
            PRNTCD: 'P',
          }
        }
        return entry
      })
    }

    // ELECTRICITY AND GENSET
    else if (invoiceRecord.BILLINGS.some((bill) => ELEC_GENSET_BT.includes(bill.BILL_TYPE))) {
      // PARTICULARS
      GPARPF  = [
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 1,
          PARCLR: 'ELEC AND PEN BILLING ' +
            invoiceRecord.INVOICE_KEY.PROJCD
        },
      ]

      // MAIN PARTICULAR
      MAIN_PAR = 'ELEC'

      // ENTRIES (51,53,54,55)
      const PROJ = invoiceRecord.INVOICE_KEY.PROJCD
      // 51
      var ELEC_PENALTY_DEBIT = 0
      var ELEC_PENALTY_CREDIT = 0
      // 53
      var ELEC_VAT_SALES_SP_DEBIT = 0
      var ELEC_VAT_SALES_DEBIT = 0
      var ELEC_VAT_SALES_CREDIT = 0
      // 54
      var ELEC_VAT_CREDIT = 0
      // 55
      var ELEC_VAT_EXEMPT_SP_DEBIT = 0
      var ELEC_VAT_EXEMPT_DEBIT = 0
      var ELEC_VAT_EXEMPT_CREDIT = 0

      invoiceRecord.BILLINGS.forEach((bill) => {
        if (bill.BILL_TYPE === 51) {
          ELEC_PENALTY_DEBIT = utilStore.convertNumberToRoundedNumber(ELEC_PENALTY_DEBIT + bill.AMOUNT)
          ELEC_PENALTY_CREDIT = utilStore.convertNumberToRoundedNumber(ELEC_PENALTY_CREDIT + bill.AMOUNT - bill.VAT)

          ELEC_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_CREDIT + bill.VAT)
        } else if (bill.BILL_TYPE === 5) {
          if (bill.PBL_KEY === 'O25 L  W-01  ') {
            ELEC_VAT_SALES_SP_DEBIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_SALES_SP_DEBIT + bill.VAT_SALES + bill.VAT)
            ELEC_VAT_EXEMPT_SP_DEBIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_EXEMPT_SP_DEBIT + bill.VAT_EXEMPT)
          } else {
            ELEC_VAT_SALES_DEBIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_SALES_DEBIT + bill.VAT_SALES + bill.VAT)
            ELEC_VAT_EXEMPT_DEBIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_EXEMPT_DEBIT + bill.VAT_EXEMPT)
          }
          ELEC_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_CREDIT + bill.VAT)
          ELEC_VAT_SALES_CREDIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_SALES_CREDIT + bill.VAT_SALES)
          ELEC_VAT_EXEMPT_CREDIT = utilStore.convertNumberToRoundedNumber(ELEC_VAT_EXEMPT_CREDIT + bill.VAT_EXEMPT)
        }
      })

      if (ELEC_VAT_SALES_SP_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0030000`,
          DEBIT:  ELEC_VAT_SALES_SP_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_VAT_EXEMPT_SP_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0030001`,
          DEBIT:  ELEC_VAT_EXEMPT_SP_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_VAT_SALES_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0009001`,
          DEBIT:  ELEC_VAT_SALES_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_VAT_EXEMPT_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0009002`,
          DEBIT:  ELEC_VAT_EXEMPT_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000011`,
          DEBIT:  0,
          CREDIT: ELEC_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_VAT_SALES_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000028`,
          DEBIT:  0,
          CREDIT: ELEC_VAT_SALES_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_VAT_EXEMPT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000029`,
          DEBIT:  0,
          CREDIT: ELEC_VAT_EXEMPT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_PENALTY_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0009005`,
          DEBIT:  ELEC_PENALTY_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (ELEC_PENALTY_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6010${PROJ}0000005`,
          DEBIT:  0,
          CREDIT: ELEC_PENALTY_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }
    }

    // WATER
    else if (invoiceRecord.BILLINGS.some((bill) => WATER_BT.includes(bill.BILL_TYPE))){
      // PARTICULARS
      GPARPF  = [
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 1,
          PARCLR: 'WATER AND PEN BILLING ' +
            invoiceRecord.INVOICE_KEY.PROJCD
        },
      ]

      // MAIN PARTICULAR
      MAIN_PAR = 'WATER'

      // ENTRIES (61,63,64,65,66)
      const PROJ = invoiceRecord.INVOICE_KEY.PROJCD
      // 61
      var WATER_PENALTY_DEBIT = 0
      var WATER_PENALTY_CREDIT = 0
      // 63
      var WATER_VAT_SALES_DEBIT = 0
      var WATER_VAT_SALES_CREDIT = 0
      // 64
      var WATER_VAT_CREDIT = 0
      // 65
      var WATER_VAT_EXEMPT_DEBIT = 0
      var WATER_VAT_EXEMPT_CREDIT = 0
      // 66
      var WATER_GOVT_TAX_DEBIT = 0
      var WATER_GOVT_TAX_CREDIT = 0

      invoiceRecord.BILLINGS.forEach((bill) => {
        if (bill.BILL_TYPE === 61) {
          WATER_PENALTY_DEBIT = utilStore.convertNumberToRoundedNumber(WATER_PENALTY_DEBIT + bill.AMOUNT)
          WATER_PENALTY_CREDIT = utilStore.convertNumberToRoundedNumber(WATER_PENALTY_CREDIT + bill.AMOUNT - bill.VAT)

          WATER_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(WATER_VAT_CREDIT + bill.VAT)
        } else if (bill.BILL_TYPE === 6) {
          WATER_VAT_SALES_DEBIT = utilStore.convertNumberToRoundedNumber(WATER_VAT_SALES_DEBIT + bill.VAT_SALES + bill.VAT)
          WATER_VAT_SALES_CREDIT = utilStore.convertNumberToRoundedNumber(WATER_VAT_SALES_CREDIT + bill.VAT_SALES)

          WATER_VAT_CREDIT = utilStore.convertNumberToRoundedNumber(WATER_VAT_CREDIT + bill.VAT)

          WATER_VAT_EXEMPT_DEBIT = utilStore.convertNumberToRoundedNumber(WATER_VAT_EXEMPT_DEBIT + bill.VAT_EXEMPT)
          WATER_VAT_EXEMPT_CREDIT = utilStore.convertNumberToRoundedNumber(WATER_VAT_EXEMPT_CREDIT + bill.VAT_EXEMPT)

          WATER_GOVT_TAX_DEBIT = utilStore.convertNumberToRoundedNumber(WATER_GOVT_TAX_DEBIT + bill.GOVT_TAX)
          WATER_GOVT_TAX_CREDIT = utilStore.convertNumberToRoundedNumber(WATER_GOVT_TAX_CREDIT + bill.GOVT_TAX)
        }
      })

      if (WATER_VAT_SALES_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0010001`,
          DEBIT:  WATER_VAT_SALES_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_VAT_SALES_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000030`,
          DEBIT:  0,
          CREDIT: WATER_VAT_SALES_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_VAT_EXEMPT_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0010002`,
          DEBIT:  WATER_VAT_EXEMPT_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_VAT_EXEMPT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000031`,
          DEBIT:  0,
          CREDIT: WATER_VAT_EXEMPT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_VAT_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `2001${PROJ}0000012`,
          DEBIT:  0,
          CREDIT: WATER_VAT_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_GOVT_TAX_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0010003`,
          DEBIT:  WATER_GOVT_TAX_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_GOVT_TAX_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000033`,
          DEBIT:  0,
          CREDIT: WATER_GOVT_TAX_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_PENALTY_DEBIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `1028${PROJ}0010005`,
          DEBIT:  WATER_PENALTY_DEBIT,
          CREDIT: 0,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }

      if (WATER_PENALTY_CREDIT > 0) {
        GFL2PF.push({
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          'ACCT#': GFL2PF.length + 1,
          ACCTCD: `6012${PROJ}0000006`,
          DEBIT:  0,
          CREDIT: WATER_PENALTY_CREDIT,
          CHKNUM: 0,
          PRNTCD: '',
          MCCODE: '',
          DATTRN: 0,
          ORCOD:  '',
          ORNUM:  0
        })
      }
    }

    // OTHERS (BTYPE 84)
    else if (invoiceRecord.BILLINGS.some((bill) => bill.BILL_TYPE === 84 )){
      // PARTICULARS
      GPARPF  = [
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 1,
          PARCLR: 'OTHERS BILLING ' +
            invoiceRecord.INVOICE_KEY.PROJCD
        },
      ]

      // MAIN PARTICULAR
      MAIN_PAR = 'OTHER'

      // ENTRIES
      //   FOR BTYPE 84:

      // - entry:
      //     ACCTCD = '1028PRJ0013000'
      //     DEBIT = invoice amount
      //     CREDIT = 0

      // - entry:
      //     ACCTCD = '6012PRJ0000007'
      //     DEBIT = 0
      //     CREDIT = net of vat

      // - entry:
      //     ACCTCD = '2001PRJ0000002'
      //     DEBIT = 0
      //     CREDIT = vat amount
    }


    // OTHER PARTICULARS
    GPARPF = [
      ...GPARPF,
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 2,
          PARCLR: invoiceRecord.DETAILS.CLTNME.substring(0, 35)
        },
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 3,
          PARCLR: invoiceRecord.DETAILS.CLTKEY + '/' +
            invoiceRecord.PBL_KEY + '/' +
            invoiceRecord.TCLTNO
        },
    ]

    if (invoiceRecord.NOTICE_NUMBER) {
      GPARPF = [
        ...GPARPF,
        {
          VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
          COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
          BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
          DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
          YY:     invoiceRecord.INVOICE_KEY.YY,
          MM:     invoiceRecord.INVOICE_KEY.MM,
          VRCOD:  '',
          'VOUCH#': 0,
          PARTNO: 4,
          PARCLR: 'NOTICE NO. ' +
            invoiceRecord.NOTICE_NUMBER
        },
      ]
    }

    // MAIN PARTICULAR
    const earliestFRDATE = invoiceRecord.BILLINGS.reduce(
      (earliest, b) => (b.FRBILL < earliest ? b.FRBILL : earliest),
      invoiceRecord.BILLINGS[0].FRBILL
    );

    const latestTODATE = invoiceRecord.BILLINGS
      .reduce(
        (latest, b) => (b.TOBILL > latest ? b.TOBILL : latest),
        invoiceRecord.BILLINGS[0].TOBILL
      );

    MAIN_PAR = MAIN_PAR +
      ' BILL ' + // (5<= + 6)11
      invoiceRecord.DETAILS.CLTNME.substring(0, 9) + ' ' // 10
      getParticularsPeriod(earliestFRDATE, latestTODATE) //14

    return {
      GFL1PF: {
        VTYPE:  invoiceRecord.INVOICE_KEY.TRNTYP,
        COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
        BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
        DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
        YY:     invoiceRecord.INVOICE_KEY.YY,
        MM:     invoiceRecord.INVOICE_KEY.MM,
        VRCOD: '',   // on backend processing
        'VOUCH#': 0, // on backend processing
        // ---------------------
        NOACCT: GFL2PF.length,
        DATTRN: 0,   // frontend on issue click
        DATECR: 0,   // frontend on issue click
        PAYCOD: '',  // frontend on issue click
        PAYEE:  '',  // frontend on issue click
        PARCLR: MAIN_PAR,
        AMPAID: 0,
        BALNCE: 0,
        CONTNO: 0,
        PARTNO: GPARPF.length,
        BRNHCD: 0,
        'PN#': 0,
        FAO: '',
        FAOCOD: 0,
        VSCODE: '',
        ORCOD: '',  // on backend processing
        ORNUM: 0,   // on backend processing
      },
      GFL2PF: GFL2PF,
      GPARPF: GPARPF,
    }
  }

  const processBillings = (billings: LeaseBill[]): LeaseBill[] => {
    // console.log('Raw Billings', billings);

    const mergedMap: { [key: string]: LeaseBill } = {};

    let index = 0

    // console.log('SIZE', billings.length);

    billings.map((bill, idx) => {

      let key = `${bill.PBL_KEY}-${bill.YYYYMM}-${bill.PERIOD}-${bill.BILL_TYPE}`;

      if (bill.BILL_TYPE === 6 && bill.OLD_BILL_TYPE === 66) {
        key = `${bill.PBL_KEY}-${bill.YYYYMM}-${bill.PERIOD}-${bill.BILL_TYPE}-${bill.OLD_BILL_TYPE}`;
      }

      const SALES_TYPE =
        bill.SALTYP === 'ZERO' ? 'Z' :
        bill.SALTYP === 'VAT'  ? 'V' :
        bill.SALTYP === 'NVAT' ? 'N' : ''

      const VAT_RATE = bill.VAT_RATE ? bill.VAT_RATE / 100 : 0
      const WHTAX_RATE = bill.WHTAX_RATE ? bill.WHTAX_RATE / 100 : 0

      const GROSS = bill.BALAMT
      const GROSS_VAT_RATE = 1 + VAT_RATE

      // console.log(bill.BILL_TYPE, bill.OLD_BILL_TYPE);

      // FOR UTILITY BILL TYPES
      if (UTILITY_BILL_TYPES.includes(bill.BILL_TYPE)){
        // console.log(idx + 1, ' UTIL BILL TYPE ', bill.BILL_TYPE, bill.OLD_BILL_TYPE);

        if (mergedMap[key]) {
          mergedMap[key].BALAMT += bill.BALAMT;
          mergedMap[key].BILAMT += bill.BILAMT;
          mergedMap[key].AMTPD  += bill.AMTPD;
          mergedMap[key].PRPTAX += bill.PRPTAX;
        } else if(!mergedMap[key]) {
          mergedMap[key] = {
            ...bill,
            INDEX: index++,

            UNIT_COST: 0,     //SALE
            AMOUNT: 0,        //SALE + VAT

            VAT_SALES: 0,
            VAT_EXEMPT: 0,
            ZERO_RATE: 0,

            // ADD
            GOVT_TAX: 0,
            VAT: 0,

            // LESS
            WITHHOLDING_TAX: 0,

            TOTAL_AMOUNT: 0,
          };
        }

        if (bill.BILL_TYPE !== bill.OLD_BILL_TYPE) {
          // VAT SALES
          if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.VAT_SALES.includes(bill.OLD_BILL_TYPE)) {
            const WHTAX_VAT_SALES = utilStore.convertNumberToRoundedNumber(bill.BALAMT * WHTAX_RATE)

            mergedMap[key].AMOUNT += bill.BALAMT
            mergedMap[key].UNIT_COST += bill.BALAMT

            mergedMap[key].VAT_SALES += bill.BALAMT
            mergedMap[key].WITHHOLDING_TAX += WHTAX_VAT_SALES
            mergedMap[key].TOTAL_AMOUNT += bill.BALAMT - WHTAX_VAT_SALES

            mergedMap[key].LOPDTF = [
              ...(mergedMap[key].LOPDTF || []),
              {
                COMPCD:         bill.INVOICE_KEY.COMPCD,
                BRANCH:         bill.INVOICE_KEY.BRANCH,
                DEPTCD:         bill.INVOICE_KEY.DEPTCD,
                ORCOD:          bill.INVOICE_KEY.ORCOD,
                ORNUM:          bill.INVOICE_KEY.ORNUM,
                DATVAL:         0,
                PROJCD:         bill.PROJCD,
                PCSCOD:         bill.PCSCOD,
                PHASE:          bill.PHASE,
                BLOCK:          bill.BLOCK,
                LOT:            bill.LOT,
                UNITCD:         bill.UNITCD,
                TCLTNO:         bill.TCLTNO,
                CLBRAN:         bill.BRANCH,
                CLTNUM:         bill.CLTNUM,
                PDSCOD:         bill.PDSCOD,
                PDSNUM:         bill.PDSNUM,
                PAYTYP:         bill.PAYTYP,
                BTYPE:          bill.OLD_BILL_TYPE,
                YY:             bill.YY,
                MM:             bill.MM,
                BILAMT:         bill.BALAMT,
                AMTPD:          bill.BALAMT,
                PRPTAX:         WHTAX_VAT_SALES,
                DATDUE:         bill.DATDUE,
                PERIOD:         bill.PERIOD,
                FRBILL:         bill.FRBILL,
                TOBILL:         bill.TOBILL,
                USRUPD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
                DATUPD:         0,
                TIMUPD:         0,
              }
            ]
          }

          // VAT EXEMPT
          else if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.VAT_EXEMPT.includes(bill.OLD_BILL_TYPE)) {
            const WHTAX_VAT_EXEMPT = bill.BILL_TYPE !== 5 ? utilStore.convertNumberToRoundedNumber(bill.BALAMT * WHTAX_RATE) : 0

            mergedMap[key].AMOUNT += bill.BALAMT
            mergedMap[key].UNIT_COST += bill.BALAMT

            mergedMap[key].VAT_EXEMPT += bill.BALAMT
            mergedMap[key].WITHHOLDING_TAX += WHTAX_VAT_EXEMPT
            mergedMap[key].TOTAL_AMOUNT += bill.BALAMT - WHTAX_VAT_EXEMPT

            mergedMap[key].LOPDTF = [
              ...(mergedMap[key].LOPDTF || []),
              {
                COMPCD:         bill.INVOICE_KEY.COMPCD,
                BRANCH:         bill.INVOICE_KEY.BRANCH,
                DEPTCD:         bill.INVOICE_KEY.DEPTCD,
                ORCOD:          bill.INVOICE_KEY.ORCOD,
                ORNUM:          bill.INVOICE_KEY.ORNUM,
                DATVAL:         0,
                PROJCD:         bill.PROJCD,
                PCSCOD:         bill.PCSCOD,
                PHASE:          bill.PHASE,
                BLOCK:          bill.BLOCK,
                LOT:            bill.LOT,
                UNITCD:         bill.UNITCD,
                TCLTNO:         bill.TCLTNO,
                CLBRAN:         bill.BRANCH,
                CLTNUM:         bill.CLTNUM,
                PDSCOD:         bill.PDSCOD,
                PDSNUM:         bill.PDSNUM,
                PAYTYP:         bill.PAYTYP,
                BTYPE:          bill.OLD_BILL_TYPE,
                YY:             bill.YY,
                MM:             bill.MM,
                BILAMT:         bill.BALAMT,
                AMTPD:          bill.BALAMT,
                PRPTAX:         WHTAX_VAT_EXEMPT,
                DATDUE:         bill.DATDUE,
                PERIOD:         bill.PERIOD,
                FRBILL:         bill.FRBILL,
                TOBILL:         bill.TOBILL,
                USRUPD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
                DATUPD:         0,
                TIMUPD:         0,
              }
            ]
          }

          // VAT
          else if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.VAT.includes(bill.OLD_BILL_TYPE)) {
            mergedMap[key].AMOUNT += bill.BALAMT
            // mergedMap[key].UNIT_COST += bill.BILAMT

            mergedMap[key].VAT += bill.BALAMT
            mergedMap[key].TOTAL_AMOUNT += bill.BALAMT

            mergedMap[key].LOPDTF = [
              ...(mergedMap[key].LOPDTF || []),
              {
                COMPCD:         bill.INVOICE_KEY.COMPCD,
                BRANCH:         bill.INVOICE_KEY.BRANCH,
                DEPTCD:         bill.INVOICE_KEY.DEPTCD,
                ORCOD:          bill.INVOICE_KEY.ORCOD,
                ORNUM:          bill.INVOICE_KEY.ORNUM,
                DATVAL:         0,
                PROJCD:         bill.PROJCD,
                PCSCOD:         bill.PCSCOD,
                PHASE:          bill.PHASE,
                BLOCK:          bill.BLOCK,
                LOT:            bill.LOT,
                UNITCD:         bill.UNITCD,
                TCLTNO:         bill.TCLTNO,
                CLBRAN:         bill.BRANCH,
                CLTNUM:         bill.CLTNUM,
                PDSCOD:         bill.PDSCOD,
                PDSNUM:         bill.PDSNUM,
                PAYTYP:         bill.PAYTYP,
                BTYPE:          bill.OLD_BILL_TYPE,
                YY:             bill.YY,
                MM:             bill.MM,
                BILAMT:         bill.BALAMT,
                AMTPD:          bill.BALAMT,
                PRPTAX:         0,
                DATDUE:         bill.DATDUE,
                PERIOD:         bill.PERIOD,
                FRBILL:         bill.FRBILL,
                TOBILL:         bill.TOBILL,
                USRUPD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
                DATUPD:         0,
                TIMUPD:         0,
              }
            ]
          }

          // GOVT TAX
          else if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.GOVT_TAX.includes(bill.OLD_BILL_TYPE)) {
            mergedMap[key].AMOUNT += bill.BALAMT
            mergedMap[key].UNIT_COST += bill.BALAMT

            mergedMap[key].GOVT_TAX += bill.BALAMT
            mergedMap[key].TOTAL_AMOUNT += bill.BALAMT

            mergedMap[key].LOPDTF = [
              ...(mergedMap[key].LOPDTF || []),
              {
                COMPCD:         bill.INVOICE_KEY.COMPCD,
                BRANCH:         bill.INVOICE_KEY.BRANCH,
                DEPTCD:         bill.INVOICE_KEY.DEPTCD,
                ORCOD:          bill.INVOICE_KEY.ORCOD,
                ORNUM:          bill.INVOICE_KEY.ORNUM,
                DATVAL:         0,
                PROJCD:         bill.PROJCD,
                PCSCOD:         bill.PCSCOD,
                PHASE:          bill.PHASE,
                BLOCK:          bill.BLOCK,
                LOT:            bill.LOT,
                UNITCD:         bill.UNITCD,
                TCLTNO:         bill.TCLTNO,
                CLBRAN:         bill.BRANCH,
                CLTNUM:         bill.CLTNUM,
                PDSCOD:         bill.PDSCOD,
                PDSNUM:         bill.PDSNUM,
                PAYTYP:         bill.PAYTYP,
                BTYPE:          bill.OLD_BILL_TYPE,
                YY:             bill.YY,
                MM:             bill.MM,
                BILAMT:         bill.BALAMT,
                AMTPD:          bill.BALAMT,
                PRPTAX:         0,
                DATDUE:         bill.DATDUE,
                PERIOD:         bill.PERIOD,
                FRBILL:         bill.FRBILL,
                TOBILL:         bill.TOBILL,
                USRUPD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
                DATUPD:         0,
                TIMUPD:         0,
              }
            ]
          }
        }
        if (idx + 1 < billings.length && bill.BILL_TYPE !== billings[idx + 1].BILL_TYPE && bill.YYYYMM !== billings[idx + 1].YYYYMM) {
          mergedMap[key] = {
            ...mergedMap[key],
            AMOUNT: utilStore.convertNumberToRoundedNumber(mergedMap[key].AMOUNT),
            UNIT_COST: utilStore.convertNumberToRoundedNumber(mergedMap[key].UNIT_COST),

            BALAMT: utilStore.convertNumberToRoundedNumber(mergedMap[key].BALAMT),
            BILAMT: utilStore.convertNumberToRoundedNumber(mergedMap[key].BILAMT),
            AMTPD: utilStore.convertNumberToRoundedNumber(mergedMap[key].AMTPD),
            PRPTAX: utilStore.convertNumberToRoundedNumber(mergedMap[key].PRPTAX),

            VAT_SALES: utilStore.convertNumberToRoundedNumber(mergedMap[key].VAT_SALES),
            VAT_EXEMPT: utilStore.convertNumberToRoundedNumber(mergedMap[key].VAT_EXEMPT),
            ZERO_RATE: utilStore.convertNumberToRoundedNumber(mergedMap[key].ZERO_RATE),

            GOVT_TAX: utilStore.convertNumberToRoundedNumber(mergedMap[key].GOVT_TAX),
            VAT: utilStore.convertNumberToRoundedNumber(mergedMap[key].VAT),

            WITHHOLDING_TAX: utilStore.convertNumberToRoundedNumber(mergedMap[key].WITHHOLDING_TAX),

            TOTAL_AMOUNT: utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_AMOUNT),
          };
        }
      } else {
        let VAT_SALES = 0
        let VAT_EXEMPT = 0
        let ZERO_RATE = 0

        const VAT = utilStore.convertNumberToRoundedNumber((GROSS / GROSS_VAT_RATE) * VAT_RATE)
        const TEMP = utilStore.convertNumberToRoundedNumber(GROSS - VAT)
        const WHTAX = utilStore.convertNumberToRoundedNumber(TEMP * WHTAX_RATE)

        if (BILL_TYPES_WITH_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'Z') {
          ZERO_RATE = TEMP
        } else if (BILL_TYPES_WITH_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'N') {
          VAT_EXEMPT = TEMP
        } else {
          VAT_SALES = TEMP
        }

        // const NET_VAT = utilStore.convertNumberToRoundedNumber(VAT_SALES + VAT_EXEMPT + ZERO_RATE)
        const TOTAL_AMOUNT = utilStore.convertNumberToRoundedNumber(VAT_SALES + VAT_EXEMPT + ZERO_RATE + VAT - WHTAX)

        mergedMap[key] = {
          ...bill,
          INDEX: index++,

          UNIT_COST: TEMP,  //SALE
          AMOUNT: GROSS,    //SALE + VAT

          VAT_SALES: VAT_SALES,
          VAT_EXEMPT: VAT_EXEMPT,
          ZERO_RATE: ZERO_RATE,

          TOTAL_SALE: utilStore.convertNumberToRoundedNumber(VAT_SALES + VAT_EXEMPT + ZERO_RATE),

          // ADD
          GOVT_TAX: 0,
          VAT: VAT,

          // LESS
          WITHHOLDING_TAX: WHTAX,

          TOTAL_AMOUNT: TOTAL_AMOUNT, //SALE + VAT - WTHTAX
        }

        mergedMap[key].LOPDTF = [
          ...(mergedMap[key].LOPDTF || []),
          {
            COMPCD:         bill.INVOICE_KEY.COMPCD,
            BRANCH:         bill.INVOICE_KEY.BRANCH,
            DEPTCD:         bill.INVOICE_KEY.DEPTCD,
            ORCOD:          bill.INVOICE_KEY.ORCOD,
            ORNUM:          bill.INVOICE_KEY.ORNUM,
            DATVAL:         0,
            PROJCD:         bill.PROJCD,
            PCSCOD:         bill.PCSCOD,
            PHASE:          bill.PHASE,
            BLOCK:          bill.BLOCK,
            LOT:            bill.LOT,
            UNITCD:         bill.UNITCD,
            TCLTNO:         bill.TCLTNO,
            CLBRAN:         bill.BRANCH,
            CLTNUM:         bill.CLTNUM,
            PDSCOD:         bill.PDSCOD,
            PDSNUM:         bill.PDSNUM,
            PAYTYP:         bill.PAYTYP,
            BTYPE:          bill.OLD_BILL_TYPE,
            YY:             bill.YY,
            MM:             bill.MM,
            BILAMT:         bill.BALAMT,
            AMTPD:          bill.BALAMT,
            PRPTAX:         WHTAX,
            DATDUE:         bill.DATDUE,
            PERIOD:         bill.PERIOD,
            FRBILL:         bill.FRBILL,
            TOBILL:         bill.TOBILL,
            USRUPD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
            DATUPD:         0,
            TIMUPD:         0,
          }
        ]
      }
    })

    // console.log('SIZE', [...Object.values(mergedMap)].length);
    return [...Object.values(mergedMap)] as LeaseBill[]
  }

  const convertBillingsToInvoiceRecords = (billings: LeaseBill[], invoice_date: Date): InvoiceRecord[] => {
    const mergedMap: { [key: string]: InvoiceRecord } = {};

    billings.forEach((bill) => {
      const key = bill.ID;

      const invoiceDate: number = invoice_date ? utilStore.convertDateObjToNumberYYYYMMDD(invoice_date) : 0
      const invoiceType: 'BI' | 'IS' = bill.INVOICE_KEY.RECTYP

      const completeOrKey: string = bill.INVOICE_KEY.COMPLETE_OR_KEY

      // EXISTING INVOICE GROUP
      if (mergedMap[key]) {
        const [ remarks1, remarks2, remarks3, remarks4 ] = getInvoiceRemarks(bill, mergedMap[key].CRMKPF)

        const mergedCORF4PF = mergedMap[key].CORF4PF
          .some((record) => record.BTYPE === bill.BILL_TYPE) ?
            // HAS EXISTING BILL TYPE IN THE CORF4PF RECORD
            [
              ...mergedMap[key].CORF4PF.map((record) => {
                if (record.BTYPE === bill.BILL_TYPE) {
                  return {
                    ...record,
                    ORAMT:        utilStore.convertNumberToRoundedNumber(record.ORAMT  + bill.TOTAL_AMOUNT),
                    VATSAL:       utilStore.convertNumberToRoundedNumber(record.VATSAL + bill.VAT_SALES),
                    VATXMP:       utilStore.convertNumberToRoundedNumber(record.VATXMP + bill.VAT_EXEMPT),
                    VATZRO:       utilStore.convertNumberToRoundedNumber(record.VATZRO + bill.ZERO_RATE),
                    TOTSAL:       utilStore.convertNumberToRoundedNumber(record.TOTSAL + bill.AMOUNT + bill.GOVT_TAX),
                    VATAMT:       utilStore.convertNumberToRoundedNumber(record.VATAMT + bill.VAT),
                    WITTAX:       utilStore.convertNumberToRoundedNumber(record.WITTAX + bill.WITHHOLDING_TAX),
                    GRSAMT:       utilStore.convertNumberToRoundedNumber(record.GRSAMT + bill.AMOUNT + bill.GOVT_TAX),
                  }
                }
                return record
              })
            ] :
            // HAS NO EXISTING BILL TYPE IN THE CORF4PF RECORD
            [
              ...mergedMap[key].CORF4PF,
              {
                COMPCD:       bill.INVOICE_KEY.COMPCD,
                BRANCH:       bill.INVOICE_KEY.BRANCH,
                DEPTCD:       bill.INVOICE_KEY.DEPTCD,
                ORCOD:        bill.INVOICE_KEY.ORCOD,
                ORNUM:        bill.INVOICE_KEY.ORNUM,
                DATVAL:       invoiceDate,
                PROJCD:       bill.PROJCD,
                PCSCOD:       bill.PCSCOD,
                PHASE:        bill.PHASE,
                BLOCK:        bill.BLOCK,
                LOT:          bill.LOT,
                UNITCD:       bill.UNITCD,
                PAYTYP:       bill.PAYTYP,
                BTYPE:        bill.BILL_TYPE,
                MBTYPE:       bill.BILL_TYPE,
                LESDES:       bill.BDESC,
                ORAMT:        bill.TOTAL_AMOUNT,
                VATSAL:       bill.VAT_SALES,
                VATXMP:       bill.VAT_EXEMPT,
                VATZRO:       bill.ZERO_RATE,
                TOTSAL:       utilStore.convertNumberToRoundedNumber(bill.AMOUNT + bill.GOVT_TAX),
                VATAMT:       bill.VAT,
                WITTAX:       bill.WITHHOLDING_TAX,
                GRSAMT:       utilStore.convertNumberToRoundedNumber(bill.AMOUNT + bill.GOVT_TAX),
                ENTDES:       '',
                ENTAMT:       0,
                LESRF:        0,
                ORTYPE:       '',
                DATENT:       0,
                TIMENT:       0,
                USRENT:       sessionStore.authenticatedUser?.username.toUpperCase() || '',
              }
            ]

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
              NETVAT:         (bill.OLD_BILL_TYPE === 66 ? 0 : bill.UNIT_COST || 0),
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

            VATSAL:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.VATSAL + bill.VAT_SALES),
            VATEXM:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.VATEXM + bill.VAT_EXEMPT),
            ZERSAL:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.ZERSAL + bill.ZERO_RATE),
            GOVTAX:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.GOVTAX + bill.GOVT_TAX),

            TOTSAL:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.TOTSAL + bill.AMOUNT),
            NETVAT:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.NETVAT + (bill.OLD_BILL_TYPE === 66 ? 0 : bill.UNIT_COST || 0)),
            VATAMT:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.VATAMT + bill.VAT),
            PRDTAX:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.PRDTAX + bill.WITHHOLDING_TAX),
            AMTDUE:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.AMTDUE + bill.TOTAL_AMOUNT),
          },

          CRMKPF: {
            ...mergedMap[key].CRMKPF,
            RMARK1:         remarks1 === '' ? mergedMap[key].CRMKPF.RMARK1 : remarks1,
            RMARK2:         remarks2 === '' ? mergedMap[key].CRMKPF.RMARK2 : remarks2,
            RMARK3:         remarks3 === '' ? mergedMap[key].CRMKPF.RMARK3 : remarks3,
            RMARK4:         remarks4 === '' ? mergedMap[key].CRMKPF.RMARK4 : remarks4,
          },

          CORF4PF: mergedCORF4PF,

          LOPHTF: {
            ...mergedMap[key].LOPHTF,
            ORAMT:          utilStore.convertNumberToRoundedNumber(mergedMap[key].LOPHTF.ORAMT + bill.TOTAL_AMOUNT),
            VATOR:          utilStore.convertNumberToRoundedNumber(mergedMap[key].LOPHTF.VATOR + bill.VAT),
            PRPTAX:         utilStore.convertNumberToRoundedNumber(mergedMap[key].LOPHTF.PRPTAX + bill.PRPTAX)
          },

          LOPDTF: [
            ...mergedMap[key].LOPDTF,
            ...(bill.LOPDTF || []).map((record) => {
              return {
                ...record,
                DATVAL: invoiceDate
              }
            })
          ],

          CORF3PF: {
            ...mergedMap[key].CORF3PF,
            ORAMT:          utilStore.convertNumberToRoundedNumber(mergedMap[key].CORF3PF.ORAMT + bill.TOTAL_AMOUNT),
            VATAMT:         utilStore.convertNumberToRoundedNumber(mergedMap[key].CORF3PF.VATAMT + bill.VAT),
            PRPTAX:         utilStore.convertNumberToRoundedNumber(mergedMap[key].CORF3PF.PRPTAX + bill.PRPTAX)
          }
        }
      }

      // NEW INVOICE GROUP
      else {
        const selectedProject = mainStore.project_codes.find((code) => code.PROJCD === bill.PROJCD)
        const selectedCompanyHeader = companyHeaderStore.getCompanyHeaderDetail(bill.COMPCD, bill.INVOICE_KEY.DEPTCD)

        const [CLIENT_ADDRESS_1, CLIENT_ADDRESS_2] = getSplitClientAddress(bill.CLIENT_ADDRESS)
        const [ remarks1, remarks2, remarks3, remarks4 ] = getInvoiceRemarks(bill)

        mergedMap[key] = {
          PBL_KEY:          bill.PBL_KEY || '',
          TCLTNO:           bill.TCLTNO || 0,
          CLIENT_KEY_RAW:   bill.CLIENT_KEY_RAW || '',
          NOTICE_NUMBER:    bill.NOTICE_NUMBER,
          CODEA:            bill.CODEA,
          CODEE:            bill.CODEE,
          SALTYP:           bill.SALTYP,

          BILLINGS:         [ bill ],

          VER_KEY:          bill.VERIFICATION?.VER_KEY || '',
          INVOICE_KEY:      bill.INVOICE_KEY,

          VERIFICATION:     bill.VERIFICATION || undefined,

          // CIRCLTPF
          DETAILS: {
            // KEY
            RECTYP:         invoiceType,
            ORNUM:          completeOrKey,

            PAYTYP:         bill.PAYTYP,
            PIBIG:          bill.CLIENT_PIBIG,
            SLSTYP:         '',
            DATVAL:         invoiceDate,

            // COMPANY INFO
            COMPCD:         bill.COMPCD || 0,
            CONAME:         selectedCompanyHeader?.CONAME || '',
            COINIT:         selectedCompanyHeader?.COINIT || '',
            TELNO:          selectedCompanyHeader?.TEL_NO || '',
            REGTIN:         selectedCompanyHeader?.TIN || '',
            CADDR1:         selectedCompanyHeader?.ADDRESS1 || '',
            CADDR2:         selectedCompanyHeader?.ADDRESS2 || '',
            CADDR3:         selectedCompanyHeader?.ADDRESS3 || '',

            // CLIENT INFO
            CLTNME:         bill.CLIENT_NAME || '',
            RADDR1:         CLIENT_ADDRESS_1 || '',
            RADDR2:         CLIENT_ADDRESS_2 || '',
            CLTTIN:         bill.CLIENT_TIN  || '',
            CLTKEY:         bill.CLIENT_KEY  || '',
            PRJNAM:         selectedProject?.PTITLE || '',
            PBLKEY:         bill.PBL_KEY     || '',
            STAFF1:         bill.STAFF1 || '',
            STAFF2:         bill.STAFF2 || '',

            // HEADER
            SYSNME:         'CGC ACCOUNTING SYSTEM VERSION 2.0',
            RUNDAT:         0,
            RUNTME:         0,
            RUNBY:          sessionStore.authenticatedUser?.username.toUpperCase() || '',

            // FOOTER
            AUTHSG:         sessionStore.authenticatedUser?.user.full_name.toUpperCase() || '',
            ACNUM:          selectedCompanyHeader?.ACN || bill.ACDAT,
            ACDAT:          selectedCompanyHeader?.DATE_ISSUED || bill.ACDAT,
            STRRNG:         bill.INVOICE_KEY.SERIES_RANGE,

            // TRACKING
            STATUS:         '',
            PRSTAT:         '',
            PRCNT:          0,

            RPDATE:         0,
            RPTIME:         0,
            REPRBY:         '',

            UPDDTE:        0,
            UPDTME:        0,
            UPDBY:          sessionStore.authenticatedUser?.username.toUpperCase() || '',
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
              NETVAT:         bill.OLD_BILL_TYPE === 66 ? 0 : bill.UNIT_COST || 0,
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
            VATSAL:         bill.VAT_SALES || 0,        //INCREMENT THIS PER ITEM
            VATEXM:         bill.VAT_EXEMPT || 0,       //INCREMENT THIS PER ITEM
            ZERSAL:         bill.ZERO_RATE || 0,        //INCREMENT THIS PER ITEM
            GOVTAX:         bill.GOVT_TAX || 0,         //INCREMENT THIS PER ITEM

            TOTSAL:         bill.AMOUNT || 0,           //INCREMENT THIS PER ITEM
            NETVAT:         bill.OLD_BILL_TYPE === 66 ? 0 : bill.UNIT_COST || 0, //INCREMENT THIS PER ITEM
            VATAMT:         bill.VAT || 0,              //INCREMENT THIS PER ITEM
            PRDTAX:         bill.WITHHOLDING_TAX || 0,  //INCREMENT THIS PER ITEM
            AMTDUE:         bill.TOTAL_AMOUNT || 0,     //INCREMENT THIS PER ITEM
          },
          // CASH OR FILES
          CORFPF: {
            COMPCD:         bill.INVOICE_KEY.COMPCD,
            BRANCH:         bill.INVOICE_KEY.BRANCH,
            DEPTCD:         bill.INVOICE_KEY.DEPTCD,
            ORCOD:          bill.INVOICE_KEY.ORCOD,
            ORNUM:          bill.INVOICE_KEY.ORNUM,
            DATOR:          0, //UPDATE ON FINAL
            CASHCD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
            COLSTF:         '',
            ORAMT:          0, //UPDATE ON FINAL
            NOACCT:         0, //UPDATE ON FINAL no of months
            PAYTYP:         bill.PAYTYP,
            INTRST:         0,
            PNALTY:         0,
            OTHERS:         0,
            OVRPAY:         0,
            UNDPAY:         0,
            PROJCD:         bill.PROJCD,
            PCSCOD:         bill.PCSCOD,
            PHASE:          bill.PHASE,
            BLOCK:          bill.BLOCK,
            LOT:            bill.LOT,
            UNITCD:         bill.UNITCD,
            PAYCOD:         '',
            PAYEE:          bill.CLIENT_NAME.substring(0,35),
            'PN#':          0,
            DATVAL:         invoiceDate,
            DATPRT:         0,  //UPDATE ON FINAL
            BANKCD:         '',
            BNKACT:         '',
            NOCHK:          0,
            PRNO:           0,
            CSHAMT:         0,
            TCHKAM:         0,
            LEAFNO:         0,
            NORMRK:         0,
            DATCAN:         0,
            RETCOD:         '',
            UPDCOD:         '',
            NOMOS:          0,  //UPDATE ON FINAL no of months
            TRANSN:         0,
            DELOR:          ''
          },
          CORTPF: {
            COMPCD:         bill.INVOICE_KEY.COMPCD,
            BRANCH:         bill.INVOICE_KEY.BRANCH,
            DEPTCD:         bill.INVOICE_KEY.DEPTCD,
            ORCOD:          bill.INVOICE_KEY.ORCOD,
            ORNUM:          bill.INVOICE_KEY.ORNUM,
            DATVAL:         invoiceDate,
            PROJCD:         bill.PROJCD,
            PCSCOD:         bill.PCSCOD,
            PHASE:          bill.PHASE,
            BLOCK:          bill.BLOCK,
            LOT:            bill.LOT,
            UNITCD:         bill.UNITCD,
            PAYTYP:         bill.PAYTYP,
            CLTNUM:         bill.CLTNUM,
            PDSCOD:         bill.PDSCOD,
            PDSNUM:         bill.PDSNUM,
            TCLTNO:         bill.TCLTNO,
            DATINS:         bill.DATDUE,
            BALRUN:         0,
            PAYNO:          0,
            NOMOS:          0   //UPDATE ON FINAL no of months
          },
          CRMKPF: {
            COMPCD:         bill.INVOICE_KEY.COMPCD,
            BRANCH:         bill.INVOICE_KEY.BRANCH,
            DEPTCD:         bill.INVOICE_KEY.DEPTCD,
            ORCOD:          bill.INVOICE_KEY.ORCOD,
            ORNUM:          bill.INVOICE_KEY.ORNUM,
            RMARK1:         remarks1,
            RMARK2:         remarks2,
            RMARK3:         remarks3,
            RMARK4:         remarks4
          },
          CORF4PF: [
            {
              COMPCD:       bill.INVOICE_KEY.COMPCD,
              BRANCH:       bill.INVOICE_KEY.BRANCH,
              DEPTCD:       bill.INVOICE_KEY.DEPTCD,
              ORCOD:        bill.INVOICE_KEY.ORCOD,
              ORNUM:        bill.INVOICE_KEY.ORNUM,
              DATVAL:       invoiceDate,
              PROJCD:       bill.PROJCD,
              PCSCOD:       bill.PCSCOD,
              PHASE:        bill.PHASE,
              BLOCK:        bill.BLOCK,
              LOT:          bill.LOT,
              UNITCD:       bill.UNITCD,
              PAYTYP:       bill.PAYTYP,
              BTYPE:        bill.BILL_TYPE,
              MBTYPE:       bill.BILL_TYPE,
              LESDES:       bill.BDESC,
              ORAMT:        bill.TOTAL_AMOUNT,
              VATSAL:       bill.VAT_SALES,
              VATXMP:       bill.VAT_EXEMPT,
              VATZRO:       bill.ZERO_RATE,
              TOTSAL:       utilStore.convertNumberToRoundedNumber(bill.AMOUNT + bill.GOVT_TAX),
              VATAMT:       bill.VAT,
              WITTAX:       bill.WITHHOLDING_TAX,
              GRSAMT:       utilStore.convertNumberToRoundedNumber(bill.AMOUNT + bill.GOVT_TAX),
              ENTDES:       '',
              ENTAMT:       0,
              LESRF:        0,
              ORTYPE:       '',
              DATENT:       0,
              TIMENT:       0,
              USRENT:       sessionStore.authenticatedUser?.username.toUpperCase() || '',
            }
          ],
          LOPHTF: {
            COMPCD:         bill.INVOICE_KEY.COMPCD,
            BRANCH:         bill.INVOICE_KEY.BRANCH,
            DEPTCD:         bill.INVOICE_KEY.DEPTCD,
            ORCOD:          bill.INVOICE_KEY.ORCOD,
            ORNUM:          bill.INVOICE_KEY.ORNUM,
            PROJCD:         bill.PROJCD,
            PCSCOD:         bill.PCSCOD,
            PHASE:          bill.PHASE,
            BLOCK:          bill.BLOCK,
            LOT:            bill.LOT,
            UNITCD:         bill.UNITCD,
            TCLTNO:         bill.TCLTNO,
            CLBRAN:         bill.BRANCH,
            CLTNUM:         bill.CLTNUM,
            PDSCOD:         bill.PDSCOD,
            PDSNUM:         bill.PDSNUM,
            DATOR:          0,
            DATVAL:         invoiceDate,
            PAYTYP:         'Y',
            ORAMT:          bill.TOTAL_AMOUNT, //UPDATE ON FINAL
            BALANC:         0,
            VATOR:          bill.VAT,
            PRPTAX:         bill.WITHHOLDING_TAX,
            USRUPD:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
            DATUPD:         0,
            TIMUPD:         0,
          },
          LOPDTF: (bill.LOPDTF || []).map((record) => {
            return {
              ...record,
              DATVAL: invoiceDate
            }
          }),
          CORF3PF: {
            COMPCD:         bill.INVOICE_KEY.COMPCD,
            BRANCH:         bill.INVOICE_KEY.BRANCH,
            DEPTCD:         bill.INVOICE_KEY.DEPTCD,
            ORCOD:          bill.INVOICE_KEY.ORCOD,
            ORNUM:          bill.INVOICE_KEY.ORNUM,
            DATVAL:         invoiceDate,
            PROJCD:         bill.PROJCD,
            PCSCOD:         bill.PCSCOD,
            PHASE:          bill.PHASE,
            BLOCK:          bill.BLOCK,
            LOT:            bill.LOT,
            UNITCD:         bill.UNITCD,
            PAYTYP:         bill.PAYTYP,
            ORAMT:          bill.TOTAL_AMOUNT, //UPDATE ON FINAL
            VATAMT:         bill.VAT, //UPDATE ON FINAL
            RATIO:          0,
            ZONVAL:         0,
            NETSP:          0,
            PRPTAX:         bill.WITHHOLDING_TAX,
            VATCOD:         bill.CLIENT_PIBIG,
            VATDES:         '',
            DATENT:         0,
            TIMENT:         0,
            USRENT:         sessionStore.authenticatedUser?.username.toUpperCase() || '',
          },
        }
      }
    })

    const result: InvoiceRecord[] = [...Object.values(mergedMap)]
      .map((invoiceRecord) => {
        return {
          ...invoiceRecord,
          ITEM_BREAKDOWNS: invoiceRecord.ITEM_BREAKDOWNS
            .sort((a, b) => {
              if (a.DUEDAT !== b.DUEDAT) {
                return a.DUEDAT - b.DUEDAT
              }
              return a.BILTYP - b.BILTYP
            }),
          ENTRY: generateAccountingEntry(invoiceRecord),
        }
      })

    // console.log(result);

    return result
  }

  const convertInvoiceRecordsToInvoicePDFs = (selectedInvoiceRecord: InvoiceRecord): InvoicePDF => {
    console.log(
      selectedInvoiceRecord.SALTYP,
      selectedInvoiceRecord.CODEA,
      selectedInvoiceRecord.CODEE
    )
    console.table(selectedInvoiceRecord.ENTRY?.GFL2PF, [
      'ACCT#', 'PRNTCD', 'ACCTCD', 'DEBIT', 'CREDIT'
    ])
    console.table(selectedInvoiceRecord.ENTRY?.GPARPF, [
      'PARTNO', 'PARCLR'
    ])

    const isSample: boolean = import.meta.env.VITE_IS_TEST === 'TRUE' || false
    // console.log('SELECTED INVOICE RECORD', selectedInvoiceRecord);

    const company_logo = companyHeaderStore.getCompanyLogoByCompanyCode(selectedInvoiceRecord.DETAILS.COMPCD)

    return {
      header: {
        systemName: selectedInvoiceRecord.DETAILS.SYSNME,

        runDateAndTime: isSample ? '10/01/2025 10:16:01' : utilStore.formatDateNumberToStringMMDDYYYY(selectedInvoiceRecord.DETAILS.RUNDAT) + ' ' + utilStore.formatTimeNumberToString24H(selectedInvoiceRecord.DETAILS.RUNTME),
        runUsername: isSample ? 'CDJANE' : (selectedInvoiceRecord.DETAILS.RUNBY || 'N/A'),

        companyName: selectedInvoiceRecord.DETAILS.CONAME,
        companyAddress: selectedInvoiceRecord.DETAILS.CADDR1 + '\n' + selectedInvoiceRecord.DETAILS.CADDR2 + (selectedInvoiceRecord.DETAILS.CADDR3 ? '\n' + selectedInvoiceRecord.DETAILS.CADDR3 : ''),
        companyInitials: selectedInvoiceRecord.DETAILS.COINIT,
        companyTelephone: selectedInvoiceRecord.DETAILS.TELNO,
        companyRegisteredTIN: selectedInvoiceRecord.DETAILS.REGTIN,

        companyLogo: company_logo.IMG_URL,
        companyLogoWidth: company_logo.IMG_SIZE_INCH.WIDTH,
        companyLogoHeight: company_logo.IMG_SIZE_INCH.HEIGHT,

        invoiceTypeName: selectedInvoiceRecord.INVOICE_KEY.INVOICE_NAME,
        controlNumber: selectedInvoiceRecord.INVOICE_KEY.RECTYP + selectedInvoiceRecord.INVOICE_KEY.COMPLETE_OR_KEY,
        dateValue: isSample ? '10/01/2025' : utilStore.formatDateNumberToStringMMDDYYYY(selectedInvoiceRecord.DETAILS.DATVAL),

        name: isSample ? 'ABC TRADING CORPORATION' : selectedInvoiceRecord.DETAILS.CLTNME,
        address: selectedInvoiceRecord.DETAILS.RADDR1 + selectedInvoiceRecord.DETAILS.RADDR2,
        tin: isSample ? '123-456-789-00000' : selectedInvoiceRecord.DETAILS.CLTTIN,
        clientKey: selectedInvoiceRecord.DETAILS.CLTKEY,
        project: selectedInvoiceRecord.DETAILS.PRJNAM,
        unit: selectedInvoiceRecord.PBL_KEY.slice(3),
        salesStaff: selectedInvoiceRecord.DETAILS.STAFF1 + ( selectedInvoiceRecord.DETAILS.STAFF2 ? '/' + selectedInvoiceRecord.DETAILS.STAFF2 : '' ),
      },
      body: {
        billings: selectedInvoiceRecord.ITEM_BREAKDOWNS
          .map((item) => {
            return {
              itemDescription: item.ITEM,
              qty: item.QTY.toString(),
              unitCost: utilStore.formatNumberToString2DecimalNumber(item.UNTCST || 0),
              vatAmount: utilStore.formatNumberToString2DecimalNumber(item.VATAMT || 0),
              amount: utilStore.formatNumberToString2DecimalNumber(item.AMTDUE || 0),
            }
          }),
        breakdowns: {
          section1: {
            vatableSales: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.VATSAL || 0),
            vatAmount: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.VATAMT || 0),
            vatExemptSales: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.VATEXM || 0),
            zeroRatedSales: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.ZERSAL || 0),
            governmentTax: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.GOVTAX || 0),
          },
          section2: {
            totalSales: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.TOTSAL || 0),
            lessVAT: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.VATAMT || 0),
            netOfVAT: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.NETVAT || 0),
            addVAT: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.VATAMT || 0),
            addGovernmentTaxes: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.GOVTAX || 0),
            lessWithholdingTax: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.PRDTAX || 0),
            totalAmountDue: utilStore.formatNumberToString2DecimalNumber(selectedInvoiceRecord.TOTAL_BREAKDOWN.AMTDUE || 0),
          },
        }
      },
      footer: {
        acknowledgementCertificateNumber: selectedInvoiceRecord.DETAILS.ACNUM,
        dateIssued: selectedInvoiceRecord.DETAILS.ACDAT,
        approvedSeriesRange: selectedInvoiceRecord.DETAILS.STRRNG,
      },
      authorizedSignature: isSample ? 'JANE DELA CRUZ' : (selectedInvoiceRecord.DETAILS.AUTHSG || 'N/A'),
      reprinting: {
        isReprint: selectedInvoiceRecord.DETAILS.PRSTAT === 'R',
        reprintBy: selectedInvoiceRecord.DETAILS.REPRBY,
        reprintDateTime: utilStore.formatDateNumberToStringMMDDYYYY(selectedInvoiceRecord.DETAILS.RPDATE)
          + ' ' + utilStore.formatTimeNumberToString24H(selectedInvoiceRecord.DETAILS.RPTIME),
      }
    }
  }

  const generateInvoicePDFBlob = (invoicePDFData: InvoicePDF):Blob => {
    // console.log('GENERATE PDF BLOB FOR INVOICE', invoicePDFData)

    const generateDoc = (invoicePDFData: InvoicePDF): jsPDF => {

      const VERY_SMALL_TEXT_FONT_SIZE = 4
      const SMALL_TEXT_FONT_SIZE = 6
      const NORMAL_TEXT_FONT_SIZE = 8
      const MEDIUM_TEXT_FONT_SIZE = 11
      const LARGE_TEXT_FONT_SIZE = 13
      const EXTRA_LARGE_TEXT_FONT_SIZE = 15
      const TWO_EXTRA_LARGE_TEXT_FONT_SIZE = 17

      const VERY_SMALL_LINE_HEIGHT = VERY_SMALL_TEXT_FONT_SIZE * 1.0 / 72
      const SMALL_LINE_HEIGHT = SMALL_TEXT_FONT_SIZE * 1.0 / 72
      const NORMAL_LINE_HEIGHT = NORMAL_TEXT_FONT_SIZE * 1.0 / 72
      const MEDIUM_LINE_HEIGHT = MEDIUM_TEXT_FONT_SIZE * 1.0 / 72
      const LARGE_LINE_HEIGHT = LARGE_TEXT_FONT_SIZE * 1.0 / 72
      const EXTRA_LARGE_LINE_HEIGHT = EXTRA_LARGE_TEXT_FONT_SIZE * 1.0 / 72
      const TWO_EXTRA_LARGE_LINE_HEIGHT = TWO_EXTRA_LARGE_TEXT_FONT_SIZE * 1.0 / 72

      // let GLOBAL_Y_SAVEPOINT = 0;

      const incrementHeight = (num: number = NORMAL_LINE_HEIGHT) => {cursorLineHeight += num}

      // DONE
      // const addEmptyCheckbox = (x: number, y: number, lineWidth: number = 0.01) => {
      //   doc.setLineWidth(lineWidth)
      //   doc.setFillColor(225, 225, 225);
      //   doc.roundedRect(x, y, 0.16, 0.16, 0.045, 0.045, 'FD')
      // }

      // DONE
      // const addCheckmark = (doc: jsPDF, x: number, y: number, size: number = 0.13) => {
      //   const lineWidth = 0.005;
      //   const offset = size * 0.15;

      //   doc.setLineWidth(lineWidth);

      //   // Left leg
      //   doc.line(x + offset, y + size * 0.5, x + size * 0.4, y + size * 0.8);

      //   // Right leg
      //   doc.line(x + size * 0.4, y + size * 0.8, x + size * 0.85, y + size * 0.2);
      // }

      // DONE
      const addMultiLineText = (
        currentContent: string,
        currentContentAllowableWidth: number,
        fontSize: number,
        fontStyle: string,
        lineHeight: number,
        addEndLineHeight: number,
        x: number,
        y: number,
        align: 'left' | 'center' | 'right' = 'left',
      ) => {
        doc.setFontSize(fontSize)
        doc.setFont("helvetica", fontStyle)

        const currentContentTextLines: string[] = doc.splitTextToSize(currentContent, currentContentAllowableWidth);
        // const currentContentTextLineLength = currentContentTextLines.length

        let accumulateY = y

        currentContentTextLines.forEach(text => {
          doc.text(text, x, accumulateY, {align: align})
          accumulateY += lineHeight
        });

        cursorLineHeight = accumulateY + addEndLineHeight
      }

      // DONE
      // const handleCreateNewPage = () => {
      //   doc.addPage(PAGE_LAYOUT.format, PAGE_LAYOUT.orientation)
      // }

      // DONE
      // const handleAddPageBorder = () => {
      //   doc.line(PAGE_CONFIG.startLineX,  PAGE_CONFIG.startLineY,   PAGE_CONFIG.endLineX,   PAGE_CONFIG.startLineY) // TOP
      //   doc.line(PAGE_CONFIG.startLineX,  PAGE_CONFIG.endLineY,     PAGE_CONFIG.endLineX,   PAGE_CONFIG.endLineY)   // BOTTOM
      //   doc.line(PAGE_CONFIG.startLineX,  PAGE_CONFIG.startLineY,   PAGE_CONFIG.startLineX, PAGE_CONFIG.endLineY)   // LEFT
      //   doc.line(PAGE_CONFIG.endLineX,    PAGE_CONFIG.startLineY,   PAGE_CONFIG.endLineX,   PAGE_CONFIG.endLineY)   // RIGHT
      // }

      // DONE
      // const handleAddSectionBorder = () => {
      //   // HEADER
      //   doc.line(PAGE_CONFIG.headerStartLineX,  PAGE_CONFIG.headerStartLineY,   PAGE_CONFIG.headerEndLineX,   PAGE_CONFIG.headerStartLineY) // TOP
      //   doc.line(PAGE_CONFIG.headerStartLineX,  PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.headerEndLineX,   PAGE_CONFIG.headerEndLineY)   // BOTTOM
      //   doc.line(PAGE_CONFIG.headerStartLineX,  PAGE_CONFIG.headerStartLineY,   PAGE_CONFIG.headerStartLineX, PAGE_CONFIG.headerEndLineY)   // LEFT
      //   doc.line(PAGE_CONFIG.headerEndLineX,    PAGE_CONFIG.headerStartLineY,   PAGE_CONFIG.headerEndLineX,   PAGE_CONFIG.headerEndLineY)   // RIGHT

      //   // BODY
      //   doc.line(PAGE_CONFIG.startLineX,        PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.endLineX,         PAGE_CONFIG.headerEndLineY)   // TOP
      //   doc.line(PAGE_CONFIG.startLineX,        PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.endLineX,         PAGE_CONFIG.footerStartLineY) // BOTTOM
      //   doc.line(PAGE_CONFIG.startLineX,        PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.footerStartLineX, PAGE_CONFIG.footerStartLineY) // LEFT
      //   doc.line(PAGE_CONFIG.endLineX,          PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerStartLineY) // RIGHT

      //   // FOOTER
      //   doc.line(PAGE_CONFIG.footerStartLineX,  PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerStartLineY) // TOP
      //   doc.line(PAGE_CONFIG.footerStartLineX,  PAGE_CONFIG.footerEndLineY,     PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerEndLineY)   // BOTTOM
      //   doc.line(PAGE_CONFIG.footerStartLineX,  PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.footerStartLineX, PAGE_CONFIG.footerEndLineY)   // LEFT
      //   doc.line(PAGE_CONFIG.footerEndLineX,    PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerEndLineY)   // RIGHT
      // }

      // DONE
      const handleAddHeader = (pageNumber: number, total: number) => {
        cursorLineHeight = PAGE_CONFIG.headerStartLineY + SMALL_LINE_HEIGHT

        const TEXT = [
          // GROUP 1
          invoicePDFData.header.systemName.toUpperCase(),
          "Run Date & Time: " + invoicePDFData.header.runDateAndTime,
          "User ID: " + invoicePDFData.header.runUsername.toUpperCase(),
          "Page " + pageNumber + " of " + total,

          invoicePDFData.header.companyName.toUpperCase(),
          "VAT REG TIN: " + invoicePDFData.header.companyRegisteredTIN.toUpperCase(),
          invoicePDFData.header.companyAddress.toUpperCase(),
          "TEL. NO. " + invoicePDFData.header.companyTelephone.toUpperCase(),

          // GROUP 2
          invoicePDFData.header.invoiceTypeName.toUpperCase(),
          'INVOICE',
          invoicePDFData.header.invoiceTypeName[0] + invoicePDFData.header.invoiceTypeName.toLowerCase().slice(1) + ' Invoice No. ' + invoicePDFData.header.controlNumber,
          'Date :',
          invoicePDFData.header.dateValue,

          // GROUP 3
          invoicePDFData.header.invoiceTypeName.toUpperCase() === 'BILLING' ?
            'BILL TO' :
            'SOLD TO',
          invoicePDFData.header.name,
          'TIN',
          invoicePDFData.header.tin,
          'ADDRESS',
          invoicePDFData.header.address,

          'CLIENT KEY',
          invoicePDFData.header.clientKey,
          'PROJECT',
          invoicePDFData.header.project,
          'UNIT',
          invoicePDFData.header.unit.trim(),
          'SS',
          invoicePDFData.header.salesStaff,
        ]

        const HEADER_COL_START = [ 0.5, 1.375, 5.1, 8 ]

        // doc.line(HEADER_COL_START[2],  PAGE_CONFIG.headerStartLineY, HEADER_COL_START[2], PAGE_CONFIG.headerEndLineY)

        ///// GROUP 1

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")

        doc.text(TEXT[0], PAGE_CONFIG.startLineX, cursorLineHeight)
        incrementHeight(SMALL_LINE_HEIGHT)

        cursorLineHeight = PAGE_CONFIG.headerStartLineY + SMALL_LINE_HEIGHT

        doc.text(TEXT[1], PAGE_CONFIG.headerEndLineX, cursorLineHeight, {align: 'right'})
        incrementHeight(SMALL_LINE_HEIGHT)

        doc.text(TEXT[2], PAGE_CONFIG.headerEndLineX, cursorLineHeight, {align: 'right'})
        incrementHeight(SMALL_LINE_HEIGHT)

        doc.text(TEXT[3], PAGE_CONFIG.headerEndLineX, cursorLineHeight, {align: 'right'})
        incrementHeight(SMALL_LINE_HEIGHT)

        ///// GROUP 2

        const checkpointY = cursorLineHeight + MEDIUM_LINE_HEIGHT

        if (invoicePDFData.header.companyLogo){
          doc.addImage(invoicePDFData.header.companyLogo, "JPEG", HEADER_COL_START[0], cursorLineHeight - SMALL_LINE_HEIGHT, invoicePDFData.header.companyLogoWidth, invoicePDFData.header.companyLogoHeight, "", "FAST");
        }

        cursorLineHeight = checkpointY - (NORMAL_LINE_HEIGHT / 2)

        addMultiLineText(
          TEXT[4],
          HEADER_COL_START[2] - HEADER_COL_START[1] + 1,
          MEDIUM_TEXT_FONT_SIZE + 1,
          "bold",
          MEDIUM_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        addMultiLineText(
          TEXT[5],
          HEADER_COL_START[2] - HEADER_COL_START[1] + 1,
          NORMAL_TEXT_FONT_SIZE,
          "normal",
          NORMAL_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        addMultiLineText(
          TEXT[6],
          HEADER_COL_START[2] - HEADER_COL_START[1] + 1,
          NORMAL_TEXT_FONT_SIZE,
          "normal",
          NORMAL_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        addMultiLineText(
          TEXT[7],
          HEADER_COL_START[2] - HEADER_COL_START[1] + 1,
          NORMAL_TEXT_FONT_SIZE,
          "normal",
          NORMAL_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        cursorLineHeight = checkpointY + SMALL_LINE_HEIGHT

        doc.setFont("helvetica", "bold")

        doc.setFontSize(MEDIUM_TEXT_FONT_SIZE + 2)
        doc.text(TEXT[8], PAGE_CONFIG.headerEndLineX - 1.05, cursorLineHeight, {'align': 'right'})

        doc.setFontSize(TWO_EXTRA_LARGE_TEXT_FONT_SIZE)
        doc.text(TEXT[9], PAGE_CONFIG.headerEndLineX, cursorLineHeight, {'align': 'right'})
        incrementHeight(TWO_EXTRA_LARGE_LINE_HEIGHT)

        // TWO COLUMNED
        cursorLineHeight = cursorLineHeight + (LARGE_LINE_HEIGHT * 2)

        doc.setFont("helvetica", "bold")
        doc.setFontSize(MEDIUM_TEXT_FONT_SIZE)

        doc.text(TEXT[10], PAGE_CONFIG.headerEndLineX, cursorLineHeight, {'align': 'right'})
        incrementHeight(EXTRA_LARGE_LINE_HEIGHT)

        doc.setFont("helvetica", "normal")
        doc.text(TEXT[11], PAGE_CONFIG.headerEndLineX - 0.8, cursorLineHeight, {'align': 'right'})
        doc.text(TEXT[12], PAGE_CONFIG.headerEndLineX, cursorLineHeight, {'align': 'right'})

        // GROUP 3
        cursorLineHeight = cursorLineHeight + (PAGE_CONFIG.SECTION_GAP * 1.5)

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE + 1)

        const colXStart = [ 0.5, 1.4, 5, 6, 8 ]

        doc.setLineWidth(0.01)
        doc.setDrawColor(0,0,0)
        doc.rect(
          PAGE_CONFIG.headerStartLineX,
          cursorLineHeight,
          PAGE_CONFIG.contentWidth,
          PAGE_CONFIG.headerEndLineY - cursorLineHeight - (PAGE_CONFIG.SECTION_GAP * 1.5)
        )

        cursorLineHeight = cursorLineHeight + NORMAL_LINE_HEIGHT + PAGE_CONFIG.TABLE_CELL_PADDING

        let baseCursorLineHeight = cursorLineHeight

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[13], colXStart[0] + PAGE_CONFIG.TABLE_CELL_PADDING, cursorLineHeight)
        doc.text(':', colXStart[1] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[14],
          colXStart[2] - colXStart[1] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          MEDIUM_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[1],
          cursorLineHeight,
        )

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[15], colXStart[0] + PAGE_CONFIG.TABLE_CELL_PADDING, cursorLineHeight)
        doc.text(':', colXStart[1] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[16],
          colXStart[2] - colXStart[1] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          MEDIUM_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[1],
          cursorLineHeight,
        )

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[17], colXStart[0] + PAGE_CONFIG.TABLE_CELL_PADDING, cursorLineHeight)
        doc.text(':', colXStart[1] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[18],
          colXStart[2] - colXStart[1] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          MEDIUM_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[1],
          cursorLineHeight,
        )

        cursorLineHeight = baseCursorLineHeight

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[19], colXStart[2], cursorLineHeight)
        doc.text(':', colXStart[3] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[20],
          colXStart[4] - colXStart[3] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          MEDIUM_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[3],
          cursorLineHeight,
        )

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[21], colXStart[2], cursorLineHeight)
        doc.text(':', colXStart[3] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[22],
          colXStart[4] - colXStart[3] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          MEDIUM_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[3],
          cursorLineHeight,
        )

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[23], colXStart[2], cursorLineHeight)
        doc.text(':', colXStart[3] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[24],
          colXStart[4] - colXStart[3] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          MEDIUM_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[3],
          cursorLineHeight,
        )

        doc.setFont("helvetica", "bold")
        doc.text(TEXT[25], colXStart[2], cursorLineHeight)
        doc.text(':', colXStart[3] - 0.1, cursorLineHeight)
        addMultiLineText(
          TEXT[26],
          colXStart[4] - colXStart[3] - PAGE_CONFIG.TABLE_CELL_PADDING,
          NORMAL_TEXT_FONT_SIZE + 1,
          "normal",
          NORMAL_LINE_HEIGHT,
          VERY_SMALL_LINE_HEIGHT/2,
          colXStart[3],
          cursorLineHeight,
        )
      }

      // DONE
      const handleAddFooter = () => {
        cursorLineHeight = PAGE_CONFIG.footerStartLineY + SMALL_LINE_HEIGHT

        const TEXT = [
          invoicePDFData.footer.acknowledgementCertificateNumber,
          invoicePDFData.footer.dateIssued,
          "Approved Series Range : " + invoicePDFData.footer.approvedSeriesRange,
        ]

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")

        doc.text(TEXT[0], PAGE_CONFIG.footerStartLineX, cursorLineHeight)
        incrementHeight(MEDIUM_LINE_HEIGHT)

        doc.text(TEXT[1], PAGE_CONFIG.footerStartLineX, cursorLineHeight)
        incrementHeight(MEDIUM_LINE_HEIGHT)

        doc.text(TEXT[2], PAGE_CONFIG.footerStartLineX, cursorLineHeight)
      }

      // DONE
      // const handleAddPageNumber = (pageNumber: number, total: number) => {
      //   cursorLineHeight = PAGE_CONFIG.footerEndLineY + MEDIUM_LINE_HEIGHT

      //   const part1 = 'Page ';
      //   const part2 = `${pageNumber}`;
      //   const part3 = ' of ';
      //   const part4 = `${total}`;

      //   doc.setFontSize(SMALL_TEXT_FONT_SIZE);

      //   // Measure widths
      //   doc.setFont("helvetica", "normal");
      //   const width1 = doc.getTextWidth(part1);
      //   const width3 = doc.getTextWidth(part3);

      //   doc.setFont("helvetica", "bold");
      //   const width2 = doc.getTextWidth(part2);
      //   const width4 = doc.getTextWidth(part4);

      //   const totalWidth = width1 + width2 + width3 + width4;

      //   const startX = PAGE_CONFIG.endLineX - totalWidth;
      //   let cursorX = startX;

      //   // Draw "Page "
      //   doc.setFont("helvetica", "normal");
      //   doc.text(part1, cursorX, cursorLineHeight);
      //   cursorX += width1;

      //   // Draw bold page number
      //   doc.setFont("helvetica", "bold");
      //   doc.text(part2, cursorX, cursorLineHeight);
      //   cursorX += width2;

      //   // Draw " of "
      //   doc.setFont("helvetica", "normal");
      //   doc.text(part3, cursorX, cursorLineHeight);
      //   cursorX += width3;

      //   // Draw bold total
      //   doc.setFont("helvetica", "bold");
      //   doc.text(part4, cursorX, cursorLineHeight);
      // }

      // DONE
      const handleAddSystemDocumentNotice = () => {
        cursorLineHeight = PAGE_CONFIG.footerEndLineY + MEDIUM_LINE_HEIGHT

        const TEXT = [
          "This is a system generated document. No signature required.",
        ]

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.setFont("helvetica", "italic")
        doc.text(TEXT[0], PAGE_CONFIG.middleLineX, cursorLineHeight, { align: 'center'})
      }

      const handleAddReprintDetails = () => {
        if (invoicePDFData.reprinting.isReprint) {
          const TEXT = [
            "REPRINT",
            "Reprinted By : " + invoicePDFData.reprinting.reprintBy,
            "Reprint Date & Time : " + invoicePDFData.reprinting.reprintDateTime,
          ]

          cursorLineHeight = 1.45

          doc.setFontSize(TWO_EXTRA_LARGE_TEXT_FONT_SIZE)
          doc.setFont("helvetica", "bold")
          doc.text(TEXT[0], PAGE_CONFIG.headerEndLineX, cursorLineHeight, { align: 'right'})

          cursorLineHeight = PAGE_CONFIG.footerEndLineY - (MEDIUM_LINE_HEIGHT * 1)

          doc.setFontSize(SMALL_TEXT_FONT_SIZE)
          doc.setFont("helvetica", "normal")

          doc.text(TEXT[1], PAGE_CONFIG.footerEndLineX, cursorLineHeight, { align: 'right'})
          incrementHeight(MEDIUM_LINE_HEIGHT)

          doc.text(TEXT[2], PAGE_CONFIG.footerEndLineX, cursorLineHeight, { align: 'right'})
        }
      }

      // DONE
      // const handleAddPrintCount = (printCount: number) => {
      //   cursorLineHeight = PAGE_CONFIG.footerEndLineY + MEDIUM_LINE_HEIGHT

      //   doc.setFontSize(SMALL_TEXT_FONT_SIZE)
      //   doc.setFont("helvetica", "normal")
      //   doc.text(`No of printing made :`, PAGE_CONFIG.startLineX, cursorLineHeight)

      //   doc.setFontSize(SMALL_TEXT_FONT_SIZE)
      //   doc.setFont("helvetica", "bold")
      //   doc.text(`${printCount}`, PAGE_CONFIG.startLineX + 1.2, cursorLineHeight)
      //   incrementHeight(SMALL_LINE_HEIGHT)
      // }

      // DONE
      // const handleAddMainBodyBorder = (isFirstPage: boolean) => {
      //   const sectionStartLineY = PAGE_CONFIG.bodyStartLineY
      //   const sectionEndLineY = PAGE_CONFIG.bodyEndLineY

      //   const SECTION_HEIGHT = sectionEndLineY - sectionStartLineY

      //   doc.rect(
      //     PAGE_CONFIG.bodyStartLineX,
      //     sectionStartLineY,
      //     PAGE_CONFIG.contentWidth,
      //     SECTION_HEIGHT
      //   )

      //   if (isFirstPage) {
      //     doc.line(0, PAGE_CONFIG.firstPageBodyEndLineY, PAGE_CONFIG.pageSizeY, PAGE_CONFIG.firstPageBodyEndLineY)
      //   }
      // }

      // DONE
      const handleAddMainBodyLayout = (isFirstPage: boolean) => {
        const TABLE_HEADER_HEIGHT = 0.1 + (PAGE_CONFIG.TABLE_CELL_PADDING * 2)
        // const HALF_TABLE_CELL_PADDING = PAGE_CONFIG.TABLE_CELL_PADDING / 2

        const firstSectionStartLineY = PAGE_CONFIG.bodyStartLineY
        const firstSectionEndLineY = isFirstPage ?
          PAGE_CONFIG.firstPageBodyEndLineY - PAGE_CONFIG.SECTION_GAP :
          PAGE_CONFIG.bodyEndLineY - PAGE_CONFIG.SECTION_GAP
        const firstSectionHeight = firstSectionEndLineY - firstSectionStartLineY
        const firstSectionColumnStartX = [ 0.5, 4.05, 4.55, 5.70, 6.85, 8 ]
        const firstSectionColumnNames = [
          'Item / Description',
          'Qty',
          'Unit Cost',
          'VAT Amount',
          'Amount',
        ]

        // FIRST SECTION HEADER
        doc.setLineWidth(0.01)
        doc.setDrawColor(0,0,0)
        doc.rect(
          PAGE_CONFIG.bodyStartLineX,
          firstSectionStartLineY,
          PAGE_CONFIG.contentWidth,
          TABLE_HEADER_HEIGHT
        )

        // FIRST SECTION BODY
        doc.rect(
          PAGE_CONFIG.bodyStartLineX,
          firstSectionStartLineY + TABLE_HEADER_HEIGHT,
          PAGE_CONFIG.contentWidth,
          firstSectionHeight - TABLE_HEADER_HEIGHT
        )

        // FIRST SECTION COLUMNS
        firstSectionColumnNames.forEach((columnName, index) => {
          const startX = firstSectionColumnStartX[index]
          const endX = firstSectionColumnStartX[index + 1]
          const middleX = startX + ((endX - startX) / 2)
          const middleY = firstSectionStartLineY + (TABLE_HEADER_HEIGHT / 2) + (SMALL_LINE_HEIGHT / 2)

          doc.setFontSize(NORMAL_TEXT_FONT_SIZE + 1)
          doc.setFont("helvetica", "bold")

          if (index === 0) {
            doc.text(columnName, startX + PAGE_CONFIG.TABLE_CELL_PADDING, middleY, { align: 'left' })
          } else if (index === 1) {
            doc.text(columnName, middleX, middleY, { align: 'center' })
          } else {
            doc.text(columnName, endX - PAGE_CONFIG.TABLE_CELL_PADDING, middleY, { align: 'right' })
          }

          if (index + 1 !== firstSectionColumnNames.length)
            doc.line(endX, firstSectionStartLineY, endX, firstSectionStartLineY + TABLE_HEADER_HEIGHT)
            // doc.line(endX, firstSectionStartLineY, endX, firstSectionEndLineY)
        })
      }

      // DONE
      const handleAddMainBodyContent = () => {
        interface Section {
          type: string,
          action: Function
        }
        const TABLE_HEADER_HEIGHT = 0.1 + (PAGE_CONFIG.TABLE_CELL_PADDING * 2)
        // const HALF_TABLE_CELL_PADDING = PAGE_CONFIG.TABLE_CELL_PADDING / 2

        const isBillingInvoice = invoicePDFData.header.invoiceTypeName.toUpperCase().includes('BILLING')

        const CONTENTS: Section[] = [
          {
            type: 'Invoice Information - Billings',
            action: () => {
              doc.setPage(1)

              const sectionStartLineY = PAGE_CONFIG.bodyStartLineY + TABLE_HEADER_HEIGHT
              // let sectionEndLineY = PAGE_CONFIG.firstPageBodyEndLineY - PAGE_CONFIG.SECTION_GAP
              // const sectionHeigt = PAGE_CONFIG.headerEndLineY - cursorLineHeight

              // doc.line(0, sectionStartLineY, PAGE_CONFIG.pageSizeX, sectionStartLineY)
              // doc.line(0, sectionEndLineY, PAGE_CONFIG.pageSizeX, sectionEndLineY)

              // const sectionColumnStartX = [ 0.5, 4.05, 4.55, 5.70, 6.85, 8 ]
              // const sectionColumnNames = [
              //   'Item / Description',
              //   'Qty',
              //   'Unit Cost',
              //   'VAT Amount',
              //   'Amount',
              // ]

              doc.setLineWidth(0.01)
              doc.setDrawColor(0,0,0)

              autoTable(doc, {
                // POSITION
                startY: sectionStartLineY,
                margin: {
                  top: sectionStartLineY,
                  left: PAGE_CONFIG.marginLeft,
                  right: PAGE_CONFIG.marginLeft,
                  bottom: PAGE_CONFIG.pageSizeY - PAGE_CONFIG.firstPageBodyEndLineY + ( isBillingInvoice ? 2 : 1.75)
                },

                // CONTENT
                head: [],
                body: invoicePDFData.body.billings,

                // STYLE
                tableWidth: 'auto',
                theme: 'plain',
                styles: {
                  lineWidth: 0.00,
                  lineColor: [0, 0, 0],
                  textColor: [0, 0, 0],
                  fontStyle: 'normal',
                  fontSize: NORMAL_TEXT_FONT_SIZE + 1,
                  cellPadding: {
                    top: PAGE_CONFIG.TABLE_CELL_PADDING,
                    right: PAGE_CONFIG.TABLE_CELL_PADDING,
                    bottom: 0,
                    left: PAGE_CONFIG.TABLE_CELL_PADDING,
                  },
                },
                headStyles: {
                  fillColor: false,
                },
                columnStyles: {
                  0: { cellWidth: 3.55 },
                  1: { cellWidth: 0.5 },
                  2: { cellWidth: 1.15 },
                  3: { cellWidth: 1.15 },
                  4: { cellWidth: 1.15 },
                },

                // HOOKS
                didParseCell: (data) => {
                  // You can still bold body cells if needed
                  if (data.section === 'body') {
                    if (data.column.index === 0) {
                      data.cell.styles.halign = 'left'
                    } else if (data.column.index === 1) {
                      data.cell.styles.halign = 'center'
                    } else {
                      data.cell.styles.halign = 'right'
                    }
                  }
                },
                // Hook called every time a new page is added
                willDrawPage: (data) => {
                  if(doc.getCurrentPageInfo().pageNumber !== 1) {
                    data.table.settings.margin = {
                      top: sectionStartLineY,
                      left: PAGE_CONFIG.marginLeft,
                      right: PAGE_CONFIG.marginLeft,
                      bottom: PAGE_CONFIG.pageSizeY - PAGE_CONFIG.bodyEndLineY + ( isBillingInvoice ? 2 : 1.75)
                    }
                  }
                },
              });

              const lastTable = (doc as any).lastAutoTable;
              const lastRow = lastTable.body[lastTable.body.length - 1];
              const lastCell = lastRow.cells[Object.keys(lastRow.cells)[0]]; // or a specific column key
              const lastContentY = lastCell.y + lastCell.height;

              doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
              doc.setFont('helvetica', 'bold')
              doc.text('***NOTHING FOLLOWS***', PAGE_CONFIG.middleLineX, lastContentY + (LARGE_LINE_HEIGHT * 2), { align: 'center' })


              const tableLastCursorLineHeight = (doc as any).lastAutoTable.finalY;
              // doc.line(PAGE_CONFIG.startLineX, tableLastCursorLineHeight, PAGE_CONFIG.endLineX, tableLastCursorLineHeight)
              // console.log('TABLE ENDS AT Y = ', tableLastCursorLineHeight, tableLastCursorLineHeight - cursorLineHeight);

              cursorLineHeight = tableLastCursorLineHeight
            }
          },
          {
            type: 'Invoice Information - Breakdown Information',
            action: () => {
              const HEIGHT = isBillingInvoice ? 2.1 : 1.65

              const colStartX = [0.5, 3.95, 4, 8]

              const BREAKDOWN1 = [
                { label: 'VATable Sales',         amount: invoicePDFData.body.breakdowns.section1.vatableSales,       isShow: true},
                { label: 'VAT',                   amount: invoicePDFData.body.breakdowns.section1.vatAmount,          isShow: true},
                { label: 'VAT-Exempt Sales',      amount: invoicePDFData.body.breakdowns.section1.vatExemptSales,     isShow: true},
                { label: 'Zero-Rated Sales',      amount: invoicePDFData.body.breakdowns.section1.zeroRatedSales,     isShow: true},
                { label: 'Government Taxes',      amount: invoicePDFData.body.breakdowns.section1.governmentTax,      isShow: isBillingInvoice},
              ]

              const BREAKDOWN2 = [
                { label: 'Total Sales (VAT Inclusive)',amount: invoicePDFData.body.breakdowns.section2.totalSales,         isShow: true},
                { label: 'Less: Government Taxes',amount: invoicePDFData.body.breakdowns.section2.addGovernmentTaxes, isShow: isBillingInvoice},
                { label: 'Less: VAT',             amount: invoicePDFData.body.breakdowns.section2.lessVAT,            isShow: true},
                { label: 'Amount: Net of VAT',    amount: invoicePDFData.body.breakdowns.section2.netOfVAT,           isShow: true},
                { label: 'Add: VAT',              amount: invoicePDFData.body.breakdowns.section2.addVAT,             isShow: true},
                { label: 'Add: Government Taxes', amount: invoicePDFData.body.breakdowns.section2.addGovernmentTaxes, isShow: isBillingInvoice},
                { label: 'Less: Witholding Tax',  amount: invoicePDFData.body.breakdowns.section2.lessWithholdingTax, isShow: true},
                { label: 'TOTAL AMOUNT DUE',      amount: invoicePDFData.body.breakdowns.section2.totalAmountDue,     isShow: true},
              ]

              for (let i = 0; i < doc.getNumberOfPages(); i++) {
                doc.setPage(i + 1)

                let startLineY = 0
                // let endLineY =  i === 0 ? PAGE_CONFIG.firstPageBodyEndLineY : PAGE_CONFIG.bodyEndLineY

                if (i === 0) {
                  startLineY = PAGE_CONFIG.firstPageBodyEndLineY - HEIGHT
                } else {
                  startLineY = PAGE_CONFIG.bodyEndLineY - HEIGHT
                }

                doc.setLineWidth(0.01)
                doc.setDrawColor(0,0,0)
                // doc.line(0, startLineY, 8.5, startLineY)

                doc.setFontSize(NORMAL_TEXT_FONT_SIZE + 1)

                cursorLineHeight = startLineY + PAGE_CONFIG.TABLE_CELL_PADDING

                // doc.line(0, cursorLineHeight, 8.5, cursorLineHeight)

                doc.setLineWidth(0.01)
                doc.setDrawColor(0,0,0)

                autoTable(doc, {
                  // POSITION
                  startY: cursorLineHeight,
                  // margin: {
                  //   top: cursorLineHeight,
                  //   left: colStartX[0] + PAGE_CONFIG.TABLE_CELL_PADDING,
                  //   right: PAGE_CONFIG.pageSizeX - colStartX[1],
                  //   bottom: PAGE_CONFIG.pageSizeY - endLineY + PAGE_CONFIG.TABLE_CELL_PADDING
                  // },
                  margin: {
                    top: cursorLineHeight,
                    left: colStartX[0] + PAGE_CONFIG.TABLE_CELL_PADDING,
                    right: PAGE_CONFIG.pageSizeX - colStartX[1],
                    bottom: 0,
                  },


                  // CONTENT
                  head: [],
                  body: BREAKDOWN1
                    .filter(item => item.isShow)
                    .map((item) => {
                      return [item.label.trim(), item.amount.trim()]
                    }),

                  // STYLE
                  tableWidth: 'wrap',
                  theme: 'grid',
                  styles: {
                    lineWidth: 0.01,
                    lineColor: [0, 0, 0],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: NORMAL_TEXT_FONT_SIZE + 1,
                    halign: 'right',
                    cellPadding: {
                      top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      right: PAGE_CONFIG.TABLE_CELL_PADDING,
                      bottom: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      left: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                    },
                  },
                  headStyles: {
                    fillColor: false,
                  },
                  columnStyles: {
                    0: { cellWidth: ((colStartX[1] - colStartX[0]) /2) - PAGE_CONFIG.TABLE_CELL_PADDING },
                    1: { cellWidth: ((colStartX[1] - colStartX[0]) /2) - PAGE_CONFIG.TABLE_CELL_PADDING },
                  },

                  // HOOKS
                  didParseCell: (data) => {
                    if (data.cell.text.includes('Zero-Rated Sales')) {
                      data.cell.styles.cellPadding = {
                        top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                        right: PAGE_CONFIG.TABLE_CELL_PADDING / 1.5,
                        bottom: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                        left: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      }
                    } else if(data.cell.text.includes('VAT')) {
                      data.cell.styles.cellPadding = {
                        top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                        right: PAGE_CONFIG.TABLE_CELL_PADDING / 1.25,
                        bottom: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                        left: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      }
                    }
                  },
                });

                autoTable(doc, {
                  // POSITION
                  startY: cursorLineHeight,
                  // margin: {
                  //   top: cursorLineHeight,
                  //   left: colStartX[0] + PAGE_CONFIG.TABLE_CELL_PADDING,
                  //   right: PAGE_CONFIG.pageSizeX - colStartX[1],
                  //   bottom: PAGE_CONFIG.pageSizeY - endLineY + PAGE_CONFIG.TABLE_CELL_PADDING
                  // },
                  margin: {
                    top: cursorLineHeight,
                    left: colStartX[2] + PAGE_CONFIG.TABLE_CELL_PADDING,
                    right: PAGE_CONFIG.pageSizeX - colStartX[1],
                    bottom: 0,
                  },


                  // CONTENT
                  head: [],
                  body: BREAKDOWN2
                    .filter(item => item.isShow)
                    .map((item) => {
                      return [item.label.trim(), item.amount.trim()]
                    }),

                  // STYLE
                  tableWidth: 'wrap',
                  theme: 'grid',
                  styles: {
                    lineWidth: 0.01,
                    lineColor: [0, 0, 0],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: NORMAL_TEXT_FONT_SIZE + 1,
                    halign: 'right',
                    cellPadding: {
                      top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      right: PAGE_CONFIG.TABLE_CELL_PADDING,
                      bottom: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      left: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                    },
                  },
                  headStyles: {
                    fillColor: false,
                  },
                  columnStyles: {
                    0: { cellWidth: ((colStartX[3] - colStartX[2]) /2) - PAGE_CONFIG.TABLE_CELL_PADDING },
                    1: { cellWidth: ((colStartX[3] - colStartX[2]) /2) - PAGE_CONFIG.TABLE_CELL_PADDING },
                  },

                  // HOOKS
                  didParseCell: (data) => {
                    if (data.section === 'body') {
                      if (data.cell.text.includes('TOTAL AMOUNT DUE')) {
                        data.cell.styles.cellPadding = {
                          top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                          right: PAGE_CONFIG.TABLE_CELL_PADDING / 1.5,
                          bottom: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                          left: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                        }
                      }
                    }
                  },
                });
              }
            }
          }
        ]

        CONTENTS.forEach(content => {
          content.action()
        });
      }

      // DONE
      const handleAddSection_Signatory = () => {
        doc.setPage(1)

        let sectionStartLineY = PAGE_CONFIG.firstPageBodyEndLineY + PAGE_CONFIG.SECTION_GAP
        let sectionEndLineY = PAGE_CONFIG.bodyEndLineY - PAGE_CONFIG.SECTION_GAP

        // doc.line(0, sectionStartLineY, 8.5, sectionStartLineY)
        // doc.line(0, sectionEndLineY, 8.5, sectionEndLineY)

        // const SECTION_WIDTH = PAGE_CONFIG.contentWidth
        const THIS_SECTION_WIDTH = PAGE_CONFIG.contentWidth
        // const SECTION_HEIGHT = sectionEndLineY - sectionStartLineY
        // const SECTION_PADDING = PAGE_CONFIG.TABLE_CELL_PADDING

        const sectionStartLineX = PAGE_CONFIG.bodyStartLineX
        const sectionEndLineX = sectionStartLineX + THIS_SECTION_WIDTH

        // doc.line(sectionStartLineX, 0, sectionStartLineX, 13)
        // doc.line(sectionEndLineX, 0, sectionEndLineX, 13)

        const TEXT = [
          invoicePDFData.authorizedSignature,
          "AUTHORIZED SIGNATORY"
        ]

        const newStartLineX = sectionEndLineX - 2.5 + 0.25
        const newMiddleLineX = sectionEndLineX - 1.25
        const newEndLineX = sectionEndLineX - 0.25

        cursorLineHeight = sectionEndLineY - EXTRA_LARGE_LINE_HEIGHT

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE + 1)
        doc.setFont('helvetica', 'normal')
        doc.text(TEXT[0], newMiddleLineX, cursorLineHeight - 0.05, { align: 'center' })

        doc.line(newStartLineX, cursorLineHeight, newEndLineX, cursorLineHeight)

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.text(TEXT[1], newMiddleLineX, cursorLineHeight + NORMAL_LINE_HEIGHT, { align: 'center' })

        return [sectionStartLineY, sectionEndLineY]
      }

      const PAGE_LAYOUT: jsPDFOptions = {
        orientation:  'portrait',
        unit:         "in",
        format:       [8.5, 11.0],
      }

      const PAGE_CONFIG = {
        pageSizeX: 8.5,
        pageSizeY: 11,

        marginLeft: 0.5,
        marginTop: 0.5,

        HEADER_HEIGHT: 2.7,
        FOOTER_HEIGHT: 0.4,

        SECTION_GAP: SMALL_LINE_HEIGHT,
        TABLE_CELL_PADDING: 0.1,

        INDENT: 0.38,
        TAB: 0.5,

        overflow: {
          isOnePage: true,
          lastMainBodyPageNumber: 0,
          newBodyEndLineY: 0,
        },

        get contentWidth() {
          return this.pageSizeX - (this.marginLeft * 2);
        },
        get contentHeight() {
          return this.pageSizeY - (this.marginTop * 2);
        },

        // ROOT
        get startLineX() {
          return this.marginLeft;
        },
        get middleLineX() {
          return this.startLineX + (this.contentWidth / 2);
        },
        get endLineX() {
          return this.pageSizeX - this.marginLeft;
        },
        get startLineY() {
          return this.marginTop;
        },
        get middleLineY() {
          return this.startLineY + (this.contentHeight / 2);
        },
        get endLineY() {
          return this.startLineY + this.contentHeight;
        },
        get tablePaddedStartLineX() {
          return this.startLineX + this.TABLE_CELL_PADDING;
        },
        get tablePaddedEndLineX() {
          return this.endLineX - this.TABLE_CELL_PADDING;
        },

        // HEADER
        get headerStartLineX() {
          return this.startLineX;
        },
        get headerEndLineX() {
          return this.endLineX;
        },
        get headerStartLineY() {
          return this.marginTop;
        },
        get headerEndLineY() {
          return this.marginTop + this.HEADER_HEIGHT;
        },

        // FOOTER
        get footerStartLineX() {
          return this.startLineX;
        },
        get footerEndLineX() {
          return this.endLineX;
        },
        get footerStartLineY() {
          return this.endLineY - this.FOOTER_HEIGHT;
        },
        get footerEndLineY() {
          return this.endLineY;
        },

        // BODY
        get bodyStartLineX() {
          return this.startLineX;
        },
        get bodyEndLineX() {
          return this.endLineX;
        },
        get bodyStartLineY() {
          return this.headerEndLineY;
        },
        get bodyMiddleLineY() {
          return this.bodyStartLineY + (( this.bodyEndLineY - this.bodyStartLineY) / 2);
        },
        get bodyEndLineY() {
          return this.footerStartLineY;
        },

        //BODY - FIRST PAGE
        get firstPageBodyMiddleLineY() {
          return this.bodyStartLineY + (( this.firstPageBodyEndLineY - this.bodyStartLineY) / 2);
        },
        get firstPageBodyEndLineY() {
          return this.bodyEndLineY - (1 + (SMALL_LINE_HEIGHT * 2))
        },
      }

      // INITIAL SETTINGS
      const doc = new jsPDF(PAGE_LAYOUT);

      doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
      doc.setFont("helvetica", "normal");
      doc.setLineWidth(0.01);
      doc.setLineHeightFactor(1.0);
      doc.setDrawColor(0,0,0)

      // MAIN

      var cursorLineHeight = PAGE_CONFIG.headerEndLineY

      handleAddMainBodyContent()
      handleAddSection_Signatory()

      // OTHERS
      const numberOfPages = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= numberOfPages; pageNumber++) {

        // MOVE TO PAGE
        doc.setPage(pageNumber)
        // console.log(`${pageNumber} / ${numberOfPages}`, doc.getCurrentPageInfo());

        // PRINT ON ALL PAGES
        // handleAddPageBorder() // TEMPORARY
        // handleAddSectionBorder() // TEMPORARY
        // handleAddMainBodyBorder(pageNumber === 1) // TEMPORARY

        handleAddHeader(pageNumber, numberOfPages)
        handleAddMainBodyLayout(pageNumber === 1)
        handleAddFooter()
        handleAddSystemDocumentNotice()
        handleAddReprintDetails()
        // handleAddPageNumber(pageNumber, numberOfPages)


        // PRINT ON LAST PAGE
        // handleAddPrintCount(1)
      }

      return doc
    }

    return generateDoc(invoicePDFData).output('blob')
  }

  const handleActionGenerateSummaryInvoicesPDFBlob = async (groupedInvoices: INVOICE_PER_COMPANY_AND_PROJECT[]) => {
    // console.log('GENERATE PDF BLOB FOR SUMMARY OF INVOICES', groupedInvoices)

    const generateDoc = (groupedInvoices: INVOICE_PER_COMPANY_AND_PROJECT[]): jsPDF => {

      const VERY_SMALL_LINE_HEIGHT = 0.14
      const SMALL_LINE_HEIGHT = 0.15
      const NORMAL_LINE_HEIGHT = SMALL_LINE_HEIGHT + 0.05
      const LARGE_LINE_HEIGHT = SMALL_LINE_HEIGHT + 0.05

      const TITLE_TEXT_FONT_SIZE = 12
      const NORMAL_TEXT_FONT_SIZE = 10
      const SMALL_TEXT_FONT_SIZE = 7.5
      const VERY_SMALL_TEXT_FONT_SIZE = 6

      const HEADER_HEIGHT = 0.9
      const FOOTER_HEIGHT = ( VERY_SMALL_LINE_HEIGHT * 2 )

      const incrementHeight = (num: number = NORMAL_LINE_HEIGHT) => {cursorLineHeight += num}

      const handleCreateNewPage = () => {
        doc.addPage(pageFormat, pageOrientation)

        cursorLineHeight = marginTop + NORMAL_LINE_HEIGHT
      }

      const handleAddSummaryInvoicesHeader = (GROUPED_INVOICE: INVOICE_PER_COMPANY_AND_PROJECT) => {
        const LOGO_WIDTH  = GROUPED_INVOICE.HEADER.LOGO_SIZE_INCH.WIDTH
        const LOGO_HEIGHT = GROUPED_INVOICE.HEADER.LOGO_SIZE_INCH.HEIGHT

        const HEADER_START_HEIGHT = cursorLineHeight

        // 1ST COLUMN
        if (GROUPED_INVOICE.HEADER.LOGO_URL) {
          doc.addImage(GROUPED_INVOICE.HEADER.LOGO_URL, "JPEG", startLineX, cursorLineHeight - NORMAL_LINE_HEIGHT, LOGO_WIDTH, LOGO_HEIGHT, undefined, "FAST");
        }

        // doc.line(startLineX + LOGO_WIDTH , cursorLineHeight - NORMAL_LINE_HEIGHT, startLineX + LOGO_WIDTH, cursorLineHeight - NORMAL_LINE_HEIGHT + HEADER_HEIGHT )

        // 2ND COLUMN
        const SECOND_COL_START_X = startLineX + LOGO_WIDTH + 0.2
        const SECOND_COL_WIDTH_X = endLineX - SECOND_COL_START_X
        // const SECOND_COL_END_X   = SECOND_COL_START_X + SECOND_COL_WIDTH_X

        doc.setFontSize(TITLE_TEXT_FONT_SIZE + 1)
        doc.setFont("helvetica", "bold");
        doc.text(GROUPED_INVOICE.HEADER.COMPANY_NAME, SECOND_COL_START_X, cursorLineHeight - 0.05, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

        const companyNameWidth = doc.getTextWidth(GROUPED_INVOICE.HEADER.COMPANY_NAME || '-')

        if (companyNameWidth > SECOND_COL_WIDTH_X) {
          const times = companyNameWidth / SECOND_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.10 * Math.ceil(times)))
        } else {
          incrementHeight(NORMAL_LINE_HEIGHT)
        }

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold");
        doc.text('PROJECT:  ' + GROUPED_INVOICE.HEADER.PROJECT_NAME, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

        const projectNameWidth = doc.getTextWidth(GROUPED_INVOICE.HEADER.PROJECT_NAME || '-')

        if (projectNameWidth > SECOND_COL_WIDTH_X) {
          const times = projectNameWidth / SECOND_COL_WIDTH_X
          // console.log(Math.ceil(times), projectNameWidth, SECOND_COL_WIDTH_X );
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight(NORMAL_LINE_HEIGHT)
        }

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");
        doc.text('List of Billing/Service Invoice finalized for the day', SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
        incrementHeight(NORMAL_LINE_HEIGHT)

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");
        doc.text('Invoice Date : ' + (GROUPED_INVOICE.HEADER.INVOICE_DATE ? utilStore.formatDateNumberToStringYYYYMMDD(GROUPED_INVOICE.HEADER.INVOICE_DATE) :  'xxxx/xx/xx'), SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

        cursorLineHeight = HEADER_START_HEIGHT
        incrementHeight(HEADER_HEIGHT)
      }

      const handleAddSummaryInvoicesTable = (GROUPED_INVOICE: INVOICE_PER_COMPANY_AND_PROJECT, INVOICE_RECORDS: InvoiceRecord[], HEIGHT_VACANT_FOR_BODY: number) => {

        const TABLE_START_Y = cursorLineHeight;
        const TABLE_END_Y = cursorLineHeight + HEIGHT_VACANT_FOR_BODY;

        const COLUMN_HEIGHT = 0.3

        const TABLE_PADDING = 0.075

        interface ColumnPosition {
          colStartX: number,
          colWidthX: number,
          colEndX: number
        }

        const columns: ColumnPosition[] = [];
        let previousColEndX = startLineX;

        const sizes = [0.85, 0.65, 0.6, 2, 2, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.65, 0.6]

        for (let i = 0; i < 13; i++) {
          var colStartX = 0;
          var colWidthX = 0;
          var colEndX = 0;

          if (i < 12) {
            colStartX = previousColEndX + TABLE_PADDING;
            colWidthX = sizes[i];
            colEndX   = colStartX + colWidthX + TABLE_PADDING;
          } else {
            colStartX = previousColEndX + TABLE_PADDING;
            colWidthX = endLineX - colStartX - TABLE_PADDING;
            colEndX   = colStartX + colWidthX;
          }

          columns.push({
            colStartX,
            colWidthX,
            colEndX
          });

          previousColEndX = colEndX;
        }

        doc.rect(startLineX, TABLE_START_Y, contentWidth, HEIGHT_VACANT_FOR_BODY );

        // TABLE COLUMN HEADER
        incrementHeight()
        doc.line(startLineX, TABLE_START_Y + COLUMN_HEIGHT, endLineX, TABLE_START_Y + COLUMN_HEIGHT );

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold");

        doc.text("Invoice Number", columns[0].colStartX, cursorLineHeight, { align: 'left' })
        doc.text("PBL Key", columns[1].colStartX, cursorLineHeight, { align: 'left' })
        doc.text("Client Key", columns[2].colStartX, cursorLineHeight, { align: 'left' })
        doc.text("Client Name", columns[3].colStartX, cursorLineHeight, { align: 'left' })
        doc.text("Item / Description", columns[4].colStartX, cursorLineHeight, { align: 'left' })
        doc.text("Vatable Sales", columns[5].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("Vat Exempt", columns[6].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("Zero Rated", columns[7].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("Govt. Taxes", columns[8].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("Total Sales", columns[9].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("VAT", columns[10].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("Wth. Tax", columns[11].colEndX, cursorLineHeight, { align: 'right' })
        doc.text("Invoice Amount", columns[12].colEndX, cursorLineHeight, { align: 'right' })

        incrementHeight(LARGE_LINE_HEIGHT + TABLE_PADDING)


        // TABLE ROWS
        // MAX WITH FOOTER = 18 - 21
        // MAX WITHOUT FOOTER = 25 - 28

        for (let index = 0; index < INVOICE_RECORDS.length; index++) {

          const INVOICE_RECORD = INVOICE_RECORDS[index];

          if (cursorLineHeight + TABLE_PADDING > TABLE_END_Y ) {

            doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
            doc.setFont("helvetica");
            doc.setLineWidth(0.01);

            handleCreateNewPage()

            handleAddSummaryInvoicesHeader(GROUPED_INVOICE)

            handleAddSummaryInvoicesFooter(GROUPED_INVOICE)

            handleAddSummaryInvoicesTable(GROUPED_INVOICE, INVOICE_RECORDS.slice(index), contentHeight - ( HEADER_HEIGHT + ( NORMAL_LINE_HEIGHT * 3 ) + FOOTER_HEIGHT ))

            break;
          }

          const startY = cursorLineHeight;
          var highestEndY = 0;

          doc.setFontSize(SMALL_TEXT_FONT_SIZE)
          doc.setFont("helvetica", "normal");
          doc.text(INVOICE_RECORD.INVOICE_KEY.INVOICE_NUMBER, columns[0].colStartX, cursorLineHeight, { align: 'left' })
          doc.text(INVOICE_RECORD.DETAILS.PBLKEY, columns[1].colStartX, cursorLineHeight, { align: 'left' })
          doc.text(INVOICE_RECORD.DETAILS.CLTKEY, columns[2].colStartX, cursorLineHeight, { align: 'left' })
          doc.text(INVOICE_RECORD.DETAILS.CLTNME, columns[3].colStartX, cursorLineHeight, { align: 'left', maxWidth: columns[3].colWidthX })

          const clientNameWidth = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTNME || '-')

          if (clientNameWidth > columns[3].colWidthX) {
            const times = clientNameWidth / columns[3].colWidthX
            incrementHeight(NORMAL_LINE_HEIGHT + (0.10 * Math.ceil(times)))
          } else {
            incrementHeight(NORMAL_LINE_HEIGHT)
          }

          if ( cursorLineHeight > highestEndY ) {
            highestEndY = cursorLineHeight
          }

          cursorLineHeight = startY;

          for (let index = 0; index < INVOICE_RECORD.ITEM_BREAKDOWNS.length; index++) {
            const ITEM_BREAKDOWN = INVOICE_RECORD.ITEM_BREAKDOWNS[index];

            doc.setFontSize(SMALL_TEXT_FONT_SIZE)
            doc.setFont("helvetica", "normal");
            doc.text(ITEM_BREAKDOWN.ITEM || '', columns[4].colStartX, cursorLineHeight, { align: 'left', maxWidth: columns[4].colWidthX })
            doc.text(ITEM_BREAKDOWN.VATSAL ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.VATSAL) : '0.00', columns[5].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.VATEXM ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.VATEXM) : '0.00', columns[6].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.ZERSAL ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.ZERSAL) : '0.00', columns[7].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.GOVTAX) : '0.00', columns[8].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.NETVAT ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.NETVAT) : '0.00', columns[9].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.VATAMT) : '0.00', columns[10].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.WTHTAX ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.WTHTAX) : '0.00', columns[11].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(ITEM_BREAKDOWN.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(ITEM_BREAKDOWN.AMTDUE) : '0.00', columns[12].colEndX, cursorLineHeight, { align: 'right' })

            const IS_LAST = (index + 1) === INVOICE_RECORD.ITEM_BREAKDOWNS.length ;

            const itemDescWidth = doc.getTextWidth(ITEM_BREAKDOWN.ITEM || '-')
            if (itemDescWidth > columns[4].colWidthX) {
              const times = itemDescWidth / columns[4].colWidthX
              incrementHeight(INVOICE_RECORD.ITEM_BREAKDOWNS.length === 1 ? LARGE_LINE_HEIGHT * 1.5  : NORMAL_LINE_HEIGHT + (0.045 * Math.ceil(times)))
            } else {
              incrementHeight(IS_LAST ? NORMAL_LINE_HEIGHT : VERY_SMALL_LINE_HEIGHT )
            }
          }

          if (INVOICE_RECORD.ITEM_BREAKDOWNS.length > 1) {
            doc.setFontSize(SMALL_TEXT_FONT_SIZE)
            doc.setFont("helvetica", "bold");
            doc.text('TOTAL :', columns[4].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL) : '0.00', columns[5].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM) : '0.00', columns[6].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL) : '0.00', columns[7].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX) : '0.00', columns[8].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT) : '0.00', columns[9].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', columns[10].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX) : '0.00', columns[11].colEndX, cursorLineHeight, { align: 'right' })
            doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE) : '0.00', columns[12].colEndX, cursorLineHeight, { align: 'right' })
            doc.line(columns[5].colStartX, cursorLineHeight - VERY_SMALL_LINE_HEIGHT, columns[12].colEndX, cursorLineHeight - VERY_SMALL_LINE_HEIGHT)
            incrementHeight(LARGE_LINE_HEIGHT + 0.1)
          }


          if ( cursorLineHeight > highestEndY ) {
            highestEndY = cursorLineHeight
          }

          cursorLineHeight = startY;



          cursorLineHeight = highestEndY
        }
      }

      const handleAddSummaryInvoicesFooter = (GROUPED_INVOICE: INVOICE_PER_COMPANY_AND_PROJECT) => {

        const startY = cursorLineHeight

        cursorLineHeight = pageSizeY - marginTop - FOOTER_HEIGHT

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(GROUPED_INVOICE.FOOTER.ACNUM || "Acknowledgement Certificate No. : xxxxxxxxxxxxxxx", startLineX, cursorLineHeight, { align: 'left' })
        incrementHeight(VERY_SMALL_LINE_HEIGHT)

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(GROUPED_INVOICE.FOOTER.ACDAT || "Date Issued : xxxx/xx/xx", startLineX, cursorLineHeight, { align: 'left' })
        incrementHeight(VERY_SMALL_LINE_HEIGHT)

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text("Timestamp : " + (GROUPED_INVOICE.FOOTER.DATSTP ? utilStore.formatDateNumberToStringYYYYMMDD(GROUPED_INVOICE.FOOTER.DATSTP) :  'xxxx/xx/xx' ) + '  ' +  (GROUPED_INVOICE.FOOTER.TIMSTP ? utilStore.formatTimeNumberToString24H(GROUPED_INVOICE.FOOTER.TIMSTP) :  'xx:xx:xx' ), startLineX, cursorLineHeight, { align: 'left' })

        cursorLineHeight = startY
      }

      const pageFormat = 'legal'
      const pageOrientation = 'landscape'

      const doc = new jsPDF({
        orientation:  pageOrientation,
        unit:         "in",
        format:       pageFormat,
      });


      const pageSizeX = 14
      const pageSizeY = 8.5

      const marginLeft = 0.25;
      const marginTop = 0.25;
      const contentWidth = pageSizeX - (marginLeft * 2);    // Width of writable content area
      const contentHeight = pageSizeY - (marginTop * 2);    // Height of writable content area

      var cursorLineHeight = marginTop + NORMAL_LINE_HEIGHT

      const startLineX = marginLeft
      const endLineX = pageSizeX - marginLeft


      groupedInvoices.forEach((GROUPED_INVOICE, index) => {

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica");
        doc.setLineWidth(0.01);

        handleAddSummaryInvoicesHeader(GROUPED_INVOICE)

        handleAddSummaryInvoicesFooter(GROUPED_INVOICE)

        handleAddSummaryInvoicesTable(GROUPED_INVOICE, GROUPED_INVOICE.INVOICE_RECORDS, contentHeight - ( HEADER_HEIGHT + ( NORMAL_LINE_HEIGHT * 3 ) + FOOTER_HEIGHT ))


        if (index + 1 < groupedInvoices.length) {
          handleCreateNewPage()
        }
      })

      return doc
    }

    return generateDoc(groupedInvoices).output('blob')
  }

  const handleActionPreviewDraftInvoice = async (selectedInvoiceRecords: InvoiceRecord | InvoiceRecord[], invoiceDate?: Date) => {
    const isMultiple = Array.isArray(selectedInvoiceRecords)

    const loading = utilStore.startLoadingModal(isMultiple ? 'Loading Draft Invoices...' : 'Loading Draft Invoice...')

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isMultiple && invoiceDate) {
      const invoicePDFDataS: InvoicePDF[] = selectedInvoiceRecords.map((selectedInvoiceRecord) => convertInvoiceRecordsToInvoicePDFs(selectedInvoiceRecord))
      const PDF_BLOBS = invoicePDFDataS.map((invoicePDFData) => generateInvoicePDFBlob(invoicePDFData))
      const PDF_BLOB = await fileStore.mergePDFBlobs(PDF_BLOBS)

      const header = 'Preview Draft Invoices ' + `(${invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })})`
      const name = 'Multiple Draft Invoices ' + `(${invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })})`

      fileStore.handleActionViewFilePDF(
        header,
        `${name}.pdf`,
        PDF_BLOB,
        null,
        () => {},
        () => {}
      )
    } else if (!isMultiple) {

      // console.log(JSON.stringify(selectedInvoiceRecords));

      const invoicePDFData = convertInvoiceRecordsToInvoicePDFs(selectedInvoiceRecords)
      const PDF_BLOB = generateInvoicePDFBlob(invoicePDFData)

      const name = selectedInvoiceRecords.INVOICE_KEY.INVOICE_NAME + ' INVOICE (DRAFT) - ' + selectedInvoiceRecords.INVOICE_KEY.INVOICE_NUMBER

      fileStore.handleActionViewFilePDF(
        name + ' (Preview)',
        `${name}.pdf`,
        PDF_BLOB,
        null,
        () => {},
        () => {}
      )
    }

    loading.close()
  }

  const handleActionPreviewIssuedInvoice = async (issuedInvoiceRecords: InvoiceRecord[], year: number, month: number) => {
    const loading = utilStore.startLoadingModal(`Loading ${issuedInvoiceRecords.length} Invoices...`)

    await new Promise(resolve => setTimeout(resolve, 1000));

    const invoicePDFDataS: InvoicePDF[] = issuedInvoiceRecords.map((issuedInvoiceRecord) => convertInvoiceRecordsToInvoicePDFs(issuedInvoiceRecord))
    const PDF_BLOBS = invoicePDFDataS.map((invoicePDFData) => generateInvoicePDFBlob(invoicePDFData))
    const PDF_BLOB = await fileStore.mergePDFBlobs(PDF_BLOBS)

    const header = 'Issued Invoices - ' + `${month}/${year}`
    const name = `Issued Invoices ${year}-${month}`

    fileStore.handleActionViewFilePDF(
      header,
      `${name}.pdf`,
      PDF_BLOB,
      null,
      () => {},
      () => {}
    )
    fileStore.handleActionDownloadFileBlob(PDF_BLOB, `${name}.pdf`)

    loading.close()
  }

  const handleActionSearch = (tab: 'A'|'B'|'C'|'D') => {
    const hasProject_BillType = () => {
      if (!perBillTypeRunStore.perBillTypeRunForm.projectCode?.PROJCD) {
        toast.add({
          severity: 'warn',
          summary: 'Error: Invalid Project',
          detail: 'Unable to recognize the selected project. Please check.',
          life: 3000
        });
        return false
      }
      return true
    }
    const hasProject_Batch = () => {
      if (!perBatchRunStore.perBatchRunForm.projectCode?.PROJCD) {
        toast.add({
          severity: 'warn',
          summary: 'Error: Invalid Project',
          detail: 'Unable to recognize the selected project. Please check.',
          life: 3000
        });
        return false
      }
      return true
    }
    const hasPBL_Batch = () => {
      const pbl_checking = (
        perBatchRunStore.perBatchRunForm.PBL.pcs_code['1'].trim()  ||
        perBatchRunStore.perBatchRunForm.PBL.phase['1'].trim()     ||
        perBatchRunStore.perBatchRunForm.PBL.block['1'].trim()     ||
        perBatchRunStore.perBatchRunForm.PBL.block['2'].trim()     ||
        perBatchRunStore.perBatchRunForm.PBL.lot['1'].trim()       ||
        perBatchRunStore.perBatchRunForm.PBL.lot['2'].trim()       ||
        perBatchRunStore.perBatchRunForm.PBL.lot['3'].trim()       ||
        perBatchRunStore.perBatchRunForm.PBL.lot['4'].trim()       ||
        perBatchRunStore.perBatchRunForm.PBL.unit_code['1'].trim() ||
        perBatchRunStore.perBatchRunForm.PBL.unit_code['2'].trim()
      )
      if (!pbl_checking) {
        toast.add({
          severity: 'warn',
          summary: 'Error: Missing Unit Identifiers',
          detail: 'No PCS Code, Phase, Block, Lot or Unit Code was entered. Please check.',
          life: 3000
        });
        return false
      }
      return true
    }

    switch (tab) {
      // Per Batch - Long Term Lease
      case 'A':
        if (perBatchRunStore.perBatchRunForm.invoiceDate?.toISOString()) {
          if (perBatchRunStore.perBatchRunForm.billType === 'A' && !hasProject_Batch()) {
            return
          } else if (
            (perBatchRunStore.perBatchRunForm.billType === 'B' || perBatchRunStore.perBatchRunForm.billType === 'C')
            && !hasProject_Batch()
          ) {
            return
          } else if (
            (perBatchRunStore.perBatchRunForm.billType === 'D' || perBatchRunStore.perBatchRunForm.billType === 'E')
            && (!hasProject_Batch() || !hasPBL_Batch())
          ) {
            return
          }

          const loading = utilStore.startLoadingModal('Fetching ...')
          const form = perBatchRunStore.perBatchRunForm
          const data = {
            year: perBatchRunStore.perBatchRunForm.invoiceDate.getFullYear(),
            month: perBatchRunStore.perBatchRunForm.invoiceDate.getMonth() + 1,
            billType: form.billType,
            leaseType: 'Long Term Lease',
            PROJCD: form.projectCode?.PROJCD,
            PCSCOD: form.PBL?.pcs_code['1'] || ' ',
            PHASE: form.PBL?.phase['1'] || ' ',
            BLOCK: `${form.PBL?.block['1'] || ' '}${form.PBL?.block['2'] || ' '}`,
            LOT: `${form.PBL?.lot['1'] || ' '}${form.PBL?.lot['2'] || ' '}${form.PBL?.lot['3'] || ' '}${form.PBL?.lot['4'] || ' '}`,
            UNITCD: `${form.PBL?.unit_code['1'] || ' '}${form.PBL?.unit_code['2'] || ' '}`,
          };
          axios.post(`issuance_lease/per_batch/`, data)
            .then((response) => {
              console.log('FETCHED OPEN BILLINGS', response.data.data);
              perBatchRunStore.billings = []
              perBatchRunStore.billings = response.data.data as LeaseBill[];
              perBatchRunStore.handleActionViewMainDialog()
              perBatchRunStore.billings.forEach((bill) => {
                console.log(bill.NOTICE_NUMBER, bill.SALTYP, bill.CODEA, bill.CODEE);
              })
            })
            .catch(utilStore.handleAxiosError)
            .finally(() => {
              loading.close()
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

      // Per Batch - Short Term Lease
      case 'B':
        if (perBatchRunStore.perBatchRunForm.invoiceDate?.toISOString()) {
          if (perBatchRunStore.perBatchRunForm.billType === 'A' && !hasProject_Batch()) {
            return
          } else if (
            (perBatchRunStore.perBatchRunForm.billType === 'B' || perBatchRunStore.perBatchRunForm.billType === 'C')
            && !hasProject_Batch()
          ) {
            return
          } else if (
            (perBatchRunStore.perBatchRunForm.billType === 'D' || perBatchRunStore.perBatchRunForm.billType === 'E')
            && (!hasProject_Batch() || !hasPBL_Batch())
          ) {
            return
          }

          const loading = utilStore.startLoadingModal('Fetching ...')
          const form = perBatchRunStore.perBatchRunForm
          const data = {
            year: perBatchRunStore.perBatchRunForm.invoiceDate.getFullYear(),
            month: perBatchRunStore.perBatchRunForm.invoiceDate.getMonth() + 1,
            billType: form.billType,
            leaseType: 'Short Term Lease',
            PROJCD: form.projectCode?.PROJCD,
            PCSCOD: form.PBL?.pcs_code['1'] || ' ',
            PHASE: form.PBL?.phase['1'] || ' ',
            BLOCK: `${form.PBL?.block['1'] || ' '}${form.PBL?.block['2'] || ' '}`,
            LOT: `${form.PBL?.lot['1'] || ' '}${form.PBL?.lot['2'] || ' '}${form.PBL?.lot['3'] || ' '}${form.PBL?.lot['4'] || ' '}`,
            UNITCD: `${form.PBL?.unit_code['1'] || ' '}${form.PBL?.unit_code['2'] || ' '}`,
          };
          axios.post(`issuance_lease/per_batch/`, data)
            .then((response) => {
              console.log('FETCHED OPEN BILLINGS', response.data.data);
              perBatchRunStore.billings = []
              perBatchRunStore.billings = response.data.data as LeaseBill[];
              perBatchRunStore.handleActionViewMainDialog()
              // perBatchRunStore.billings.forEach((bill) => {
              //   console.log(bill.NOTICE_NUMBER, bill.SALTYP);
              // })
            })
            .catch(utilStore.handleAxiosError)
            .finally(() => {
              loading.close()
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

      // Per Bill Type / PBL
      case 'C':
        if (perBillTypeRunStore.perBillTypeRunForm.invoiceDate?.toISOString()) {
          if (perBillTypeRunStore.perBillTypeRunForm.billType === 'A') {
            return
          } else if (!hasProject_BillType()) {
            return
          }

          const loading = utilStore.startLoadingModal('Fetching ...')
          const form = perBillTypeRunStore.perBillTypeRunForm
          const data = {
            year: form.invoiceDate.getFullYear(),
            month: form.invoiceDate.getMonth() + 1,
            billType: form.billType,
            PROJCD: form.projectCode?.PROJCD,
            PCSCOD: form.PBL?.pcs_code['1'] || ' ',
            PHASE: form.PBL?.phase['1'] || ' ',
            BLOCK: `${form.PBL?.block['1'] || ' '}${form.PBL?.block['2'] || ' '}`,
            LOT: `${form.PBL?.lot['1'] || ' '}${form.PBL?.lot['2'] || ' '}${form.PBL?.lot['3'] || ' '}${form.PBL?.lot['4'] || ' '}`,
            UNITCD: `${form.PBL?.unit_code['1'] || ' '}${form.PBL?.unit_code['2'] || ' '}`,
          };

          axios.post(`issuance_lease/per_bill_type/`, data)
            .then((response) => {
              console.log('FETCHED OPEN BILLINGS', response.data.data);
              perBillTypeRunStore.billings = []
              perBillTypeRunStore.billings = response.data.data as LeaseBill[];
              perBillTypeRunStore.handleActionViewMainDialog()
              // perBillTypeRunStore.billings.forEach((bill) => {
              //   console.log(bill.NOTICE_NUMBER, bill.SALTYP);
              // })
            })
            .catch(utilStore.handleAxiosError)
            .finally(() => {
              loading.close()
            })
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Missing Required Fields',
            detail: 'Please select a valid invoice date, bill type, and project!',
            life: 3000
          })
        }
        break;

      // Per Verification Run
      case 'D':
        const loading = utilStore.startLoadingModal('Fetching ...')
        const form = perVerificationStore.perVerificationRunForm
        const data = {
          year: form.invoiceDate.getFullYear(),
          month: form.invoiceDate.getMonth() + 1,
        };

        axios.post(`issuance_lease/per_verification/`, data)
          .then((response) => {
            console.log('FETCHED OPEN BILLINGS', response.data.data);
            perVerificationStore.billings = []
            perVerificationStore.billings = response.data.data as LeaseBill[];
          })
          .catch(utilStore.handleAxiosError)
          .finally(() => {
            loading.close()
          })
        break;

      default:
        break;
    }
  }

  const handleActionReset = (tab: 'A'|'B'|'C') => {
    // CLEAR FORM FIELDS
    switch (tab) {
      // Per Batch
      case 'A':
      case 'B':
        if (mainStore.currentValueDate) {
          perBatchRunStore.perBatchRunForm = {
            invoiceDate: mainStore.currentValueDate,
            billType: 'A',
            projectCode: null,
            PBL: {
              pcs_code: {
                1: '',
              },
              phase: {
                1: '',
              },
              block: {
                1: '',
                2: ''
              },
              lot: {
                1: '',
                2: '',
                3: '',
                4: ''
              },
              unit_code: {
                1: '',
                2: ''
              },
            }
          }
        }
        break;

      // Per Bill Type / PBL
      case 'C':
        if (mainStore.currentValueDate) {
          perBillTypeRunStore.perBillTypeRunForm = {
            invoiceDate: mainStore.currentValueDate,
            billType: 'B',
            projectCode: null,
            PBL: {
              pcs_code: {
                1: '',
              },
              phase: {
                1: '',
              },
              block: {
                1: '',
                2: ''
              },
              lot: {
                1: '',
                2: '',
                3: '',
                4: ''
              },
              unit_code: {
                1: '',
                2: ''
              },
            }
          }
        }
        break;


      default:
        break;
    }
  }

  const handleActionPOSTNewIssueInvoices = (
    data: {
      type: string
      invoices: InvoiceRecord[]
    },
    callback: Function,
    closeLoading: Function
  ) => {
    console.log('FOR ISSUANCE OF INVOICES', data.type, data.invoices);
    axios.post('issuance_lease/invoice/', data)
    .then(async (response) => {
      // console.log(response.data.data);
      await callback(response)
    })
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      closeLoading()
    })
  }

  // onMounted(() => {
  //   const loading = utilStore.startLoadingModal('Fetching ...')
  //   const form = perBillTypeRunStore.perBillTypeRunForm
  //   const data = {
  //     year: 2026,
  //     month: 1,
  //     billType: 'B',
  //     PROJCD: 'CL2',
  //     PCSCOD: form.PBL?.pcs_code['1'] || ' ',
  //     PHASE: form.PBL?.phase['1'] || ' ',
  //     BLOCK: `${form.PBL?.block['1'] || ' '}${form.PBL?.block['2'] || ' '}`,
  //     LOT: `${form.PBL?.lot['1'] || ' '}${form.PBL?.lot['2'] || ' '}${form.PBL?.lot['3'] || ' '}${form.PBL?.lot['4'] || ' '}`,
  //     UNITCD: `${form.PBL?.unit_code['1'] || ' '}${form.PBL?.unit_code['2'] || ' '}`,
  //   };

  //   axios.post(`issuance_lease/per_bill_type/`, data)
  //   .then((response) => {
  //     console.log('FETCHED OPEN BILLINGS', response.data.data);
  //     perBillTypeRunStore.billings = response.data.data as LeaseBill[];
  //     perBillTypeRunStore.billings.forEach(bill => {
  //       console.log(bill.BTYPE, bill.BILL_TYPE, bill.NOTICE_NUMBER)
  //     })
  //     perBillTypeRunStore.handleActionViewMainDialog()
  //   })
  //   .catch(utilStore.handleAxiosError)
  //   .finally(() => {
  //     loading.close()
  //   })
  // })

  return {
    BILL_TYPES_WITH_PENALTY_TYPE,
    PENALTY_BILL_TYPES,
    UTILITY_BILL_TYPES,
    BILL_TYPES_WITH_UNIQUE_STYPE,
    UTILITY_BILL_TYPES_WITH_PENALTY,
    UTILITY_MOTHER_BILL_TYPE_GROUPS,
    UTILITY_BILL_TYPE_PER_CLASSIFICATION,

    getSplitClientAddress,
    getDeptCode,
    getItemName,
    getNOMOS,

    processBillings,
    convertBillingsToInvoiceRecords,
    convertInvoiceRecordsToInvoicePDFs,

    generateInvoicePDFBlob,

    handleActionGenerateSummaryInvoicesPDFBlob,
    handleActionPreviewDraftInvoice,
    handleActionPreviewIssuedInvoice,

    handleActionSearch,
    handleActionReset,

    handleActionPOSTNewIssueInvoices,
  }
})