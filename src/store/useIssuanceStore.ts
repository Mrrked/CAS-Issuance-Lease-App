import { COMPANIES, COMPANY_DETAILS } from './config';
import { CRMKPF, INVOICE_PER_COMPANY_AND_PROJECT, InvoicePDF, InvoiceRecord, LeaseBill } from './types';
import jsPDF, { jsPDFOptions } from 'jspdf';

import autoTable from 'jspdf-autotable'
import axios from '../axios'
import { defineStore } from 'pinia'
import { onMounted } from 'vue';
import { useFileStore } from './useFileStore';
import { useMainStore } from './useMainStore';
import { usePerBatchRunStore } from './usePerBatchRunStore';
import { usePerBillTypeRunStore } from './usePerBillTypeRunStore';
import { useSessionStore } from './useSessionStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

export const useIssuanceStore = defineStore('issuance', () => {

  const toast = useToast()

  const fileStore = useFileStore()
  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()

  const perBatchRunStore = usePerBatchRunStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()

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
          'Zero-Rated' :
        BILL_TYPES_WITH_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'N' ?
          'VAT Exempt' :
          'VATable'

      return `${bill_desc} ( ${month} ${year} ) ${type}`

    } else {
      let type = ''
      if (bill.VAT_SALES !== 0) {
        type = 'VATable'
      } else if (bill.VAT_EXEMPT !== 0) {
        type = 'VAT Exempt'
      } else if (bill.ZERO_RATE !== 0) {
        type = 'Zero-Rated'
      }

      return `${bill_desc} ( ${month} ${year} ) ${type}`
    }

  }

  const getNOMOS = (invoiceRecord: InvoiceRecord, billTypes: number[]) => {
    const billings = invoiceRecord.BILLINGS
    var max = 0
    billTypes.forEach(billType => {
      const count = billings.filter((bill) => bill.BILL_TYPE === billType)?.length || 0
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

  const processBillings = (billings: LeaseBill[]): LeaseBill[] => {
    const mergedMap: { [key: string]: LeaseBill } = {};

    let index = 0

    // console.log('SIZE', billings.length);

    billings.map((bill, idx) => {

      const key = `${bill.PBL_KEY}-${bill.YYYYMM}-${bill.PERIOD}-${bill.BILL_TYPE}`;

      const SALES_TYPE =
        bill.SALTYP === 'ZERO' ? 'Z' :
        bill.SALTYP === 'VAT'  ? 'V' :
        bill.SALTYP === 'NVAT' ? 'N' : ''

      const VAT_RATE = bill.VAT_RATE ? bill.VAT_RATE / 100 : 0
      const WHTAX_RATE = bill.WHTAX_RATE ? bill.WHTAX_RATE / 100 : 0

      const GROSS = bill.BILAMT
      const GROSS_VAT_RATE = 1 + VAT_RATE

      // console.log(bill.BILL_TYPE, bill.OLD_BILL_TYPE);

      // FOR UTILITY BILL TYPES
      if (UTILITY_BILL_TYPES.includes(bill.BILL_TYPE)){
        if (mergedMap[key]) {
          mergedMap[key].BALAMT += bill.BALAMT;
          mergedMap[key].BILAMT += bill.BILAMT;
          mergedMap[key].AMTPD += bill.AMTPD;
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
            const WHTAX_VAT_SALES = utilStore.convertNumberToRoundedNumber(bill.BILAMT * WHTAX_RATE)

            mergedMap[key].AMOUNT += bill.BILAMT
            mergedMap[key].UNIT_COST += bill.BILAMT

            mergedMap[key].VAT_SALES += bill.BILAMT
            mergedMap[key].WITHHOLDING_TAX += WHTAX_VAT_SALES
            mergedMap[key].TOTAL_AMOUNT += bill.BILAMT - WHTAX_VAT_SALES
          }

          // VAT EXEMPT
          else if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.VAT_EXEMPT.includes(bill.OLD_BILL_TYPE)) {
            const WHTAX_VAT_EXEMPT = bill.BILL_TYPE !== 5 ? utilStore.convertNumberToRoundedNumber(bill.BILAMT * WHTAX_RATE) : 0

            mergedMap[key].AMOUNT += bill.BILAMT
            mergedMap[key].UNIT_COST += bill.BILAMT

            mergedMap[key].VAT_EXEMPT += bill.BILAMT
            mergedMap[key].WITHHOLDING_TAX += WHTAX_VAT_EXEMPT
            mergedMap[key].TOTAL_AMOUNT += bill.BILAMT - WHTAX_VAT_EXEMPT

          }

          // VAT
          else if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.VAT.includes(bill.OLD_BILL_TYPE)) {
            mergedMap[key].AMOUNT += bill.BILAMT
            // mergedMap[key].UNIT_COST += bill.BILAMT

            mergedMap[key].VAT += bill.BILAMT
            mergedMap[key].TOTAL_AMOUNT += bill.BILAMT
          }

          // GOVT TAX
          else if (UTILITY_BILL_TYPE_PER_CLASSIFICATION.GOVT_TAX.includes(bill.OLD_BILL_TYPE)) {
            mergedMap[key].GOVT_TAX += bill.BILAMT
            mergedMap[key].TOTAL_AMOUNT += bill.BILAMT
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

      }
    })

    // console.log('SIZE', [...Object.values(mergedMap)].length);
    return [...Object.values(mergedMap)] as LeaseBill[]
  }

  const processInvoiceRecords = (billings: LeaseBill[], invoice_date: Date): InvoiceRecord[] => {
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
                USRENT:       sessionStore.authenticatedUser?.username || '',
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

            VATSAL:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.VATSAL + bill.VAT_SALES),
            VATEXM:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.VATEXM + bill.VAT_EXEMPT),
            ZERSAL:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.ZERSAL + bill.ZERO_RATE),
            GOVTAX:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.GOVTAX + bill.GOVT_TAX),

            TOTSAL:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.TOTSAL + bill.AMOUNT),
            NETVAT:         utilStore.convertNumberToRoundedNumber(mergedMap[key].TOTAL_BREAKDOWN.NETVAT + bill.UNIT_COST),
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

          CORF4PF: mergedCORF4PF
        }
      }

      // NEW INVOICE GROUP
      else {
        const selectedProject = mainStore.project_codes.find((code) => code.PROJCD === bill.PROJCD)
        const selectedCompany = COMPANIES.find((c) => c.COMPCD === bill.COMPCD) as COMPANY_DETAILS || COMPANIES[0]

        const [CLIENT_ADDRESS_1, CLIENT_ADDRESS_2] = getSplitClientAddress(bill.CLIENT_ADDRESS)
        const [ remarks1, remarks2, remarks3, remarks4 ] = getInvoiceRemarks(bill)

        mergedMap[key] = {
          PBL_KEY:          bill.PBL_KEY || '',
          TCLTNO:           bill.TCLTNO || 0,
          CLIENT_KEY_RAW:   bill.CLIENT_KEY_RAW || '',

          BILLINGS:         [ bill ],

          HEADER: {
            COMPANY_NAME:   selectedCompany.CONAME,
            ADDRESS:        selectedCompany.ADDRESS,
            LOGO_URL:       selectedCompany.IMG_URL,
            LOGO_SIZE_INCH: selectedCompany.IMG_SIZE_INCH
          },

          INVOICE_KEY:      bill.INVOICE_KEY,

          FOOTER: {
            ACNUM:          bill.ACNUM,
            ACDAT:          bill.ACDAT,
          },

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
            TELNO:          selectedCompany.TEL_NO,
            REGTIN:         selectedCompany.TIN,

            // CLIENT INFO
            CLTNME:         bill.CLIENT_NAME || '',
            RADDR1:         CLIENT_ADDRESS_1 || '',
            RADDR2:         CLIENT_ADDRESS_2 || '',
            CLTTIN:         bill.CLIENT_TIN  || '',
            CLTKEY:         bill.CLIENT_KEY  || '',
            PRJNAM:         selectedProject?.PTITLE || '',
            PBLKEY:         bill.PBL_KEY     || '',

            // FOOTER
            DATSTP:         0,
            TIMSTP:         0,
            AUTHSG:         sessionStore.authenticatedUser?.username || '',

            // TRACKING
            STATUS:         '',
            PRSTAT:         '',
            PRCNT:          0,

            RPDATE:         0,
            RPTIME:         0,
            REPRBY:         '',

            RUNDAT:         0,
            RUNTME:         0,
            RUNBY:          sessionStore.authenticatedUser?.username || '',
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
            VATSAL:         bill.VAT_SALES || 0,        //INCREMENT THIS PER ITEM
            VATEXM:         bill.VAT_EXEMPT || 0,       //INCREMENT THIS PER ITEM
            ZERSAL:         bill.ZERO_RATE || 0,        //INCREMENT THIS PER ITEM
            GOVTAX:         bill.GOVT_TAX || 0,         //INCREMENT THIS PER ITEM

            TOTSAL:         bill.AMOUNT || 0,           //INCREMENT THIS PER ITEM
            NETVAT:         bill.UNIT_COST || 0,        //INCREMENT THIS PER ITEM
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
            CASHCD:         sessionStore.authenticatedUser?.username || '',
            COLSTF:         '',
            ORAMT:          bill.TOTAL_AMOUNT, //UPDATE ON FINAL
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
              USRENT:       sessionStore.authenticatedUser?.username || '',
            }
          ]
        }
      }
    })

    return [...Object.values(mergedMap)] as InvoiceRecord[]
  }

  // const handleActionGenerateInvoicePDFBlob = (INVOICE_RECORDS: InvoiceRecord[]):Blob => {
  //   // console.log('GENERATE PDF BLOB FOR INVOICES', INVOICE_RECORDS)

  //   const generateDoc = (INVOICE_RECORDS: InvoiceRecord[]): jsPDF => {

  //     const VERY_SMALL_LINE_HEIGHT = 0.14
  //     const SMALL_LINE_HEIGHT = 0.15
  //     const NORMAL_LINE_HEIGHT = SMALL_LINE_HEIGHT + 0.05
  //     const LARGE_LINE_HEIGHT = SMALL_LINE_HEIGHT + 0.05

  //     const INVOICE_TEXT_FONT_SIZE = 18
  //     const TITLE_TEXT_FONT_SIZE = 12
  //     const NORMAL_TEXT_FONT_SIZE = 10
  //     const SMALL_TEXT_FONT_SIZE = 8
  //     const VERY_SMALL_TEXT_FONT_SIZE = 6

  //     const HEADER_HEIGHT = 0.9
  //     const FOOTER_HEIGHT = ( VERY_SMALL_LINE_HEIGHT * 3 ) + ( NORMAL_LINE_HEIGHT * 2 )

  //     const incrementHeight = (num: number = NORMAL_LINE_HEIGHT) => {cursorLineHeight += num}

  //     const handleCreateNewPage = () => {
  //       doc.addPage(pageFormat, pageOrientation)

  //       cursorLineHeight = marginTop + NORMAL_LINE_HEIGHT
  //     }

  //     const handleAddInvoiceHeader = (INVOICE_RECORD: InvoiceRecord) => {
  //       const BOTTOM_MARGIN_HEIGHT = NORMAL_LINE_HEIGHT

  //       const LOGO_WIDTH  = INVOICE_RECORD.HEADER.LOGO_SIZE_INCH.WIDTH
  //       const LOGO_HEIGHT = INVOICE_RECORD.HEADER.LOGO_SIZE_INCH.HEIGHT

  //       const HEADER_START_HEIGHT = cursorLineHeight

  //       // 1ST COLUMN
  //       if (INVOICE_RECORD.HEADER.LOGO_URL) {
  //         doc.addImage(INVOICE_RECORD.HEADER.LOGO_URL, "JPEG", startLineX, cursorLineHeight - NORMAL_LINE_HEIGHT, LOGO_WIDTH, LOGO_HEIGHT, undefined, "FAST");
  //       }

  //       // doc.line(startLineX + LOGO_WIDTH , cursorLineHeight - NORMAL_LINE_HEIGHT, startLineX + LOGO_WIDTH, cursorLineHeight - NORMAL_LINE_HEIGHT + HEADER_HEIGHT )

  //       // 2ND COLUMN
  //       const SECOND_COL_START_X = startLineX + LOGO_WIDTH + 0.2
  //       const SECOND_COL_WIDTH_X = 4.25
  //       // const SECOND_COL_END_X   = SECOND_COL_START_X + SECOND_COL_WIDTH_X

  //       // doc.line(SECOND_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, SECOND_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + HEADER_HEIGHT )

  //       doc.setFontSize(TITLE_TEXT_FONT_SIZE + 1)
  //       doc.setFont("helvetica", "bold");
  //       doc.text(INVOICE_RECORD.HEADER.COMPANY_NAME, SECOND_COL_START_X, cursorLineHeight - 0.05, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

  //       const companyNameWidth = doc.getTextWidth(INVOICE_RECORD.HEADER.COMPANY_NAME || '-')

  //       if (companyNameWidth > SECOND_COL_WIDTH_X) {
  //         const times = companyNameWidth / SECOND_COL_WIDTH_X
  //         incrementHeight(SMALL_LINE_HEIGHT + (0.10 * Math.ceil(times)))
  //       } else {
  //         incrementHeight(SMALL_LINE_HEIGHT)
  //       }

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal");
  //       doc.text(INVOICE_RECORD.HEADER.ADDRESS, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

  //       const companyAddressWidth = doc.getTextWidth(INVOICE_RECORD.HEADER.ADDRESS || '-')

  //       if (companyAddressWidth > SECOND_COL_WIDTH_X) {
  //         const times = companyAddressWidth / SECOND_COL_WIDTH_X
  //         incrementHeight(SMALL_LINE_HEIGHT + (0.08 * Math.ceil(times)))
  //       } else {
  //         incrementHeight(SMALL_LINE_HEIGHT)
  //       }

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal");
  //       doc.text('TEL. NO. ' + INVOICE_RECORD.DETAILS.TELNO, SECOND_COL_START_X, cursorLineHeight, { align: 'left' })
  //       incrementHeight(SMALL_LINE_HEIGHT)

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal");
  //       doc.text('VAT REG TIN: ' + INVOICE_RECORD.DETAILS.REGTIN, SECOND_COL_START_X, cursorLineHeight, { align: 'left' })

  //       // 3RD COLUMN
  //       cursorLineHeight = HEADER_START_HEIGHT - 0.05

  //       doc.setFontSize(INVOICE_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold");
  //       doc.text("INVOICE", endLineX, cursorLineHeight, { align: 'right' })
  //       const invoiceTextWidth = doc.getTextWidth('INVOICE')
  //       doc.setFontSize(TITLE_TEXT_FONT_SIZE - 1)
  //       doc.setFont("helvetica", "bold");
  //       doc.text(INVOICE_RECORD.INVOICE_KEY.INVOICE_NAME, endLineX - invoiceTextWidth - 0.1, cursorLineHeight - 0.01, { align: 'right' })
  //       incrementHeight(LARGE_LINE_HEIGHT + 0.075)

  //       doc.setFontSize(TITLE_TEXT_FONT_SIZE - 1)
  //       doc.setFont("helvetica", "bold");
  //       doc.text("No.   " + INVOICE_RECORD.INVOICE_KEY.INVOICE_NUMBER, endLineX, cursorLineHeight, { align: 'right' })
  //       incrementHeight(LARGE_LINE_HEIGHT + 0.05)

  //       doc.setFontSize(TITLE_TEXT_FONT_SIZE - 1)
  //       doc.setFont("helvetica", "bold");
  //       doc.text("Date :   " + (INVOICE_RECORD.DETAILS.DATVAL ? utilStore.formatDateNumberToStringYYYYMMDD(INVOICE_RECORD.DETAILS.DATVAL) :  'xxxx/xx/xx'), endLineX, cursorLineHeight, { align: 'right' })

  //       if (INVOICE_RECORD.DETAILS.PRSTAT === 'R') {
  //         incrementHeight(LARGE_LINE_HEIGHT + 0.10)

  //         doc.setFontSize(INVOICE_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "bold");
  //         doc.text("REPRINT", endLineX, cursorLineHeight, { align: 'right' })
  //       }

  //       cursorLineHeight = HEADER_START_HEIGHT
  //       incrementHeight(HEADER_HEIGHT)

  //       // BOTTOM MARGIN
  //       incrementHeight(BOTTOM_MARGIN_HEIGHT)

  //     }

  //     const handleAddInvoiceClientDescription = (INVOICE_RECORD: InvoiceRecord): number => {

  //       var HIGHEST_CURSOR_LINE_HEIGHT = 0
  //       var TEXT_WIDTH = 0
  //       const initialCursorLineHeight = cursorLineHeight

  //       const LABEL_WIDTH = 0.8

  //       const FIRST_COL_START_X  = startLineX
  //       const FIRST_COL_END_X    = FIRST_COL_START_X + LABEL_WIDTH

  //       const SECOND_COL_START_X = FIRST_COL_END_X + 0.2
  //       const SECOND_COL_WIDTH_X = 3.6
  //       const SECOND_COL_END_X   = SECOND_COL_START_X + SECOND_COL_WIDTH_X

  //       const THIRD_COL_START_X  = SECOND_COL_END_X + 0.2
  //       const THIRD_COL_END_X    = THIRD_COL_START_X + LABEL_WIDTH

  //       const FOURTH_COL_START_X = THIRD_COL_END_X + 0.2
  //       const FOURTH_COL_WIDTH_X = endLineX - FOURTH_COL_START_X
  //       // const FOURTH_COL_END_X   = FOURTH_COL_START_X + FOURTH_COL_WIDTH_X

  //       // 1ST COLUMN

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")

  //       if (INVOICE_RECORD.INVOICE_KEY.TRNTYP === 'B') {
  //         doc.text("BILL TO ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //       } else {
  //         doc.text("SOLD TO ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //       }

  //       doc.text(":", FIRST_COL_END_X, cursorLineHeight, { align: 'left' })

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.DETAILS.CLTNME, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
  //       TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTNME || '-')
  //       if (TEXT_WIDTH > SECOND_COL_WIDTH_X) {
  //         const times = TEXT_WIDTH / SECOND_COL_WIDTH_X
  //         incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
  //       } else {
  //         incrementHeight()
  //       }


  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text("ADDRESS ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //       doc.text(":", FIRST_COL_END_X, cursorLineHeight, { align: 'left' })

  //       const CLIENT_ADDRESS = INVOICE_RECORD.DETAILS.RADDR1 + INVOICE_RECORD.DETAILS.RADDR2
  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(CLIENT_ADDRESS, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
  //       TEXT_WIDTH = doc.getTextWidth(CLIENT_ADDRESS || '-')
  //       if (TEXT_WIDTH > SECOND_COL_WIDTH_X) {
  //         const times = TEXT_WIDTH / SECOND_COL_WIDTH_X
  //         incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
  //       } else {
  //         incrementHeight()
  //       }


  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text("TIN ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //       doc.text(":", FIRST_COL_END_X, cursorLineHeight, { align: 'left' })

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.DETAILS.CLTTIN, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
  //       TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTTIN || '-')
  //       if (TEXT_WIDTH > SECOND_COL_WIDTH_X) {
  //         const times = TEXT_WIDTH / SECOND_COL_WIDTH_X
  //         incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
  //       } else {
  //         incrementHeight()
  //       }

  //       if (cursorLineHeight > HIGHEST_CURSOR_LINE_HEIGHT) {
  //         HIGHEST_CURSOR_LINE_HEIGHT = cursorLineHeight
  //       }


  //       // 2ND COLUMN

  //       cursorLineHeight = initialCursorLineHeight

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text("CLIENT KEY ", THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //       doc.text(":", THIRD_COL_END_X, cursorLineHeight, { align: 'left' })

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.DETAILS.CLTKEY, FOURTH_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FOURTH_COL_WIDTH_X })
  //       TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTKEY || '-')
  //       if (TEXT_WIDTH > FOURTH_COL_WIDTH_X) {
  //         const times = TEXT_WIDTH / FOURTH_COL_WIDTH_X
  //         incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
  //       } else {
  //         incrementHeight()
  //       }

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text("PROJECT ", THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //       doc.text(":", THIRD_COL_END_X, cursorLineHeight, { align: 'left' })

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.DETAILS.PRJNAM, FOURTH_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FOURTH_COL_WIDTH_X })
  //       TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.PRJNAM || '-')
  //       if (TEXT_WIDTH > FOURTH_COL_WIDTH_X) {
  //         const times = TEXT_WIDTH / FOURTH_COL_WIDTH_X
  //         incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
  //       } else {
  //         incrementHeight()
  //       }

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text("UNIT ", THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //       doc.text(":", THIRD_COL_END_X, cursorLineHeight, { align: 'left' })

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.DETAILS.PBLKEY.slice(3,).trim(), FOURTH_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FOURTH_COL_WIDTH_X })
  //       TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.PBLKEY.slice(3,).trim() || '-')
  //       if (TEXT_WIDTH > FOURTH_COL_WIDTH_X) {
  //         const times = TEXT_WIDTH / FOURTH_COL_WIDTH_X
  //         incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
  //       } else {
  //         incrementHeight()
  //       }

  //       if (cursorLineHeight > HIGHEST_CURSOR_LINE_HEIGHT) {
  //         HIGHEST_CURSOR_LINE_HEIGHT = cursorLineHeight
  //       }

  //       cursorLineHeight = HIGHEST_CURSOR_LINE_HEIGHT

  //       return HIGHEST_CURSOR_LINE_HEIGHT
  //     }

  //     const handleAddInvoiceBreakdownTable = (INVOICE_RECORD: InvoiceRecord, HEIGHT_VACANT_FOR_BODY: number, initial: boolean = false) => {

  //       const TABLE_START_Y = cursorLineHeight;
  //       const TABLE_END_Y = cursorLineHeight + HEIGHT_VACANT_FOR_BODY;

  //       const COLUMN_HEIGHT = 0.3

  //       const TABLE_PADDING = 0.075


  //       const FIRST_COL_START_X  = startLineX + TABLE_PADDING
  //       const FIRST_COL_WIDTH_X  = 3.25
  //       const FIRST_COL_END_X    = FIRST_COL_START_X + FIRST_COL_WIDTH_X + TABLE_PADDING

  //       const SECOND_COL_WIDTH_X = 0.5
  //       const SECOND_COL_START_X = FIRST_COL_END_X + (SECOND_COL_WIDTH_X / 2)
  //       const SECOND_COL_END_X   = FIRST_COL_END_X + SECOND_COL_WIDTH_X

  //       const remainingWidth = endLineX - SECOND_COL_END_X

  //       const THIRD_COL_START_X  = SECOND_COL_END_X
  //       const THIRD_COL_WIDTH_X  = remainingWidth / 3
  //       const THIRD_COL_END_X    = THIRD_COL_START_X + THIRD_COL_WIDTH_X

  //       const FOURTH_COL_START_X = THIRD_COL_END_X
  //       const FOURTH_COL_WIDTH_X = remainingWidth / 3
  //       const FOURTH_COL_END_X   = FOURTH_COL_START_X + FOURTH_COL_WIDTH_X

  //       const FIFTH_COL_START_X  = FOURTH_COL_END_X
  //       const FIFTH_COL_WIDTH_X  = endLineX - FIFTH_COL_START_X
  //       const FIFTH_COL_END_X    = FIFTH_COL_START_X + FIFTH_COL_WIDTH_X

  //       doc.rect(startLineX, TABLE_START_Y, contentWidth, HEIGHT_VACANT_FOR_BODY );

  //       // TABLE COLUMN HEADER
  //       incrementHeight()
  //       doc.line(startLineX, TABLE_START_Y + COLUMN_HEIGHT, endLineX, TABLE_START_Y + COLUMN_HEIGHT );

  //       doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold");

  //       doc.text("Item / Description", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //       doc.text("Qty", SECOND_COL_START_X, cursorLineHeight, { align: 'center' })
  //       doc.text("Unit Cost", THIRD_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //       doc.text("VAT Amount", FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //       doc.text("Amount", FIFTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })

  //       doc.line(FIRST_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, FIRST_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
  //       doc.line(SECOND_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, SECOND_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
  //       doc.line(THIRD_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, THIRD_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
  //       doc.line(FOURTH_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, FOURTH_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
  //       incrementHeight(LARGE_LINE_HEIGHT + TABLE_PADDING)

  //       // TABLE ROWS
  //       var TEXT_WIDTH = 0

  //       // MAX WITH FOOTER = 18 - 21
  //       // MAX WITHOUT FOOTER = 25 - 28

  //       // TOTAL BREAKDOWN PART 1

  //       const isBillingInv = INVOICE_RECORD.INVOICE_KEY.TRNTYP === 'B'

  //       const GAP = 0.25
  //       const FOUR_EQ_WIDTH = ( contentWidth - GAP ) / 4

  //       const LINES = isBillingInv ? 6 : 5;
  //       const BOTTOM_BREAKDOWN_HEIGHT = (NORMAL_LINE_HEIGHT * LINES) + TABLE_PADDING
  //       const BOTTOM_BREAKDOWN_START_Y = TABLE_END_Y - BOTTOM_BREAKDOWN_HEIGHT

  //       let count = 0
  //       let isForNewPage = false

  //       for (const item of INVOICE_RECORD.ITEM_BREAKDOWNS) {
  //         count += 1
  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");
  //         doc.text(`${item.QTY || 0}`, SECOND_COL_START_X, cursorLineHeight, { align: 'center' })
  //         doc.text(item.UNTCST ? utilStore.formatNumberToString2DecimalNumber(item.UNTCST) : '0.00', THIRD_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.text(item.VATAMT ? utilStore.formatNumberToString2DecimalNumber(item.VATAMT) : '0.00', FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.text(item.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(item.AMTDUE) : '0.00', FIFTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.text(item.ITEM || '-', FIRST_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FIRST_COL_WIDTH_X })
  //         TEXT_WIDTH = doc.getTextWidth(item.ITEM || '-')
  //         if (TEXT_WIDTH > FIRST_COL_WIDTH_X) {
  //           const times = TEXT_WIDTH / FIRST_COL_WIDTH_X
  //           incrementHeight(NORMAL_LINE_HEIGHT + (NORMAL_LINE_HEIGHT * times) - TABLE_PADDING)
  //         } else {
  //           incrementHeight()
  //         }

  //         // ITEM OVERFLOW HANDLING
  //         isForNewPage = cursorLineHeight > BOTTOM_BREAKDOWN_START_Y

  //         if (isForNewPage && cursorLineHeight > TABLE_END_Y) {
  //           break;
  //         }

  //       }

  //       if (isForNewPage) {
  //         handleAddInvoiceFooter(INVOICE_RECORD)

  //         // console.log('NEW PAGE');

  //         handleCreateNewPage()

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica");
  //         doc.setLineWidth(0.01);

  //         handleAddInvoiceHeader(INVOICE_RECORD)

  //         const CLIENT_DESC_HEIGHT = handleAddInvoiceClientDescription(INVOICE_RECORD)

  //         const NEW_INVOICE_RECORD = {
  //           ...INVOICE_RECORD,
  //           ITEM_BREAKDOWNS: INVOICE_RECORD.ITEM_BREAKDOWNS
  //             .filter((_item, index) => index + 1 > count)
  //         }

  //         handleAddInvoiceBreakdownTable(NEW_INVOICE_RECORD, pageSizeY - ( CLIENT_DESC_HEIGHT + NORMAL_LINE_HEIGHT + 0.3 + NORMAL_LINE_HEIGHT + FOOTER_HEIGHT + marginTop ))
  //       }

  //       if (initial) {
  //         // TOTAL BREAKDOWN PART 2

  //         const BRK_FIRST_COL_START_X  = startLineX + TABLE_PADDING
  //         const BRK_FIRST_COL_WIDTH_X  = FOUR_EQ_WIDTH - (TABLE_PADDING * 2)
  //         const BRK_FIRST_COL_END_X    = BRK_FIRST_COL_START_X + BRK_FIRST_COL_WIDTH_X  + TABLE_PADDING

  //         const BRK_SECOND_COL_START_X = BRK_FIRST_COL_END_X + TABLE_PADDING
  //         const BRK_SECOND_COL_WIDTH_X = 1.5 - (TABLE_PADDING * 2)
  //         const BRK_SECOND_COL_END_X   = BRK_SECOND_COL_START_X + BRK_SECOND_COL_WIDTH_X + TABLE_PADDING

  //         const BRK_THIRD_COL_START_X  = BRK_SECOND_COL_END_X + TABLE_PADDING + GAP
  //         const BRK_THIRD_COL_WIDTH_X  = 1.5 - (TABLE_PADDING * 2)
  //         const BRK_THIRD_COL_END_X    = BRK_THIRD_COL_START_X + BRK_THIRD_COL_WIDTH_X

  //         const BRK_FOURTH_COL_START_X = BRK_THIRD_COL_END_X + TABLE_PADDING
  //         const BRK_FOURTH_COL_WIDTH_X = (pageSizeX - BRK_THIRD_COL_END_X - marginLeft) - (TABLE_PADDING * 2)
  //         const BRK_FOURTH_COL_END_X   = BRK_FOURTH_COL_START_X + BRK_FOURTH_COL_WIDTH_X + TABLE_PADDING


  //         // FIRST COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");

  //         incrementHeight()
  //         incrementHeight()
  //         doc.text("VATable Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("VAT Amount", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("VAT Exempt Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Zero-Rated Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()

  //         if (isBillingInv) {
  //           doc.text("Government Taxes", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //           incrementHeight()
  //         }

  //         // SECOND COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "bold");

  //         incrementHeight()
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()

  //         if (isBillingInv) {
  //           doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //           incrementHeight()
  //         }

  //         // THIRD COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");

  //         doc.text("Total Sales", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Less: VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Amount: Net of VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Add: VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         if (isBillingInv) {
  //           doc.text("Add: Government Taxes", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //           incrementHeight()
  //         }
  //         doc.text("Less: Withholding Tax", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Total Amount Due", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         doc.text("PHP", BRK_THIRD_COL_START_X + ((BRK_THIRD_COL_WIDTH_X + BRK_FOURTH_COL_WIDTH_X) / 2), cursorLineHeight, { align: 'center' })
  //         incrementHeight()

  //         // FOURTH COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "bold");

  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.TOTSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.TOTSAL) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.line(BRK_THIRD_COL_START_X, cursorLineHeight + 0.03, BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight + 0.03);
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         if (isBillingInv) {
  //           doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //           incrementHeight()
  //         }
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.line(BRK_THIRD_COL_START_X, cursorLineHeight + 0.03, BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight + 0.03);
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //       }
  //     }

  //     const handleAddInvoiceBreakdownTable1 = (INVOICE_RECORD: InvoiceRecord, HEIGHT_VACANT_FOR_BODY: number, initial: boolean = false) => {

  //       const TABLE_START_Y = cursorLineHeight;
  //       const TABLE_END_Y = cursorLineHeight + HEIGHT_VACANT_FOR_BODY;

  //       const COLUMN_HEIGHT = 0.3

  //       const TABLE_PADDING = 0.07

  //       interface ColumnPosition {
  //         colStartX: number,
  //         colWidthX: number,
  //         colEndX: number
  //       }

  //       const columns: ColumnPosition[] = [];
  //       let previousColEndX = startLineX;

  //       const sizes = [1.25, 0.1, 0.59, 0.59, 0.59, 0.59, 0.59, 0.59, 0.59, 0.59]

  //       for (let i = 0; i < 10; i++) {
  //         var colStartX = 0;
  //         var colWidthX = 0;
  //         var colEndX = 0;

  //         if (i < 9) {
  //           colStartX = previousColEndX + TABLE_PADDING;
  //           colWidthX = sizes[i];
  //           colEndX   = colStartX + colWidthX + TABLE_PADDING;

  //           doc.line(colEndX , cursorLineHeight, colEndX, cursorLineHeight + COLUMN_HEIGHT )

  //         } else {
  //           colStartX = previousColEndX + TABLE_PADDING;
  //           colWidthX = endLineX - colStartX - TABLE_PADDING;
  //           colEndX   = colStartX + colWidthX;
  //         }

  //         columns.push({
  //           colStartX,
  //           colWidthX,
  //           colEndX
  //         });

  //         previousColEndX = colEndX;
  //       }

  //       doc.rect(startLineX, TABLE_START_Y, contentWidth, HEIGHT_VACANT_FOR_BODY );

  //       // TABLE COLUMN HEADER
  //       incrementHeight(SMALL_LINE_HEIGHT)
  //       doc.line(startLineX, TABLE_START_Y + COLUMN_HEIGHT, endLineX, TABLE_START_Y + COLUMN_HEIGHT );

  //       doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE + 0.5)
  //       doc.setFont("helvetica", "bold");

  //       doc.text("Item / Description", columns[0].colStartX, cursorLineHeight, { align: 'left' })
  //       doc.text("Qty", (columns[1].colStartX + columns[1].colEndX  - TABLE_PADDING) / 2, cursorLineHeight, { align: 'center' })
  //       doc.text("Unit Cost", columns[2].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[2].colWidthX })
  //       doc.text("Vatable Sales", columns[3].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[3].colWidthX })
  //       doc.text("Vat Exempt Sales", columns[4].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[4].colWidthX })
  //       doc.text("Zero Rated Sales", columns[5].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[5].colWidthX })
  //       doc.text("Government Taxes", columns[6].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[6].colWidthX })
  //       doc.text("VAT", columns[7].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[7].colWidthX })
  //       doc.text("Withholding Tax", columns[8].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[8].colWidthX })
  //       doc.text("Amount Due", columns[9].colEndX, cursorLineHeight, { align: 'right', maxWidth: columns[9].colWidthX })

  //       incrementHeight(LARGE_LINE_HEIGHT + 0.08)


  //       // TABLE ROWS

  //       // MAX WITH FOOTER = 18 - 21
  //       // MAX WITHOUT FOOTER = 25 - 28

  //       // TOTAL BREAKDOWN PART 1

  //       const isBillingInv = INVOICE_RECORD.INVOICE_KEY.TRNTYP === 'B'

  //       const GAP = 0.25
  //       const FOUR_EQ_WIDTH = ( contentWidth - GAP ) / 4

  //       const LINES = isBillingInv ? 6 : 5;
  //       const BOTTOM_BREAKDOWN_HEIGHT = (NORMAL_LINE_HEIGHT * LINES) + TABLE_PADDING
  //       const BOTTOM_BREAKDOWN_START_Y = TABLE_END_Y - BOTTOM_BREAKDOWN_HEIGHT

  //       let count = 0
  //       let isForNewPage = false

  //       for (const item of INVOICE_RECORD.ITEM_BREAKDOWNS) {
  //         count += 1
  //         doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE + 0.5)
  //         doc.setFont("helvetica", "normal");

  //         doc.text(item.ITEM || '', columns[0].colStartX, cursorLineHeight, { align: 'left', maxWidth: columns[0].colWidthX })
  //         doc.text(`${item.QTY || ''}`, (columns[1].colStartX + columns[1].colEndX  - TABLE_PADDING) / 2, cursorLineHeight, { align: 'center', maxWidth: columns[1].colWidthX })
  //         doc.text(item.UNTCST ? utilStore.formatNumberToString2DecimalNumber(item.UNTCST) : '0.00', columns[2].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[2].colWidthX })
  //         doc.text(item.VATSAL ? utilStore.formatNumberToString2DecimalNumber(item.VATSAL) : '0.00', columns[3].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[3].colWidthX })
  //         doc.text(item.VATEXM ? utilStore.formatNumberToString2DecimalNumber(item.VATEXM) : '0.00', columns[4].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[4].colWidthX })
  //         doc.text(item.ZERSAL ? utilStore.formatNumberToString2DecimalNumber(item.ZERSAL) : '0.00', columns[5].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[5].colWidthX })
  //         doc.text(item.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(item.GOVTAX) : '0.00', columns[6].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[6].colWidthX })
  //         doc.text(item.VATAMT ? utilStore.formatNumberToString2DecimalNumber(item.VATAMT) : '0.00', columns[7].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[7].colWidthX })
  //         doc.text(item.WTHTAX ? utilStore.formatNumberToString2DecimalNumber(item.WTHTAX) : '0.00', columns[8].colEndX - TABLE_PADDING, cursorLineHeight, { align: 'right', maxWidth: columns[8].colWidthX })
  //         doc.text(item.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(item.AMTDUE) : '0.00', columns[9].colEndX, cursorLineHeight, { align: 'right', maxWidth: columns[9].colWidthX })

  //         var LINES1 = Math.max(...[
  //           doc.getTextWidth(item.ITEM || '') / columns[0].colWidthX,
  //           doc.getTextWidth(`${item.QTY || ''}`) / columns[1].colWidthX,
  //           doc.getTextWidth(item.UNTCST ? utilStore.formatNumberToString2DecimalNumber(item.UNTCST) : '0.00') / columns[2].colWidthX,
  //           doc.getTextWidth(item.VATSAL ? utilStore.formatNumberToString2DecimalNumber(item.VATSAL) : '0.00') / columns[3].colWidthX,
  //           doc.getTextWidth(item.VATEXM ? utilStore.formatNumberToString2DecimalNumber(item.VATEXM) : '0.00') / columns[4].colWidthX,
  //           doc.getTextWidth(item.ZERSAL ? utilStore.formatNumberToString2DecimalNumber(item.ZERSAL) : '0.00') / columns[5].colWidthX,
  //           doc.getTextWidth(item.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(item.GOVTAX) : '0.00') / columns[6].colWidthX,
  //           doc.getTextWidth(item.VATAMT ? utilStore.formatNumberToString2DecimalNumber(item.VATAMT) : '0.00') / columns[7].colWidthX,
  //           doc.getTextWidth(item.WTHTAX ? utilStore.formatNumberToString2DecimalNumber(item.WTHTAX) : '0.00') / columns[8].colWidthX,
  //           doc.getTextWidth(item.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(item.AMTDUE) : '0.00') / columns[9].colWidthX,
  //         ])

  //         if (Math.ceil(LINES1) > 1) {
  //           incrementHeight(SMALL_LINE_HEIGHT + (0.07 * Math.ceil(LINES1)))
  //         } else {
  //           incrementHeight(SMALL_LINE_HEIGHT)
  //         }

  //         // ITEM OVERFLOW HANDLING
  //         isForNewPage = cursorLineHeight > BOTTOM_BREAKDOWN_START_Y

  //         if (isForNewPage && cursorLineHeight > TABLE_END_Y) {
  //           break;
  //         }

  //       }

  //       if (isForNewPage) {
  //         handleAddInvoiceFooter(INVOICE_RECORD)

  //         // console.log('NEW PAGE');

  //         handleCreateNewPage()

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica");
  //         doc.setLineWidth(0.01);

  //         handleAddInvoiceHeader(INVOICE_RECORD)

  //         const CLIENT_DESC_HEIGHT = handleAddInvoiceClientDescription(INVOICE_RECORD)

  //         const NEW_INVOICE_RECORD = {
  //           ...INVOICE_RECORD,
  //           ITEM_BREAKDOWNS: INVOICE_RECORD.ITEM_BREAKDOWNS
  //             .filter((_item, index) => index + 1 > count)
  //         }

  //         handleAddInvoiceBreakdownTable1(NEW_INVOICE_RECORD, pageSizeY - ( CLIENT_DESC_HEIGHT + NORMAL_LINE_HEIGHT + 0.3 + NORMAL_LINE_HEIGHT + FOOTER_HEIGHT + marginTop ))
  //       }

  //       if (initial) {
  //         // TOTAL BREAKDOWN PART 2

  //         const BRK_FIRST_COL_START_X  = startLineX + TABLE_PADDING
  //         const BRK_FIRST_COL_WIDTH_X  = FOUR_EQ_WIDTH - (TABLE_PADDING * 2)
  //         const BRK_FIRST_COL_END_X    = BRK_FIRST_COL_START_X + BRK_FIRST_COL_WIDTH_X  + TABLE_PADDING

  //         const BRK_SECOND_COL_START_X = BRK_FIRST_COL_END_X + TABLE_PADDING
  //         const BRK_SECOND_COL_WIDTH_X = 1.5 - (TABLE_PADDING * 2)
  //         const BRK_SECOND_COL_END_X   = BRK_SECOND_COL_START_X + BRK_SECOND_COL_WIDTH_X + TABLE_PADDING

  //         const BRK_THIRD_COL_START_X  = BRK_SECOND_COL_END_X + TABLE_PADDING + GAP
  //         const BRK_THIRD_COL_WIDTH_X  = 1.5 - (TABLE_PADDING * 2)
  //         const BRK_THIRD_COL_END_X    = BRK_THIRD_COL_START_X + BRK_THIRD_COL_WIDTH_X

  //         const BRK_FOURTH_COL_START_X = BRK_THIRD_COL_END_X + TABLE_PADDING
  //         const BRK_FOURTH_COL_WIDTH_X = (pageSizeX - BRK_THIRD_COL_END_X - marginLeft) - (TABLE_PADDING * 2)
  //         const BRK_FOURTH_COL_END_X   = BRK_FOURTH_COL_START_X + BRK_FOURTH_COL_WIDTH_X + TABLE_PADDING


  //         // FIRST COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");

  //         incrementHeight()
  //         incrementHeight()
  //         doc.text("VATable Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("VAT Amount", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("VAT Exempt Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Zero-Rated Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()

  //         if (isBillingInv) {
  //           doc.text("Government Taxes", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
  //           incrementHeight()
  //         }

  //         // SECOND COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "bold");

  //         incrementHeight()
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()

  //         if (isBillingInv) {
  //           doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //           incrementHeight()
  //         }

  //         // THIRD COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");

  //         doc.text("Total Sales", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Less: VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Amount: Net of VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Add: VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         if (isBillingInv) {
  //           doc.text("Add: Government Taxes", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //           incrementHeight()
  //         }
  //         doc.text("Less: Withholding Tax", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         incrementHeight()
  //         doc.text("Total Amount Due", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
  //         doc.text("PHP", BRK_THIRD_COL_START_X + ((BRK_THIRD_COL_WIDTH_X + BRK_FOURTH_COL_WIDTH_X) / 2), cursorLineHeight, { align: 'center' })
  //         incrementHeight()

  //         // FOURTH COLUMN
  //         cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

  //         doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "bold");

  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.TOTSAL ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.TOTSAL) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.line(BRK_THIRD_COL_START_X, cursorLineHeight + 0.03, BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight + 0.03);
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //         if (isBillingInv) {
  //           doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.GOVTAX) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //           incrementHeight()
  //         }
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         doc.line(BRK_THIRD_COL_START_X, cursorLineHeight + 0.03, BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight + 0.03);
  //         incrementHeight()
  //         doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
  //         incrementHeight()
  //       }
  //     }

  //     const handleAddInvoiceFooter = (INVOICE_RECORD: InvoiceRecord) => {

  //       cursorLineHeight = pageSizeY - marginTop - FOOTER_HEIGHT

  //       const PADDING_X = 0.2
  //       const SIGNATURE_WIDTH = 1.8

  //       const SIGNATURE_START_X = endLineX - SIGNATURE_WIDTH - PADDING_X
  //       const SIGNATURE_END_X = endLineX - PADDING_X
  //       const SIGNATURE_CENTER_X = SIGNATURE_END_X - ( SIGNATURE_WIDTH / 2)

  //       doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text(INVOICE_RECORD.DETAILS.AUTHSG || 'xxxxxxxx', SIGNATURE_CENTER_X, cursorLineHeight, { align: 'center' })
  //       incrementHeight(NORMAL_LINE_HEIGHT)

  //       doc.line(SIGNATURE_START_X, cursorLineHeight - SMALL_LINE_HEIGHT, SIGNATURE_END_X, cursorLineHeight - SMALL_LINE_HEIGHT)

  //       doc.setFontSize(SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "bold")
  //       doc.text("Authorized Signature", SIGNATURE_CENTER_X, cursorLineHeight, { align: 'center' })
  //       incrementHeight(NORMAL_LINE_HEIGHT)

  //       doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.FOOTER.ACNUM || "Acknowledgement Certificate No. : xxxxxxxxxxxxxxx", startLineX, cursorLineHeight, { align: 'left' })
  //       incrementHeight(VERY_SMALL_LINE_HEIGHT)

  //       doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text(INVOICE_RECORD.FOOTER.ACDAT || "Date Issued : xxxx/xx/xx", startLineX, cursorLineHeight, { align: 'left' })
  //       incrementHeight(VERY_SMALL_LINE_HEIGHT)

  //       doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text("Series Range : " + INVOICE_RECORD.INVOICE_KEY.SERIES_RANGE, startLineX, cursorLineHeight, { align: 'left' })

  //       if (INVOICE_RECORD.DETAILS.PRSTAT === 'R') {
  //         doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");
  //         doc.text("Reprint Timestamp : ", endLineX - 0.9, cursorLineHeight, { align: 'right' })

  //         doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");
  //         doc.text((INVOICE_RECORD.DETAILS.RPDATE ? utilStore.formatDateNumberToStringYYYYMMDD(INVOICE_RECORD.DETAILS.RPDATE) :  'xxxx/xx/xx' ) + '  ' +  (INVOICE_RECORD.DETAILS.RPTIME ? utilStore.formatTimeNumberToString24H(INVOICE_RECORD.DETAILS.RPTIME) :  'xx:xx:xx'), endLineX - 0.85, cursorLineHeight, { align: 'left' })
  //       }
  //       incrementHeight(VERY_SMALL_LINE_HEIGHT)

  //       doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica", "normal")
  //       doc.text("Timestamp : " + (INVOICE_RECORD.DETAILS.DATSTP ? utilStore.formatDateNumberToStringYYYYMMDD(INVOICE_RECORD.DETAILS.DATSTP) :  'xxxx/xx/xx' ) + '  ' +  (INVOICE_RECORD.DETAILS.TIMSTP ? utilStore.formatTimeNumberToString24H(INVOICE_RECORD.DETAILS.TIMSTP) :  'xx:xx:xx' ), startLineX, cursorLineHeight, { align: 'left' })

  //       if (INVOICE_RECORD.DETAILS.PRSTAT === 'R') {
  //         doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");
  //         doc.text("Reprint By : ", endLineX - 0.9, cursorLineHeight, { align: 'right' })

  //         doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
  //         doc.setFont("helvetica", "normal");
  //         doc.text(INVOICE_RECORD.DETAILS.REPRBY, endLineX - 0.85, cursorLineHeight, { align: 'left' })
  //       }
  //     }

  //     const pageFormat = 'letter'
  //     const pageOrientation = 'portrait'

  //     const doc = new jsPDF({
  //       orientation:  pageOrientation,
  //       unit:         "in",
  //       format:       pageFormat,         // Letter size (8.5 x 11 inches)
  //     });


  //     const pageSizeX = 8.5
  //     const pageSizeY = 11

  //     const marginLeft = 0.5;
  //     const marginTop = 0.75;
  //     const contentWidth = pageSizeX - (marginLeft * 2);    // Width of writable content area
  //     // const contentHeight = pageSizeY - (marginTop * 2);    // Height of writable content area

  //     var cursorLineHeight = marginTop + NORMAL_LINE_HEIGHT

  //     const startLineX = marginLeft
  //     const endLineX = pageSizeX - marginLeft


  //     INVOICE_RECORDS.forEach((INVOICE_RECORD, index) => {
  //       doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
  //       doc.setFont("helvetica");
  //       doc.setLineWidth(0.01);

  //       handleAddInvoiceHeader(INVOICE_RECORD)

  //       const CLIENT_DESC_HEIGHT = handleAddInvoiceClientDescription(INVOICE_RECORD)

  //       handleAddInvoiceBreakdownTable(INVOICE_RECORD, pageSizeY - ( CLIENT_DESC_HEIGHT + NORMAL_LINE_HEIGHT + 0.3 + NORMAL_LINE_HEIGHT + FOOTER_HEIGHT + marginTop ), true)

  //       handleAddInvoiceFooter(INVOICE_RECORD)

  //       if (index + 1 < INVOICE_RECORDS.length) {
  //         handleCreateNewPage()
  //       }
  //     })

  //     return doc
  //   }

  //   return generateDoc(INVOICE_RECORDS).output('blob')
  // }

  const generateInvoicePDFBlob = (invoicePDFData: InvoicePDF):Blob => {
    console.log('GENERATE PDF BLOB FOR INVOICE', invoicePDFData)

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
      const addEmptyCheckbox = (x: number, y: number, lineWidth: number = 0.01) => {
        doc.setLineWidth(lineWidth)
        doc.setFillColor(225, 225, 225);
        doc.roundedRect(x, y, 0.16, 0.16, 0.045, 0.045, 'FD')
      }

      // DONE
      const addCheckmark = (doc: jsPDF, x: number, y: number, size: number = 0.13) => {
        const lineWidth = 0.005;
        const offset = size * 0.15;

        doc.setLineWidth(lineWidth);

        // Left leg
        doc.line(x + offset, y + size * 0.5, x + size * 0.4, y + size * 0.8);

        // Right leg
        doc.line(x + size * 0.4, y + size * 0.8, x + size * 0.85, y + size * 0.2);
      }

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
      const handleCreateNewPage = () => {
        doc.addPage(PAGE_LAYOUT.format, PAGE_LAYOUT.orientation)
      }

      // DONE
      const handleAddPageBorder = () => {
        doc.line(PAGE_CONFIG.startLineX,  PAGE_CONFIG.startLineY,   PAGE_CONFIG.endLineX,   PAGE_CONFIG.startLineY) // TOP
        doc.line(PAGE_CONFIG.startLineX,  PAGE_CONFIG.endLineY,     PAGE_CONFIG.endLineX,   PAGE_CONFIG.endLineY)   // BOTTOM
        doc.line(PAGE_CONFIG.startLineX,  PAGE_CONFIG.startLineY,   PAGE_CONFIG.startLineX, PAGE_CONFIG.endLineY)   // LEFT
        doc.line(PAGE_CONFIG.endLineX,    PAGE_CONFIG.startLineY,   PAGE_CONFIG.endLineX,   PAGE_CONFIG.endLineY)   // RIGHT
      }

      // DONE
      const handleAddSectionBorder = () => {
        // HEADER
        doc.line(PAGE_CONFIG.headerStartLineX,  PAGE_CONFIG.headerStartLineY,   PAGE_CONFIG.headerEndLineX,   PAGE_CONFIG.headerStartLineY) // TOP
        doc.line(PAGE_CONFIG.headerStartLineX,  PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.headerEndLineX,   PAGE_CONFIG.headerEndLineY)   // BOTTOM
        doc.line(PAGE_CONFIG.headerStartLineX,  PAGE_CONFIG.headerStartLineY,   PAGE_CONFIG.headerStartLineX, PAGE_CONFIG.headerEndLineY)   // LEFT
        doc.line(PAGE_CONFIG.headerEndLineX,    PAGE_CONFIG.headerStartLineY,   PAGE_CONFIG.headerEndLineX,   PAGE_CONFIG.headerEndLineY)   // RIGHT

        // BODY
        doc.line(PAGE_CONFIG.startLineX,        PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.endLineX,         PAGE_CONFIG.headerEndLineY)   // TOP
        doc.line(PAGE_CONFIG.startLineX,        PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.endLineX,         PAGE_CONFIG.footerStartLineY) // BOTTOM
        doc.line(PAGE_CONFIG.startLineX,        PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.footerStartLineX, PAGE_CONFIG.footerStartLineY) // LEFT
        doc.line(PAGE_CONFIG.endLineX,          PAGE_CONFIG.headerEndLineY,     PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerStartLineY) // RIGHT

        // FOOTER
        doc.line(PAGE_CONFIG.footerStartLineX,  PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerStartLineY) // TOP
        doc.line(PAGE_CONFIG.footerStartLineX,  PAGE_CONFIG.footerEndLineY,     PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerEndLineY)   // BOTTOM
        doc.line(PAGE_CONFIG.footerStartLineX,  PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.footerStartLineX, PAGE_CONFIG.footerEndLineY)   // LEFT
        doc.line(PAGE_CONFIG.footerEndLineX,    PAGE_CONFIG.footerStartLineY,   PAGE_CONFIG.footerEndLineX,   PAGE_CONFIG.footerEndLineY)   // RIGHT
      }

      // DONE
      const handleAddHeader = (pageNumber: number, total: number) => {
        cursorLineHeight = PAGE_CONFIG.headerStartLineY + SMALL_LINE_HEIGHT

        const TEXT = [
          // GROUP 1
          "CGC ACCOUNTING SYSTEM VERSION 2.0",
          "Run Date & Time: " + invoicePDFData.header.runDateAndTime,
          "User ID: " + invoicePDFData.header.runUsername.toUpperCase(),
          "Page " + pageNumber + " of " + total,

          invoicePDFData.header.companyName.toUpperCase(),
          "TEL. NO. " + invoicePDFData.header.companyTelephone.toUpperCase(),
          invoicePDFData.header.companyAddress.toUpperCase(),
          "VAT REG. TIN. " + invoicePDFData.header.companyRegisteredTIN.toUpperCase(),

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
          'ADDRESS',
          invoicePDFData.header.address,
          'TIN',
          invoicePDFData.header.tin,

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
          HEADER_COL_START[2] - HEADER_COL_START[1],
          MEDIUM_TEXT_FONT_SIZE + 1,
          "bold",
          MEDIUM_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        addMultiLineText(
          TEXT[5],
          HEADER_COL_START[2] - HEADER_COL_START[1] - 1,
          NORMAL_TEXT_FONT_SIZE,
          "normal",
          NORMAL_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        addMultiLineText(
          TEXT[6],
          HEADER_COL_START[2] - HEADER_COL_START[1],
          NORMAL_TEXT_FONT_SIZE,
          "normal",
          NORMAL_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        addMultiLineText(
          TEXT[7],
          HEADER_COL_START[2] - HEADER_COL_START[1],
          NORMAL_TEXT_FONT_SIZE,
          "normal",
          NORMAL_LINE_HEIGHT,
          0.015,
          HEADER_COL_START[1],
          cursorLineHeight,
        )

        cursorLineHeight = checkpointY + SMALL_LINE_HEIGHT

        doc.setFont("helvetica", "bold")

        doc.setFontSize(MEDIUM_TEXT_FONT_SIZE)
        doc.text(TEXT[8], HEADER_COL_START[2] + 1.175, cursorLineHeight)

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
          invoicePDFData.footer.acn,
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
      const handleAddPageNumber = (pageNumber: number, total: number) => {
        cursorLineHeight = PAGE_CONFIG.footerEndLineY + MEDIUM_LINE_HEIGHT

        const part1 = 'Page ';
        const part2 = `${pageNumber}`;
        const part3 = ' of ';
        const part4 = `${total}`;

        doc.setFontSize(SMALL_TEXT_FONT_SIZE);

        // Measure widths
        doc.setFont("helvetica", "normal");
        const width1 = doc.getTextWidth(part1);
        const width3 = doc.getTextWidth(part3);

        doc.setFont("helvetica", "bold");
        const width2 = doc.getTextWidth(part2);
        const width4 = doc.getTextWidth(part4);

        const totalWidth = width1 + width2 + width3 + width4;

        const startX = PAGE_CONFIG.endLineX - totalWidth;
        let cursorX = startX;

        // Draw "Page "
        doc.setFont("helvetica", "normal");
        doc.text(part1, cursorX, cursorLineHeight);
        cursorX += width1;

        // Draw bold page number
        doc.setFont("helvetica", "bold");
        doc.text(part2, cursorX, cursorLineHeight);
        cursorX += width2;

        // Draw " of "
        doc.setFont("helvetica", "normal");
        doc.text(part3, cursorX, cursorLineHeight);
        cursorX += width3;

        // Draw bold total
        doc.setFont("helvetica", "bold");
        doc.text(part4, cursorX, cursorLineHeight);
      }

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

      // DONE
      const handleAddPrintCount = (printCount: number) => {
        cursorLineHeight = PAGE_CONFIG.footerEndLineY + MEDIUM_LINE_HEIGHT

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(`No of printing made :`, PAGE_CONFIG.startLineX, cursorLineHeight)

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text(`${printCount}`, PAGE_CONFIG.startLineX + 1.2, cursorLineHeight)
        incrementHeight(SMALL_LINE_HEIGHT)
      }

      // DONE
      const handleAddMainBodyBorder = (isFirstPage: boolean) => {
        const sectionStartLineY = PAGE_CONFIG.bodyStartLineY
        const sectionEndLineY = PAGE_CONFIG.bodyEndLineY

        const SECTION_HEIGHT = sectionEndLineY - sectionStartLineY

        doc.rect(
          PAGE_CONFIG.bodyStartLineX,
          sectionStartLineY,
          PAGE_CONFIG.contentWidth,
          SECTION_HEIGHT
        )

        if (isFirstPage) {
          doc.line(0, PAGE_CONFIG.firstPageBodyEndLineY, PAGE_CONFIG.pageSizeY, PAGE_CONFIG.firstPageBodyEndLineY)
        }
      }

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

              const tableLastCursorLineHeight = (doc as any).lastAutoTable.finalY;
              // doc.line(PAGE_CONFIG.startLineX, tableLastCursorLineHeight, PAGE_CONFIG.endLineX, tableLastCursorLineHeight)
              console.log('TABLE ENDS AT Y = ', tableLastCursorLineHeight, tableLastCursorLineHeight - cursorLineHeight);

              cursorLineHeight = tableLastCursorLineHeight
            }
          },
          {
            type: 'Invoice Information - Breakdown Information',
            action: () => {

              const HEIGHT = isBillingInvoice ? 1.9 : 1.65

              const colStartX = [0.5, 3.95, 4, 8]

              const BREAKDOWN1 = [
                { label: 'VATable Sales',         amount: invoicePDFData.body.breakdowns.section1.vatableSales,       isShow: true},
                { label: 'VAT',                   amount: invoicePDFData.body.breakdowns.section1.vatAmount,          isShow: true},
                { label: 'VAT Exempt Sales',      amount: invoicePDFData.body.breakdowns.section1.vatExemptSales,     isShow: true},
                { label: 'Zero-Rated Sales',      amount: invoicePDFData.body.breakdowns.section1.zeroRatedSales,     isShow: true},
                { label: 'Government Taxes',      amount: invoicePDFData.body.breakdowns.section1.governmentTax,      isShow: isBillingInvoice},
              ]

              const BREAKDOWN2 = [
                { label: 'Total Sales',           amount: invoicePDFData.body.breakdowns.section2.totalSales,         isShow: true},
                { label: 'Less: VAT',             amount: invoicePDFData.body.breakdowns.section2.lessVAT,            isShow: true},
                { label: 'Amount: Net of VAT',    amount: invoicePDFData.body.breakdowns.section2.netOfVAT,           isShow: true},
                { label: 'Add: VAT',              amount: invoicePDFData.body.breakdowns.section2.addVAT,             isShow: true},
                { label: 'Add: Government Taxes', amount: invoicePDFData.body.breakdowns.section2.addGovernmentTaxes, isShow: isBillingInvoice},
                { label: 'Less: Witholding Tax',  amount: invoicePDFData.body.breakdowns.section2.lessWithholdingTax, isShow: true},
                { label: 'Total Amount Due',      amount: invoicePDFData.body.breakdowns.section2.totalAmountDue,     isShow: true},
              ]

              for (let i = 0; i < doc.getNumberOfPages(); i++) {
                doc.setPage(i + 1)

                let startLineY = 0
                let endLineY = 0

                if (i === 0) {
                  startLineY = PAGE_CONFIG.firstPageBodyEndLineY - HEIGHT
                  endLineY = PAGE_CONFIG.firstPageBodyEndLineY
                } else {
                  startLineY = PAGE_CONFIG.bodyEndLineY - HEIGHT
                  endLineY = PAGE_CONFIG.bodyEndLineY
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
                      return [item.label, item.amount]
                    }),

                  // STYLE
                  tableWidth: 'auto',
                  theme: 'grid',
                  styles: {
                    lineWidth: 0.01,
                    lineColor: [0, 0, 0],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: NORMAL_TEXT_FONT_SIZE + 1,
                    cellPadding: {
                      top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      right: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
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
                    // You can still bold body cells if needed
                    if (data.section === 'body') {
                      data.cell.styles.halign = 'right'
                    //   if (data.column.index === 0) {
                    //   } else if (data.column.index === 1) {
                    //     data.cell.styles.halign = 'center'
                    //   } else {
                    //     data.cell.styles.halign = 'right'
                    //   }
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
                      return [item.label, item.amount]
                    }),

                  // STYLE
                  tableWidth: 'auto',
                  theme: 'grid',
                  styles: {
                    lineWidth: 0.01,
                    lineColor: [0, 0, 0],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: NORMAL_TEXT_FONT_SIZE + 1,
                    cellPadding: {
                      top: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
                      right: PAGE_CONFIG.TABLE_CELL_PADDING / 2,
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
                    // You can still bold body cells if needed
                    if (data.section === 'body') {
                      data.cell.styles.halign = 'right'
                    //   if (data.column.index === 0) {
                    //   } else if (data.column.index === 1) {
                    //     data.cell.styles.halign = 'center'
                    //   } else {
                    //     data.cell.styles.halign = 'right'
                    //   }
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
          "PREPARER"
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
        setOverrideLastPageBodyEndLineY(value: number) {
          this.overflow.isOnePage = false;
          this.overflow.lastMainBodyPageNumber = doc.getNumberOfPages();
          this.overflow.newBodyEndLineY = value;
          console.log(this.overflow.isOnePage, this.overflow.lastMainBodyPageNumber, this.overflow.newBodyEndLineY);
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

      // handleCreateNewPage()

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

  const handleActionGenerateDraftInvoice = async (selectedInvoiceRecord: InvoiceRecord, callback: Function) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const company = COMPANIES.find((company) => company.COMPCD === selectedInvoiceRecord.INVOICE_KEY.COMPCD) || COMPANIES[0]
    const invoicePDFData: InvoicePDF = {
      header: {
        runDateAndTime: utilStore.convertDateObjToStringMMDDYYYY24HSS(new Date().toISOString()),
        runUsername: sessionStore.authenticatedUser?.username || 'N/A',

        companyName: company.CONAME,
        companyAddress: company.ADDRESS,
        companyInitials: company.COINIT,
        companyTelephone: company.TEL_NO,
        companyRegisteredTIN: company.TIN,

        companyLogo: company.IMG_URL,
        companyLogoWidth: company.IMG_SIZE_INCH.WIDTH,
        companyLogoHeight: company.IMG_SIZE_INCH.HEIGHT,

        invoiceTypeName: selectedInvoiceRecord.INVOICE_KEY.INVOICE_NAME,
        controlNumber: selectedInvoiceRecord.INVOICE_KEY.RECTYP + selectedInvoiceRecord.INVOICE_KEY.COMPLETE_OR_KEY,
        dateValue: utilStore.formatDateNumberToStringMMDDYYYY(selectedInvoiceRecord.DETAILS.DATVAL),

        name: selectedInvoiceRecord.DETAILS.CLTNME,
        address: selectedInvoiceRecord.DETAILS.RADDR1 + selectedInvoiceRecord.DETAILS.RADDR2,
        tin: selectedInvoiceRecord.DETAILS.CLTTIN,
        clientKey: selectedInvoiceRecord.DETAILS.CLTKEY,
        project: selectedInvoiceRecord.DETAILS.PRJNAM,
        unit: selectedInvoiceRecord.PBL_KEY.slice(3),
        salesStaff: 'KIM'
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
        acn: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
        dateIssued: "Date Issued : xx/xx/xxxx",
        approvedSeriesRange: selectedInvoiceRecord.INVOICE_KEY.SERIES_RANGE
      },
      authorizedSignature: sessionStore.authenticatedUser?.user.full_name || 'N/A'
    }

    const PDF_BLOB = generateInvoicePDFBlob(invoicePDFData)

    callback()

    const name = selectedInvoiceRecord.INVOICE_KEY.INVOICE_NAME + ' INVOICE (DRAFT) - ' + selectedInvoiceRecord.INVOICE_KEY.INVOICE_NUMBER

    fileStore.handleActionViewFilePDF(
      name + ' (Preview)',
      `${name}.pdf`,
      PDF_BLOB,
      null,
      () => {},
      () => {}
    )
  }

  const handleActionGenerateDraftInvoices = async (selectedInvoiceRecords: InvoiceRecord[], invoiceDate: Date, callback: Function) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const data = {
      year: invoiceDate.getFullYear(),
      month: invoiceDate.getMonth() + 1,
    }

    const invoicePDFDataS: InvoicePDF[] = selectedInvoiceRecords.
      map((selectedInvoiceRecord) => {
        const company = COMPANIES.find((company) => company.COMPCD === selectedInvoiceRecord.INVOICE_KEY.COMPCD) || COMPANIES[0]

        return {
          header: {
            runDateAndTime: utilStore.convertDateObjToStringMMDDYYYY24HSS(new Date().toISOString()),
            runUsername: sessionStore.authenticatedUser?.username || 'N/A',

            companyName: company.CONAME,
            companyAddress: company.ADDRESS,
            companyInitials: company.COINIT,
            companyTelephone: company.TEL_NO,
            companyRegisteredTIN: company.TIN,

            companyLogo: company.IMG_URL,
            companyLogoWidth: company.IMG_SIZE_INCH.WIDTH,
            companyLogoHeight: company.IMG_SIZE_INCH.HEIGHT,

            invoiceTypeName: selectedInvoiceRecord.INVOICE_KEY.INVOICE_NAME,
            controlNumber: selectedInvoiceRecord.INVOICE_KEY.RECTYP + selectedInvoiceRecord.INVOICE_KEY.COMPLETE_OR_KEY,
            dateValue: utilStore.formatDateNumberToStringMMDDYYYY(selectedInvoiceRecord.DETAILS.DATVAL),

            name: selectedInvoiceRecord.DETAILS.CLTNME,
            address: selectedInvoiceRecord.DETAILS.RADDR1 + selectedInvoiceRecord.DETAILS.RADDR2,
            tin: selectedInvoiceRecord.DETAILS.CLTTIN,
            clientKey: selectedInvoiceRecord.DETAILS.CLTKEY,
            project: selectedInvoiceRecord.DETAILS.PRJNAM,
            unit: selectedInvoiceRecord.PBL_KEY.slice(3),
            salesStaff: 'KIM'
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
            acn: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
            dateIssued: "Date Issued : xx/xx/xxxx",
            approvedSeriesRange: selectedInvoiceRecord.INVOICE_KEY.SERIES_RANGE
          },
          authorizedSignature: sessionStore.authenticatedUser?.user.full_name || 'N/A'
        }
      })

    const PDF_BLOBS = invoicePDFDataS
      .map((invoicePDFData) => generateInvoicePDFBlob(invoicePDFData))

    const PDF_BLOB = await fileStore.mergePDFBlobs(PDF_BLOBS)

    callback()

    const header = 'Preview Draft Invoices ' + `(${invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })})`
    fileStore.handleActionViewFilePDF(header, `MULTIPLE INVOICE (DRAFT) - ${data.year}-${data.month}.pdf`, PDF_BLOB, null, () => {}, () => {})
  }

  const handleActionSearch = (tab: number ) => {

    switch (tab) {
      // Per Bill Type / PBL
      case 1:
        if (perBillTypeRunStore.perBillTypeRunForm.invoiceDate?.toISOString() && perBillTypeRunStore.perBillTypeRunForm.billType && perBillTypeRunStore.perBillTypeRunForm.projectCode) {
          const loading = utilStore.startLoadingModal('Fetching ...')
          const form = perBillTypeRunStore.perBillTypeRunForm
          const data = {
            year: form.invoiceDate.getFullYear(),
            month: form.invoiceDate.getMonth() + 1,
            billType: form.billType,
            PROJCD: form.projectCode?.PROJCD,
            PCSCOD: form.PBL?.pcs_code || ' ',
            PHASE: form.PBL?.phase || ' ',
            BLOCK: `${form.PBL?.block['1'] || ' '}${form.PBL?.block['2'] || ' '}`,
            LOT: `${form.PBL?.lot['1'] || ' '}${form.PBL?.lot['2'] || ' '}${form.PBL?.lot['3'] || ' '}${form.PBL?.lot['4'] || ' '}`,
            UNITCD: `${form.PBL?.unit_code['1'] || ' '}${form.PBL?.unit_code['2'] || ' '}`,
          };

          axios.post(`issuance_lease/per_bill_type/`, data)
          .then((response) => {
            // console.log('FETCHED OPEN BILLINGS', response.data.data);
            perBillTypeRunStore.billings = response.data.data as LeaseBill[];
            perBillTypeRunStore.handleActionViewMainDialog()
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

      // Per Batch
      case 2:
        if (perBatchRunStore.perBatchRunForm.invoiceDate?.toISOString()) {
          const loading = utilStore.startLoadingModal('Fetching ...')
          const data = {
            year: perBatchRunStore.perBatchRunForm.invoiceDate.getFullYear(),
            month: perBatchRunStore.perBatchRunForm.invoiceDate.getMonth() + 1
          };
          axios.post(`issuance_lease/per_batch/`, data)
          .then((response) => {
            // console.log('FETCHED OPEN BILLINGS', response.data.data);
            perBatchRunStore.billings = response.data.data as LeaseBill[];
            perBatchRunStore.handleActionViewMainDialog()
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

      default:
        break;
    }
  }

  const handleActionReset = (tab: number) => {
    // CLEAR FORM FIELDS
    switch (tab) {
      // Per Bill Type / PBL
      case 1:
        perBillTypeRunStore.perBillTypeRunForm = {
          invoiceDate: new Date(),
          projectCode: null,
          billType: '',
          PBL: {
            pcs_code: '',
            phase: '',
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
        break;

      // Per Batch
      case 2:
        perBatchRunStore.perBatchRunForm.invoiceDate = new Date()
        break;

      default:
        break;
    }
  }

  const handleActionIssueFinalInvoices = (
    data: {
      type: string
      invoices: InvoiceRecord[]
    },
    callback: Function,
    closeLoading: Function
  ) => {
    // console.log('FOR ISSUANCE OF INVOICES', data.type, data.invoices);
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

  onMounted(() => {
    // handleActionSearch(2)

    const SAMPLE_BILLING_INVOICE: InvoiceRecord = {
      "PBL_KEY": "CL3 L  U001  ",
      "TCLTNO": 2405014,
      "CLIENT_KEY_RAW": "CL3174L0",
      "BILLINGS": [
        {
          "ID": "CL3 L  U001  2405014",
          "PBL_KEY": "CL3 L  U001  ",
          "CLIENT_NAME": "AT GROUP SERVICES LIMITED - PHILIPPINE BRANCH",
          "CLIENT_ADDRESS": "LU001 CITYNET CENTRAL, SULTAN STREET, BRGY. HIGHWAY HILLS, MANDALUYONG CITY",
          "CLIENT_TIN": "010-410-346-00000 ",
          "CLIENT_KEY": "CL310074L00",
          "CLIENT_KEY_RAW": "CL3174L0",
          "CLIENT_PROJECT_CODE": "CL3",
          "CLIENT_UNIT": " L  U001  ",
          "CLIENT_PIBIG": "V",
          "COMPCD": 1,
          "BRANCH": 1,
          "ACNUM": "Acknowledgement Certificate No. : AC_RDO_mmyyyy_xxxxxx",
          "ACDAT": "Date Issued : xxxx/xx/xx",
          "WHTAX_RATE": 5,
          "YYYYMM": "2025/01",
          "BILL_TYPE": 1,
          "MBTYPE": 0,
          "OLD_BILL_TYPE": 1,
          "OLD_BILL_TYPE_DESC": "RENTAL",
          "SALTYP": "VAT",
          "PROJCD": "CL3",
          "PCSCOD": " ",
          "PHASE": "L",
          "BLOCK": "  ",
          "LOT": "U001",
          "UNITCD": "  ",
          "TCLTNO": 2405014,
          "CLTNUM": 0,
          "PDSCOD": "L",
          "PDSNUM": 0,
          "YY": 2025,
          "MM": 1,
          "PAYTYP": "Y",
          "BTYPE": 1,
          "BILAMT": 90528.48,
          "BALAMT": 90528.48,
          "AMTPD": 0,
          "PRPTAX": 0,
          "DATDUE": 20250113,
          "PERIOD": "01/13/25 - 02/12/25 ",
          "FRBILL": 20250113,
          "TOBILL": 20250212,
          "BALCOD": " ",
          "UPDCOD": " ",
          "RECCOD": " ",
          "VERTAG": " ",
          "USRUPD": "IRCHIN",
          "DATUPD": 20240507,
          "TIMUPD": 145238,
          "BDESC": "RENTAL",
          "ORDER": 15,
          "PENRAT": 2,
          "INTRAT": 3,
          "ORTYPE": "O",
          "FIXPEN": "N",
          "WTHPEN": "Y",
          "MOTACT": 0,
          "PRJACT": "",
          "DEPACT": 0,
          "GENACT": 0,
          "SUBACT": 0,
          "FILL1": 5,
          "FILL2": 0,
          "FILL3": 0,
          "FILL4": "R",
          "FILL5": "",
          "IS_VATABLE": true,
          "VAT_RATE": 12,
          "INVOICE_KEY": {
            "RECTYP": "IS",
            "TRNTYP": "I",
            "COMPLETE_OR_KEY": "01111xxxxxxxx",
            "COMPCD": 1,
            "BRANCH": 1,
            "DEPTCD": 11,
            "ORCOD": "",
            "ORNUM": 0,
            "PROJCD": "CL3",
            "YY": 2025,
            "MM": 1,
            "INVOICE_NAME": "BILLING",
            "INVOICE_NUMBER": "BI01111xxxxxxxx",
            "SERIES_RANGE": "BI011111A000001 - BI011119Z999999"
          },
          "INDEX": 29,
          "UNIT_COST": 80829,
          "AMOUNT": 90528.48,
          "VAT_SALES": 80829,
          "VAT_EXEMPT": 0,
          "ZERO_RATE": 0,
          "TOTAL_SALE": 80829,
          "GOVT_TAX": 0,
          "VAT": 9699.48,
          "WITHHOLDING_TAX": 4041.45,
          "TOTAL_AMOUNT": 86487.03
        }
      ],
      "HEADER": {
        "COMPANY_NAME": "CITYLAND DEVELOPMENT CORPORATION",
        "ADDRESS": "2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V. DELA COSTA ST BEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
        "LOGO_URL": "/src/assets/cdc.jpg",
        "LOGO_SIZE_INCH": {
          "WIDTH": 0.8,
          "HEIGHT": 0.8
        }
      },
      "INVOICE_KEY": {
        "RECTYP": "BI",
        "TRNTYP": "B",
        "COMPLETE_OR_KEY": "01111xxxxxxxx",
        "COMPCD": 1,
        "BRANCH": 1,
        "DEPTCD": 11,
        "ORCOD": "",
        "ORNUM": 0,
        "PROJCD": "CL3",
        "YY": 2025,
        "MM": 1,
        "INVOICE_NAME": "BILLING",
        "INVOICE_NUMBER": "BI01111xxxxxxxx",
        "SERIES_RANGE": "BI0111101000001 - BI0111199999999  "
      },
      "FOOTER": {
        "ACNUM": "Acknowledgement Certificate No. : AC_RDO_mmyyyy_xxxxxx",
        "ACDAT": "Date Issued : xxxx/xx/xx"
      },
      "DETAILS": {
        "RECTYP": "BI",
        "ORNUM": "01111xxxxxxxx",
        "PAYTYP": "Y",
        "PIBIG": "V",
        "SLSTYP": "",
        "DATVAL": 20250101,
        "COMPCD": 1,
        "TELNO": "8893-6060",
        "REGTIN": "000-527-103-00000",
        "CLTNME": "AT GROUP SERVICES LIMITED - PHILIPPINE BRANCH",
        "RADDR1": "LU001 CITYNET CENTRAL, SULTAN STREET, BRGY. HIGHWAY HILLS, MANDALUYONG CITY",
        "RADDR2": "",
        "CLTTIN": "010-410-346-00000 ",
        "CLTKEY": "CL310074L00",
        "PRJNAM": "CITYNET CENTRAL",
        "PBLKEY": "CL3 L  U001  ",
        "DATSTP": 20241203,
        "TIMSTP": 104542,
        "AUTHSG": "IT_MARK",
        "STATUS": "",
        "PRSTAT": "",

        "PRCNT": 0,
        "RPDATE": 0,
        "RPTIME": 0,
        "REPRBY": "",

        "RUNDAT": 20241203,
        "RUNTME": 104542,
        "RUNBY": "IT_MARK"
      },
      "ITEM_BREAKDOWNS": [
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
      ],
      "TOTAL_BREAKDOWN": {
        "RECTYP": "BI",
        "ORNUM": "01111xxxxxxxx",
        "BILTYP": 0,
        "VATSAL": 0,
        "VATEXM": 596.36,
        "ZERSAL": 0,
        "GOVTAX": 14.91,
        "TOTSAL": 596.36,
        "NETVAT": 596.36,
        "VATAMT": 0,
        "PRDTAX": 11.93,
        "AMTDUE": 599.34
      },
      "CORFPF": {
        "COMPCD": 1,
        "BRANCH": 1,
        "DEPTCD": 11,
        "ORCOD": "",
        "ORNUM": 0,
        "DATOR": 0,
        "CASHCD": "IT_MARK",
        "COLSTF": "",
        "ORAMT": 86487.03,
        "NOACCT": 0,
        "PAYTYP": "Y",
        "INTRST": 0,
        "PNALTY": 0,
        "OTHERS": 0,
        "OVRPAY": 0,
        "UNDPAY": 0,
        "PROJCD": "CL3",
        "PCSCOD": " ",
        "PHASE": "L",
        "BLOCK": "  ",
        "LOT": "U001",
        "UNITCD": "  ",
        "PAYCOD": "",
        "PAYEE": "AT GROUP SERVICES LIMITED - PHILIPP",
        "PN#": 0,
        "DATVAL": 20250101,
        "DATPRT": 0,
        "BANKCD": "",
        "BNKACT": "",
        "NOCHK": 0,
        "PRNO": 0,
        "CSHAMT": 0,
        "TCHKAM": 0,
        "LEAFNO": 0,
        "NORMRK": 0,
        "DATCAN": 0,
        "RETCOD": "",
        "UPDCOD": "",
        "NOMOS": 0,
        "TRANSN": 0,
        "DELOR": ""
      },
      "CORTPF": {
        "COMPCD": 1,
        "BRANCH": 1,
        "DEPTCD": 11,
        "ORCOD": "",
        "ORNUM": 0,
        "DATVAL": 20250101,
        "PROJCD": "CL3",
        "PCSCOD": " ",
        "PHASE": "L",
        "BLOCK": "  ",
        "LOT": "U001",
        "UNITCD": "  ",
        "PAYTYP": "Y",
        "CLTNUM": 0,
        "PDSCOD": "L",
        "PDSNUM": 0,
        "TCLTNO": 2405014,
        "DATINS": 20250113,
        "BALRUN": 0,
        "PAYNO": 0,
        "NOMOS": 0
      },
      "CRMKPF": {
        COMPCD: 0,
        BRANCH: 0,
        DEPTCD: 0,
        ORCOD: '',
        ORNUM: 0,
        RMARK1: '',
        RMARK2: '',
        RMARK3: '',
        RMARK4: ''
      },
      "CORF4PF": []
    }
    const SAMPLE_SERVICE_INVOICE: InvoiceRecord = {
      "PBL_KEY": "CL3 L  U001  ",
      "TCLTNO": 2405014,
      "CLIENT_KEY_RAW": "CL3174L0",
      "BILLINGS": [
        {
          "ID": "CL3 L  U001  2405014",
          "PBL_KEY": "CL3 L  U001  ",
          "CLIENT_NAME": "AT GROUP SERVICES LIMITED - PHILIPPINE BRANCH",
          "CLIENT_ADDRESS": "LU001 CITYNET CENTRAL, SULTAN STREET, BRGY. HIGHWAY HILLS, MANDALUYONG CITY",
          "CLIENT_TIN": "010-410-346-00000 ",
          "CLIENT_KEY": "CL310074L00",
          "CLIENT_KEY_RAW": "CL3174L0",
          "CLIENT_PROJECT_CODE": "CL3",
          "CLIENT_UNIT": " L  U001  ",
          "CLIENT_PIBIG": "V",
          "COMPCD": 1,
          "BRANCH": 1,
          "ACNUM": "Acknowledgement Certificate No. : AC_RDO_mmyyyy_xxxxxx",
          "ACDAT": "Date Issued : xxxx/xx/xx",
          "WHTAX_RATE": 5,
          "YYYYMM": "2025/01",
          "BILL_TYPE": 1,
          "MBTYPE": 0,
          "OLD_BILL_TYPE": 1,
          "OLD_BILL_TYPE_DESC": "RENTAL",
          "SALTYP": "VAT",
          "PROJCD": "CL3",
          "PCSCOD": " ",
          "PHASE": "L",
          "BLOCK": "  ",
          "LOT": "U001",
          "UNITCD": "  ",
          "TCLTNO": 2405014,
          "CLTNUM": 0,
          "PDSCOD": "L",
          "PDSNUM": 0,
          "YY": 2025,
          "MM": 1,
          "PAYTYP": "Y",
          "BTYPE": 1,
          "BILAMT": 90528.48,
          "BALAMT": 90528.48,
          "AMTPD": 0,
          "PRPTAX": 0,
          "DATDUE": 20250113,
          "PERIOD": "01/13/25 - 02/12/25 ",
          "FRBILL": 20250113,
          "TOBILL": 20250212,
          "BALCOD": " ",
          "UPDCOD": " ",
          "RECCOD": " ",
          "VERTAG": " ",
          "USRUPD": "IRCHIN",
          "DATUPD": 20240507,
          "TIMUPD": 145238,
          "BDESC": "RENTAL",
          "ORDER": 15,
          "PENRAT": 2,
          "INTRAT": 3,
          "ORTYPE": "O",
          "FIXPEN": "N",
          "WTHPEN": "Y",
          "MOTACT": 0,
          "PRJACT": "",
          "DEPACT": 0,
          "GENACT": 0,
          "SUBACT": 0,
          "FILL1": 5,
          "FILL2": 0,
          "FILL3": 0,
          "FILL4": "R",
          "FILL5": "",
          "IS_VATABLE": true,
          "VAT_RATE": 12,
          "INVOICE_KEY": {
            "RECTYP": "IS",
            "TRNTYP": "I",
            "COMPLETE_OR_KEY": "01111xxxxxxxx",
            "COMPCD": 1,
            "BRANCH": 1,
            "DEPTCD": 11,
            "ORCOD": "",
            "ORNUM": 0,
            "PROJCD": "CL3",
            "YY": 2025,
            "MM": 1,
            "INVOICE_NAME": "BILLING",
            "INVOICE_NUMBER": "BI01111xxxxxxxx",
            "SERIES_RANGE": "BI011111A000001 - BI011119Z999999"
          },
          "INDEX": 29,
          "UNIT_COST": 80829,
          "AMOUNT": 90528.48,
          "VAT_SALES": 80829,
          "VAT_EXEMPT": 0,
          "ZERO_RATE": 0,
          "TOTAL_SALE": 80829,
          "GOVT_TAX": 0,
          "VAT": 9699.48,
          "WITHHOLDING_TAX": 4041.45,
          "TOTAL_AMOUNT": 86487.03
        }
      ],
      "HEADER": {
        "COMPANY_NAME": "CITYLAND DEVELOPMENT CORPORATION",
        "ADDRESS": "2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V. DELA COSTA ST BEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
        "LOGO_URL": "/src/assets/cdc.jpg",
        "LOGO_SIZE_INCH": {
          "WIDTH": 0.8,
          "HEIGHT": 0.8
        }
      },
      "INVOICE_KEY": {
        "RECTYP": "IS",
        "TRNTYP": "I",
        "COMPLETE_OR_KEY": "01111xxxxxxxx",
        "COMPCD": 1,
        "BRANCH": 1,
        "DEPTCD": 11,
        "ORCOD": "",
        "ORNUM": 0,
        "PROJCD": "CL3",
        "YY": 2025,
        "MM": 1,
        "INVOICE_NAME": "SERVICE",
        "INVOICE_NUMBER": "IS01111xxxxxxxx",
        "SERIES_RANGE": "IS0111101000001 - IS0111199999999  "
      },
      "FOOTER": {
        "ACNUM": "Acknowledgement Certificate No. : AC_RDO_mmyyyy_xxxxxx",
        "ACDAT": "Date Issued : xxxx/xx/xx"
      },
      "DETAILS": {
        "RECTYP": "BI",
        "ORNUM": "01111xxxxxxxx",
        "PAYTYP": "Y",
        "PIBIG": "V",
        "SLSTYP": "",
        "DATVAL": 20250101,
        "COMPCD": 1,
        "TELNO": "8893-6060",
        "REGTIN": "000-527-103-00000",
        "CLTNME": "AT GROUP SERVICES LIMITED - PHILIPPINE BRANCH",
        "RADDR1": "LU001 CITYNET CENTRAL, SULTAN STREET, BRGY. HIGHWAY HILLS, MANDALUYONG CITY",
        "RADDR2": "",
        "CLTTIN": "010-410-346-00000 ",
        "CLTKEY": "CL310074L00",
        "PRJNAM": "CITYNET CENTRAL",
        "PBLKEY": "CL3 L  U001  ",
        "DATSTP": 20241203,
        "TIMSTP": 104542,
        "AUTHSG": "IT_MARK",
        "STATUS": "",
        "PRSTAT": "",

        "PRCNT": 0,
        "RPDATE": 0,
        "RPTIME": 0,
        "REPRBY": "",

        "RUNDAT": 20241203,
        "RUNTME": 104542,
        "RUNBY": "IT_MARK"
      },
      "ITEM_BREAKDOWNS": [
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
        {
          "RECTYP": "BI",
          "ORNUM": "01111xxxxxxxx",
          "ITEMNO": 1,
          "BILTYP": 1,
          "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
          "QTY": 1,
          "UNTCST": 596.36,
          "VATAMT": 0,
          "VATSAL": 0,
          "VATEXM": 596.36,
          "ZERSAL": 0,
          "NETVAT": 596.36,
          "WTHTAX": 11.93,
          "GOVTAX": 14.91,
          "WTXRAT": 2,
          "AMTDUE": 596.36,
          "FRDATE": 20250113,
          "TODATE": 20250212,
          "DUEDAT": 20250113
        },
      ],
      "TOTAL_BREAKDOWN": {
        "RECTYP": "BI",
        "ORNUM": "01111xxxxxxxx",
        "BILTYP": 0,
        "VATSAL": 0,
        "VATEXM": 596.36,
        "ZERSAL": 0,
        "GOVTAX": 14.91,
        "TOTSAL": 596.36,
        "NETVAT": 596.36,
        "VATAMT": 0,
        "PRDTAX": 11.93,
        "AMTDUE": 599.34
      },
      "CORFPF": {
        "COMPCD": 1,
        "BRANCH": 1,
        "DEPTCD": 11,
        "ORCOD": "",
        "ORNUM": 0,
        "DATOR": 0,
        "CASHCD": "IT_MARK",
        "COLSTF": "",
        "ORAMT": 86487.03,
        "NOACCT": 0,
        "PAYTYP": "Y",
        "INTRST": 0,
        "PNALTY": 0,
        "OTHERS": 0,
        "OVRPAY": 0,
        "UNDPAY": 0,
        "PROJCD": "CL3",
        "PCSCOD": " ",
        "PHASE": "L",
        "BLOCK": "  ",
        "LOT": "U001",
        "UNITCD": "  ",
        "PAYCOD": "",
        "PAYEE": "AT GROUP SERVICES LIMITED - PHILIPP",
        "PN#": 0,
        "DATVAL": 20250101,
        "DATPRT": 0,
        "BANKCD": "",
        "BNKACT": "",
        "NOCHK": 0,
        "PRNO": 0,
        "CSHAMT": 0,
        "TCHKAM": 0,
        "LEAFNO": 0,
        "NORMRK": 0,
        "DATCAN": 0,
        "RETCOD": "",
        "UPDCOD": "",
        "NOMOS": 0,
        "TRANSN": 0,
        "DELOR": ""
      },
      "CORTPF": {
        "COMPCD": 1,
        "BRANCH": 1,
        "DEPTCD": 11,
        "ORCOD": "",
        "ORNUM": 0,
        "DATVAL": 20250101,
        "PROJCD": "CL3",
        "PCSCOD": " ",
        "PHASE": "L",
        "BLOCK": "  ",
        "LOT": "U001",
        "UNITCD": "  ",
        "PAYTYP": "Y",
        "CLTNUM": 0,
        "PDSCOD": "L",
        "PDSNUM": 0,
        "TCLTNO": 2405014,
        "DATINS": 20250113,
        "BALRUN": 0,
        "PAYNO": 0,
        "NOMOS": 0
      },
      "CRMKPF": {
        COMPCD: 0,
        BRANCH: 0,
        DEPTCD: 0,
        ORCOD: '',
        ORNUM: 0,
        RMARK1: '',
        RMARK2: '',
        RMARK3: '',
        RMARK4: ''
      },
      "CORF4PF": []
    }
    // handleActionGenerateDraftInvoice(
    //   SAMPLE_BILLING_INVOICE,
    //   () => {}
    // )
    // handleActionGenerateDraftInvoices(
    //   [
    //     SAMPLE_BILLING_INVOICE,
    //     SAMPLE_SERVICE_INVOICE
    //   ],
    //   new Date(),
    //   () => {}
    // )
  })

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
    processInvoiceRecords,

    generateInvoicePDFBlob,

    handleActionGenerateSummaryInvoicesPDFBlob,
    handleActionGenerateDraftInvoice,
    handleActionGenerateDraftInvoices,

    handleActionSearch,
    handleActionReset,

    handleActionIssueFinalInvoices,
  }
})