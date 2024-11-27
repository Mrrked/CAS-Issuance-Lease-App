import { COMPANIES, COMPANY_DETAILS } from '../components/Dialog/General/data';
import { InvoiceRecord, LeaseBill } from './types';
import { defineAsyncComponent, markRaw } from 'vue';

import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import PreviewPDFModal from '../components/Dialog/General/PreviewPDFModal.vue';
import axios from '../axios'
import { defineStore } from 'pinia'
import jsPDF from 'jspdf';
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
  const dialog = useDialog()
  const configStore = useConfigStore()
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
    const BT_UNIQUE_STYPE = [1, 4, 2]

    const SALES_TYPE = bill.SALTYP === 'ZERO' ? 'Z' :
      bill.SALTYP === 'VAT'  ? 'V' :
      bill.SALTYP === 'NVAT' ? 'N' : ''

    let [extractYear, extractMonth] = bill.YYYYMM.split("/").map(Number);

    let dateObj = new Date(extractYear, extractMonth - 1, 1);

    const [bill_desc, month, year, type] = [
      bill.BDESC,
      dateObj.toLocaleString('default', { month: 'long' }),
      dateObj.getFullYear(),
      BT_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'Z' ?
        'Zero-Rated' :
      BT_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'N' ?
        'VAT Exempt' :
        'VATable'
    ]

    return `${bill_desc} ( ${month} ${year} ) ${type}`
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
      } else if (BT_UNIQUE_STYPE.includes(bill.BILL_TYPE) && SALES_TYPE === 'N') {
        VAT_EXEMPT = TEMP
      } else {
        VAT_SALES = TEMP
      }

      const TOTAL_AMOUNT = configStore.getRoundedTwoDecimals(VAT_SALES + VAT_EXEMPT + ZERO_RATE + VAT - WHTAX)

      return {
        ...bill,
        INDEX: index++,

        UNIT_COST: TEMP,  //SALE
        AMOUNT: GROSS,    //SALE + VAT

        VAT_SALES: VAT_SALES,
        VAT_EXEMPT: VAT_EXEMPT,
        ZERO_RATE: ZERO_RATE,

        TOTAL_SALE: configStore.getRoundedTwoDecimals(VAT_SALES + VAT_EXEMPT + ZERO_RATE),

        // ADD
        GOVT_TAX: 0,
        VAT: VAT,

        // LESS
        WITHHOLDING_TAX: WHTAX,

        TOTAL_AMOUNT: TOTAL_AMOUNT, //SALE + VAT - WTHTAX
      }
    })
  }

  const processInvoiceRecords = (billings: LeaseBill[], invoice_date: Date): InvoiceRecord[] => {
    const mergedMap: { [key: string]: InvoiceRecord } = {};

    billings.forEach((bill) => {
      const key = bill.ID;

      const invoiceDate: number = invoice_date ? configStore.formatDateToInteger(invoice_date) : 0
      const invoiceType: 'BI' | 'VI'  = bill.INVOICE_KEY.RECTYP

      const completeOrKey: string = bill.INVOICE_KEY.COMPLETE_OR_KEY

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
          },
        }
      }

      // NEW INVOICE GROUP
      else {
        const selectedProject = coreDataStore.project_codes.find((code) => code.PROJCD === bill.PROJCD)
        const selectedCompany = COMPANIES.find((c) => c.COMPCD === bill.COMPCD) as COMPANY_DETAILS || COMPANIES[0]

        const [CLIENT_ADDRESS_1, CLIENT_ADDRESS_2] = getSplitClientAddress(bill.CLIENT_ADDRESS)

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
            DATSTP:         0,  //UPDATE ON FINAL
            TIMSTP:         0,  //UPDATE ON FINAL
            AUTHSG:         configStore.authenticatedUser.username || '',

            // TRACKING
            STATUS:         '',
            RUNDAT:         0,  //UPDATE ON FINAL
            RUNTME:         0,  //UPDATE ON FINAL
            RUNBY:          configStore.authenticatedUser.username || '',

            RPDATE:         0,
            RPTIME:         0,
            REPRBY:         '',
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
            DATOR:          0,  //UPDATE ON FINAL
            CASHCD:         configStore.authenticatedUser.username || '',
            COLSTF:         '',
            ORAMT:          bill.TOTAL_AMOUNT,  //UPDATE ON FINAL
            NOACCT:         0,  //UPDATE ON FINAL no of months
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
            PAYEE:          bill.CLIENT_NAME.substring(0,40),
            PN:             0,
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
          }
        }
      }

    })

    return [...Object.values(mergedMap)] as InvoiceRecord[]
  }

  const handleGenerateInvoicePDFBlob = (INVOICE_RECORDS: InvoiceRecord[]):Blob => {
    console.log('GENERATE PDF BLOB FOR INVOICES', INVOICE_RECORDS)

    const generateDoc = (INVOICE_RECORDS: InvoiceRecord[]): jsPDF => {

      const VERY_SMALL_LINE_HEIGHT = 0.14
      const SMALL_LINE_HEIGHT = 0.15
      const NORMAL_LINE_HEIGHT = SMALL_LINE_HEIGHT + 0.05
      const LARGE_LINE_HEIGHT = SMALL_LINE_HEIGHT + 0.05

      const INVOICE_TEXT_FONT_SIZE = 18
      const TITLE_TEXT_FONT_SIZE = 12
      const NORMAL_TEXT_FONT_SIZE = 10
      const SMALL_TEXT_FONT_SIZE = 8
      const VERY_SMALL_TEXT_FONT_SIZE = 6

      const HEADER_HEIGHT = 0.9
      const FOOTER_HEIGHT = ( VERY_SMALL_LINE_HEIGHT * 3 ) + ( NORMAL_LINE_HEIGHT * 2 )

      const incrementHeight = (num: number = NORMAL_LINE_HEIGHT) => {cursorLineHeight += num}

      const handleCreateNewPage = () => {
        doc.addPage(pageFormat, pageOrientation)

        cursorLineHeight = marginTop + NORMAL_LINE_HEIGHT
      }

      const handleAddInvoiceHeader = (INVOICE_RECORD: InvoiceRecord) => {
        const BOTTOM_MARGIN_HEIGHT = NORMAL_LINE_HEIGHT

        const LOGO_WIDTH  = INVOICE_RECORD.HEADER.LOGO_SIZE_INCH.WIDTH
        const LOGO_HEIGHT = INVOICE_RECORD.HEADER.LOGO_SIZE_INCH.HEIGHT

        const HEADER_START_HEIGHT = cursorLineHeight

        // 1ST COLUMN
        if (INVOICE_RECORD.HEADER.LOGO_URL) {
          doc.addImage(INVOICE_RECORD.HEADER.LOGO_URL, "PNG", startLineX, cursorLineHeight - NORMAL_LINE_HEIGHT, LOGO_WIDTH, LOGO_HEIGHT, undefined, "FAST");
        }

        // doc.line(startLineX + LOGO_WIDTH , cursorLineHeight - NORMAL_LINE_HEIGHT, startLineX + LOGO_WIDTH, cursorLineHeight - NORMAL_LINE_HEIGHT + HEADER_HEIGHT )

        // 2ND COLUMN
        const SECOND_COL_START_X = startLineX + LOGO_WIDTH + 0.2
        const SECOND_COL_WIDTH_X = 4.25
        const SECOND_COL_END_X   = SECOND_COL_START_X + SECOND_COL_WIDTH_X

        // doc.line(SECOND_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, SECOND_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + HEADER_HEIGHT )

        doc.setFontSize(TITLE_TEXT_FONT_SIZE + 1)
        doc.setFont("helvetica", "bold");
        doc.text(INVOICE_RECORD.HEADER.COMPANY_NAME, SECOND_COL_START_X, cursorLineHeight - 0.05, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

        const companyNameWidth = doc.getTextWidth(INVOICE_RECORD.HEADER.COMPANY_NAME || '-')

        if (companyNameWidth > SECOND_COL_WIDTH_X) {
          const times = companyNameWidth / SECOND_COL_WIDTH_X
          incrementHeight(SMALL_LINE_HEIGHT + (0.10 * Math.ceil(times)))
        } else {
          incrementHeight(SMALL_LINE_HEIGHT)
        }

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");
        doc.text(INVOICE_RECORD.HEADER.ADDRESS, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })

        const companyAddressWidth = doc.getTextWidth(INVOICE_RECORD.HEADER.ADDRESS || '-')

        if (companyAddressWidth > SECOND_COL_WIDTH_X) {
          const times = companyAddressWidth / SECOND_COL_WIDTH_X
          incrementHeight(SMALL_LINE_HEIGHT + (0.08 * Math.ceil(times)))
        } else {
          incrementHeight(SMALL_LINE_HEIGHT)
        }

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");
        doc.text('TEL. NO. ' + INVOICE_RECORD.DETAILS.TELNO, SECOND_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight(SMALL_LINE_HEIGHT)

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");
        doc.text('VAT REG TIN: ' + INVOICE_RECORD.DETAILS.REGTIN, SECOND_COL_START_X, cursorLineHeight, { align: 'left' })

        // 3RD COLUMN
        cursorLineHeight = HEADER_START_HEIGHT - 0.05

        doc.setFontSize(INVOICE_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold");
        doc.text("INVOICE", endLineX, cursorLineHeight, { align: 'right' })
        const invoiceTextWidth = doc.getTextWidth('INVOICE')
        doc.setFontSize(TITLE_TEXT_FONT_SIZE - 1)
        doc.setFont("helvetica", "bold");
        doc.text(INVOICE_RECORD.INVOICE_KEY.INVOICE_NAME, endLineX - invoiceTextWidth - 0.1, cursorLineHeight - 0.01, { align: 'right' })
        incrementHeight(LARGE_LINE_HEIGHT + 0.075)

        doc.setFontSize(TITLE_TEXT_FONT_SIZE - 1)
        doc.setFont("helvetica", "bold");
        doc.text("No.   " + INVOICE_RECORD.INVOICE_KEY.INVOICE_NUMBER, endLineX, cursorLineHeight, { align: 'right' })
        incrementHeight(LARGE_LINE_HEIGHT + 0.05)

        doc.setFontSize(TITLE_TEXT_FONT_SIZE - 1)
        doc.setFont("helvetica", "bold");
        doc.text("Date :   " + (INVOICE_RECORD.DETAILS.DATVAL ? configStore.formatDate2(INVOICE_RECORD.DETAILS.DATVAL) :  'xxxx/xx/xx'), endLineX, cursorLineHeight, { align: 'right' })

        cursorLineHeight = HEADER_START_HEIGHT
        incrementHeight(HEADER_HEIGHT)

        // BOTTOM MARGIN
        incrementHeight(BOTTOM_MARGIN_HEIGHT)

      }

      const handleAddInvoiceClientDescription = (INVOICE_RECORD: InvoiceRecord): number => {

        var HIGHEST_CURSOR_LINE_HEIGHT = 0
        var TEXT_WIDTH = 0
        const initialCursorLineHeight = cursorLineHeight

        const LABEL_WIDTH = 0.8

        const FIRST_COL_START_X  = startLineX
        const FIRST_COL_END_X    = FIRST_COL_START_X + LABEL_WIDTH

        const SECOND_COL_START_X = FIRST_COL_END_X + 0.2
        const SECOND_COL_WIDTH_X = 3.6
        const SECOND_COL_END_X   = SECOND_COL_START_X + SECOND_COL_WIDTH_X

        const THIRD_COL_START_X  = SECOND_COL_END_X + 0.2
        const THIRD_COL_END_X    = THIRD_COL_START_X + LABEL_WIDTH

        const FOURTH_COL_START_X = THIRD_COL_END_X + 0.2
        const FOURTH_COL_WIDTH_X = endLineX - FOURTH_COL_START_X
        const FOURTH_COL_END_X   = FOURTH_COL_START_X + FOURTH_COL_WIDTH_X

        // 1ST COLUMN

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("SOLD TO ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text(":", FIRST_COL_END_X, cursorLineHeight, { align: 'left' })

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.DETAILS.CLTNME, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
        TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTNME || '-')
        if (TEXT_WIDTH > SECOND_COL_WIDTH_X) {
          const times = TEXT_WIDTH / SECOND_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight()
        }


        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("ADDRESS ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text(":", FIRST_COL_END_X, cursorLineHeight, { align: 'left' })

        const CLIENT_ADDRESS = INVOICE_RECORD.DETAILS.RADDR1 + INVOICE_RECORD.DETAILS.RADDR2
        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(CLIENT_ADDRESS, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
        TEXT_WIDTH = doc.getTextWidth(CLIENT_ADDRESS || '-')
        if (TEXT_WIDTH > SECOND_COL_WIDTH_X) {
          const times = TEXT_WIDTH / SECOND_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight()
        }


        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("TIN ", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text(":", FIRST_COL_END_X, cursorLineHeight, { align: 'left' })

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.DETAILS.CLTTIN, SECOND_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: SECOND_COL_WIDTH_X })
        TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTTIN || '-')
        if (TEXT_WIDTH > SECOND_COL_WIDTH_X) {
          const times = TEXT_WIDTH / SECOND_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight()
        }

        if (cursorLineHeight > HIGHEST_CURSOR_LINE_HEIGHT) {
          HIGHEST_CURSOR_LINE_HEIGHT = cursorLineHeight
        }


        // 2ND COLUMN

        cursorLineHeight = initialCursorLineHeight

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("CLIENT KEY ", THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text(":", THIRD_COL_END_X, cursorLineHeight, { align: 'left' })

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.DETAILS.CLTKEY, FOURTH_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FOURTH_COL_WIDTH_X })
        TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.CLTKEY || '-')
        if (TEXT_WIDTH > FOURTH_COL_WIDTH_X) {
          const times = TEXT_WIDTH / FOURTH_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight()
        }

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("PROJECT ", THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text(":", THIRD_COL_END_X, cursorLineHeight, { align: 'left' })

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.DETAILS.PRJNAM, FOURTH_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FOURTH_COL_WIDTH_X })
        TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.PRJNAM || '-')
        if (TEXT_WIDTH > FOURTH_COL_WIDTH_X) {
          const times = TEXT_WIDTH / FOURTH_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight()
        }

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("UNIT ", THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text(":", THIRD_COL_END_X, cursorLineHeight, { align: 'left' })

        doc.setFontSize(SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.DETAILS.PBLKEY.slice(3,), FOURTH_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FOURTH_COL_WIDTH_X })
        TEXT_WIDTH = doc.getTextWidth(INVOICE_RECORD.DETAILS.PBLKEY.slice(3,) || '-')
        if (TEXT_WIDTH > FOURTH_COL_WIDTH_X) {
          const times = TEXT_WIDTH / FOURTH_COL_WIDTH_X
          incrementHeight(NORMAL_LINE_HEIGHT + (0.09 * Math.ceil(times)))
        } else {
          incrementHeight()
        }

        if (cursorLineHeight > HIGHEST_CURSOR_LINE_HEIGHT) {
          HIGHEST_CURSOR_LINE_HEIGHT = cursorLineHeight
        }

        cursorLineHeight = HIGHEST_CURSOR_LINE_HEIGHT

        return HIGHEST_CURSOR_LINE_HEIGHT
      }

      const handleAddInvoiceBreakdownTable = (INVOICE_RECORD: InvoiceRecord, HEIGHT_VACANT_FOR_BODY: number) => {

        const TABLE_START_Y = cursorLineHeight;
        const TABLE_END_Y = cursorLineHeight + HEIGHT_VACANT_FOR_BODY;

        const COLUMN_HEIGHT = 0.3

        const TABLE_PADDING = 0.075


        const FIRST_COL_START_X  = startLineX + TABLE_PADDING
        const FIRST_COL_WIDTH_X  = 3.25
        const FIRST_COL_END_X    = FIRST_COL_START_X + FIRST_COL_WIDTH_X + TABLE_PADDING

        const SECOND_COL_WIDTH_X = 0.5
        const SECOND_COL_START_X = FIRST_COL_END_X + (SECOND_COL_WIDTH_X / 2)
        const SECOND_COL_END_X   = FIRST_COL_END_X + SECOND_COL_WIDTH_X

        const remainingWidth = endLineX - SECOND_COL_END_X

        const THIRD_COL_START_X  = SECOND_COL_END_X
        const THIRD_COL_WIDTH_X  = remainingWidth / 3
        const THIRD_COL_END_X    = THIRD_COL_START_X + THIRD_COL_WIDTH_X

        const FOURTH_COL_START_X = THIRD_COL_END_X
        const FOURTH_COL_WIDTH_X = remainingWidth / 3
        const FOURTH_COL_END_X   = FOURTH_COL_START_X + FOURTH_COL_WIDTH_X

        const FIFTH_COL_START_X  = FOURTH_COL_END_X
        const FIFTH_COL_WIDTH_X  = endLineX - FIFTH_COL_START_X
        const FIFTH_COL_END_X    = FIFTH_COL_START_X + FIFTH_COL_WIDTH_X

        doc.rect(startLineX, TABLE_START_Y, contentWidth, HEIGHT_VACANT_FOR_BODY );

        // TABLE COLUMN HEADER
        incrementHeight()
        doc.line(startLineX, TABLE_START_Y + COLUMN_HEIGHT, endLineX, TABLE_START_Y + COLUMN_HEIGHT );

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold");

        doc.text("Item / Description", FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text("Qty", SECOND_COL_START_X, cursorLineHeight, { align: 'center' })
        doc.text("Unit Cost", THIRD_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        doc.text("VAT Amount", FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        doc.text("Amount", FIFTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })

        doc.line(FIRST_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, FIRST_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
        doc.line(SECOND_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, SECOND_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
        doc.line(THIRD_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, THIRD_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
        doc.line(FOURTH_COL_END_X , cursorLineHeight - NORMAL_LINE_HEIGHT, FOURTH_COL_END_X, cursorLineHeight - NORMAL_LINE_HEIGHT + COLUMN_HEIGHT )
        incrementHeight(LARGE_LINE_HEIGHT + TABLE_PADDING)

        // TABLE ROWS
        var TEXT_WIDTH = 0

        // MAX WITH FOOTER = 18 - 21
        // MAX WITHOUT FOOTER = 25 - 28

        INVOICE_RECORD.ITEM_BREAKDOWNS.forEach((item) => {
          doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
          doc.setFont("helvetica", "normal");
          doc.text(`${item.QTY || 0}`, SECOND_COL_START_X, cursorLineHeight, { align: 'center' })
          doc.text(item.UNTCST ? configStore.formatFloatNumber1(item.UNTCST) : '0.00', THIRD_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
          doc.text(item.VATAMT ? configStore.formatFloatNumber1(item.VATAMT) : '0.00', FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
          doc.text(item.AMTDUE ? configStore.formatFloatNumber1(item.AMTDUE) : '0.00', FIFTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
          doc.text(item.ITEM || '-', FIRST_COL_START_X, cursorLineHeight, { align: 'left', maxWidth: FIRST_COL_WIDTH_X })
          TEXT_WIDTH = doc.getTextWidth(item.ITEM || '-')
          if (TEXT_WIDTH > FIRST_COL_WIDTH_X) {
            const times = TEXT_WIDTH / FIRST_COL_WIDTH_X
            incrementHeight(NORMAL_LINE_HEIGHT + (NORMAL_LINE_HEIGHT * times) - TABLE_PADDING)
          } else {
            incrementHeight()
          }
        })


        // TOTAL BREAKDOWN

        const GAP = 0.25
        const FOUR_EQ_WIDTH = ( contentWidth - GAP ) / 4

        const BOTTOM_BREAKDOWN_HEIGHT = (NORMAL_LINE_HEIGHT * 5) + TABLE_PADDING
        const BOTTOM_BREAKDOWN_START_Y = TABLE_END_Y - BOTTOM_BREAKDOWN_HEIGHT

        const BRK_FIRST_COL_START_X  = startLineX + TABLE_PADDING
        const BRK_FIRST_COL_WIDTH_X  = FOUR_EQ_WIDTH - (TABLE_PADDING * 2)
        const BRK_FIRST_COL_END_X    = BRK_FIRST_COL_START_X + BRK_FIRST_COL_WIDTH_X  + TABLE_PADDING

        const BRK_SECOND_COL_START_X = BRK_FIRST_COL_END_X + TABLE_PADDING
        const BRK_SECOND_COL_WIDTH_X = 1.5 - (TABLE_PADDING * 2)
        const BRK_SECOND_COL_END_X   = BRK_SECOND_COL_START_X + BRK_SECOND_COL_WIDTH_X + TABLE_PADDING


        const BRK_THIRD_COL_START_X  = BRK_SECOND_COL_END_X + TABLE_PADDING + GAP
        const BRK_THIRD_COL_WIDTH_X  = 1.5 - (TABLE_PADDING * 2)
        const BRK_THIRD_COL_END_X    = BRK_THIRD_COL_START_X + BRK_THIRD_COL_WIDTH_X

        const BRK_FOURTH_COL_START_X = BRK_THIRD_COL_END_X + TABLE_PADDING
        const BRK_FOURTH_COL_WIDTH_X = (pageSizeX - BRK_THIRD_COL_END_X - marginLeft) - (TABLE_PADDING * 2)
        const BRK_FOURTH_COL_END_X   = BRK_FOURTH_COL_START_X + BRK_FOURTH_COL_WIDTH_X + TABLE_PADDING


        // FIRST COLUMN
        cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");

        incrementHeight()
        incrementHeight()
        doc.text("VATable Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("VAT Amount", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("VAT Exempt Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("Zero-Rated Sales", BRK_FIRST_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()

        // SECOND COLUMN
        cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold");

        incrementHeight()
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.VATSAL) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.VATEXM) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.ZERSAL) : '0.00', BRK_SECOND_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()

        // THIRD COLUMN
        cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal");

        doc.text("Total Sales", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("Less: VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("Amount: Net of VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("Add: VAT", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("Less: Withholding Tax", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        incrementHeight()
        doc.text("Total Amount Due", BRK_THIRD_COL_START_X, cursorLineHeight, { align: 'left' })
        doc.text("PHP", BRK_THIRD_COL_START_X + ((BRK_THIRD_COL_WIDTH_X + BRK_FOURTH_COL_WIDTH_X) / 2), cursorLineHeight, { align: 'center' })
        incrementHeight()

        // FOURTH COLUMN
        cursorLineHeight = BOTTOM_BREAKDOWN_START_Y

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold");

        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.TOTSAL ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.TOTSAL) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        doc.line(BRK_THIRD_COL_START_X, cursorLineHeight + 0.03, BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight + 0.03);
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.NETVAT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.VATAMT) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.PRDTAX) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        doc.line(BRK_THIRD_COL_START_X, cursorLineHeight + 0.03, BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight + 0.03);
        incrementHeight()
        doc.text(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE ? configStore.formatFloatNumber1(INVOICE_RECORD.TOTAL_BREAKDOWN.AMTDUE) : '0.00', BRK_FOURTH_COL_END_X - TABLE_PADDING, cursorLineHeight, { align: 'right' })
        incrementHeight()

      }

      const handleAddInvoiceFooter = (INVOICE_RECORD: InvoiceRecord) => {

        cursorLineHeight = pageSizeY - marginTop - FOOTER_HEIGHT

        const PADDING_X = 0.2
        const SIGNATURE_WIDTH = 1.8

        const SIGNATURE_START_X = endLineX - SIGNATURE_WIDTH - PADDING_X
        const SIGNATURE_END_X = endLineX - PADDING_X
        const SIGNATURE_CENTER_X = SIGNATURE_END_X - ( SIGNATURE_WIDTH / 2)

        doc.setFontSize(TITLE_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text(INVOICE_RECORD.DETAILS.AUTHSG || 'xxxxxxxx', SIGNATURE_CENTER_X, cursorLineHeight, { align: 'center' })
        incrementHeight(NORMAL_LINE_HEIGHT)

        doc.line(SIGNATURE_START_X, cursorLineHeight - SMALL_LINE_HEIGHT, SIGNATURE_END_X, cursorLineHeight - SMALL_LINE_HEIGHT)

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "bold")
        doc.text("Authorized Signature", SIGNATURE_CENTER_X, cursorLineHeight, { align: 'center' })
        incrementHeight(NORMAL_LINE_HEIGHT)

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.FOOTER.ACNUM || "Acknowledgement Certificate No. : xxxxxxxxxxxxxxx", startLineX, cursorLineHeight, { align: 'left' })
        incrementHeight(VERY_SMALL_LINE_HEIGHT)

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text(INVOICE_RECORD.FOOTER.ACDAT || "Date Issued : xxxx/xx/xx", startLineX, cursorLineHeight, { align: 'left' })
        incrementHeight(VERY_SMALL_LINE_HEIGHT)

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text("Series Range : " + INVOICE_RECORD.INVOICE_KEY.SERIES_RANGE, startLineX, cursorLineHeight, { align: 'left' })
        incrementHeight(VERY_SMALL_LINE_HEIGHT)

        doc.setFontSize(VERY_SMALL_TEXT_FONT_SIZE)
        doc.setFont("helvetica", "normal")
        doc.text("Timestamp : " + (INVOICE_RECORD.DETAILS.DATSTP ? configStore.formatDate2(INVOICE_RECORD.DETAILS.DATSTP) :  'xxxx/xx/xx' ) + '  ' +  (INVOICE_RECORD.DETAILS.TIMSTP ? configStore.formatTime2(INVOICE_RECORD.DETAILS.TIMSTP) :  'xx:xx:xx' ), startLineX, cursorLineHeight, { align: 'left' })
      }

      const pageFormat = 'letter'
      const pageOrientation = 'portrait'

      const doc = new jsPDF({
        orientation:  pageOrientation,
        unit:         "in",
        format:       pageFormat,         // Letter size (8.5 x 11 inches)
      });


      const pageSizeX = 8.5
      const pageSizeY = 11

      const marginLeft = 0.5;
      const marginTop = 0.75;
      const contentWidth = pageSizeX - (marginLeft * 2);    // Width of writable content area
      const contentHeight = pageSizeY - (marginTop * 2);    // Height of writable content area

      var cursorLineHeight = marginTop + NORMAL_LINE_HEIGHT

      const startLineX = marginLeft
      const endLineX = pageSizeX - marginLeft


      INVOICE_RECORDS.forEach((INVOICE_RECORD, index) => {

        doc.setFontSize(NORMAL_TEXT_FONT_SIZE)
        doc.setFont("helvetica");
        doc.setLineWidth(0.01);

        handleAddInvoiceHeader(INVOICE_RECORD)

        const CLIENT_DESC_HEIGHT = handleAddInvoiceClientDescription(INVOICE_RECORD)

        handleAddInvoiceBreakdownTable(INVOICE_RECORD, pageSizeY - ( CLIENT_DESC_HEIGHT + NORMAL_LINE_HEIGHT + 0.3 + NORMAL_LINE_HEIGHT + FOOTER_HEIGHT + marginTop ))

        handleAddInvoiceFooter(INVOICE_RECORD)

        if (index + 1 < INVOICE_RECORDS.length) {
          handleCreateNewPage()
        }
      })

      return doc
    }

    return generateDoc(INVOICE_RECORDS).output('blob')
  }

  const handleGenerateDraftInvoice = async (SELECTED_INVOICE_RECORD: InvoiceRecord, callback: Function) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const currentDate = new Date()
    const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
    const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

    const PDF_BLOB = handleGenerateInvoicePDFBlob([{
      ...SELECTED_INVOICE_RECORD,
      DETAILS: {
        ...SELECTED_INVOICE_RECORD.DETAILS,

        DATSTP: stampDate,
        TIMSTP: stampTime,

        RUNDAT: stampDate,
        RUNTME: stampTime,
      }
    }])

    callback()

    const Footer = defineAsyncComponent(() => import('../components/Dialog/General/DraftInvoiceModalFooter.vue'));
    const ShowDraftInvoice = dialog.open(PreviewPDFModal, {
      data: {
        pdfBlob: PDF_BLOB,
        download: () => {
          const url = URL.createObjectURL(PDF_BLOB);
          const a = document.createElement('a');
          a.href = url;
          a.download = '(DRAFT) Invoice.pdf';
          a.click();
          URL.revokeObjectURL(url);
        },
        submit: () => {
        },
        cancel: () => {
          ShowDraftInvoice.close()
        }
      },
      props: {
        header: 'Preview Draft Invoice',
        style: {
          width: '75vw'
        },
        showHeader: true,
        modal: true,
      },
      templates: {
        footer: markRaw(Footer)
      },
    })
  }

  const handleGenerateDraftInvoices = async (SELECTED_INVOICE_RECORDS: InvoiceRecord[], invoiceDate: Date, callback: Function) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const data = {
      year: invoiceDate.getFullYear(),
      month: invoiceDate.getMonth() + 1,
    }

    const PDF_BLOB = handleGenerateInvoicePDFBlob([
      ...SELECTED_INVOICE_RECORDS.map((INVOICE) => {

        const currentDate = new Date()
        const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
        const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

        return {
          ...INVOICE,
          DETAILS: {
            ...INVOICE.DETAILS,

            DATSTP: stampDate,
            TIMSTP: stampTime,

            RUNDAT: stampDate,
            RUNTME: stampTime,
          }
        }
      })
    ])

    callback()

    const Footer = defineAsyncComponent(() => import('../components/Dialog/General/DraftInvoiceModalFooter.vue'));
    const ShowDraftInvoices = dialog.open(PreviewPDFModal, {
      data: {
        pdfBlob: PDF_BLOB,
        download: () => {
          const url = URL.createObjectURL(PDF_BLOB);
          const a = document.createElement('a');
          a.href = url;
          a.download = `(DRAFTS) Invoice ${data.year}-${data.month}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
        submit: () => {
        },
        cancel: () => {
          ShowDraftInvoices.close()
        }
      },
      props: {
        header: 'Preview Draft Invoices',
        style: {
          width: '75vw'
        },
        showHeader: true,
        modal: true,
      },
      templates: {
        footer: markRaw(Footer)
      },
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

      // Per Batch
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

      // Per Batch
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
    .then(async (response) => {
      await callback(response)
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
    getNOMOS,

    processBillings,
    processInvoiceRecords,

    handleGenerateInvoicePDFBlob,
    handleGenerateDraftInvoice,
    handleGenerateDraftInvoices,

    handleExecuteSearch,
    handleExecuteReset,

    handleExecuteIssueFinalInvoices,
  }
})