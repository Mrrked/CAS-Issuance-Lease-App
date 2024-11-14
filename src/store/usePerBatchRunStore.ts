import { COMPANIES, COMPANY_DETAILS } from '../components/Dialog/PerMonthYear/data';
import { Column, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import DraftInvoiceModal from '../components/Dialog/PerMonthYear/DraftInvoiceModal.vue';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import SelectedBillsTableModal from '../components/Dialog/PerMonthYear/SelectedBillsTableModal.vue';
import SummaryOfIssuanceModal from '../components/Dialog/PerMonthYear/SummaryOfIssuanceModal.vue';
import { defineStore } from 'pinia';
import html2pdf from 'html2pdf.js';
import { useConfigStore } from './useConfigStore';
import { useConfirm } from 'primevue/useconfirm';
import { useCoreDataStore } from './useCoreDataStore';
import { useDialog } from 'primevue/usedialog';
import { useMainStore } from './useMainStore';

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore()
  const configStore = useConfigStore()
  const coreDataStore = useCoreDataStore()

  const perBatchRunForm = ref<PerBatchRunForm>({
    invoiceDate: new Date()
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return billings.value.map((bill, index) => {
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
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {

    const mergedMap: { [key: string]: InvoiceRecord } = {};

    billings_data.value.forEach((bill) => {
      const key = bill.ID;

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
              RECTYP:         "VI",
              ORNUM:          "xxxxxxxxxxxxx",

              // TRACKING
              ITEMNO:         mergedMap[key].ITEM_BREAKDOWNS.length + 1,
              BILTYP:         bill.OLD_BILL_TYPE,
              ITEM:           bill.BDESC + " (September 1 - 30, 2001) VATable",
              QTY:            1,

              // VALUES
              UNTCST:         bill.UNIT_COST,
              VATAMT:         bill.VAT,
              VATSAL:         bill.VAT_SALES,
              VATEXM:         bill.VAT_EXEMPT,
              ZERSAL:         bill.ZERO_RATE,
              NETVAT:         bill.UNIT_COST,
              WTHTAX:         bill.WITHHOLDING_TAX,
              GOVTAX:         bill.GOVT_TAX,
              WTXRAT:         bill.WHTAX_RATE,
              AMTDUE:         bill.TOTAL_AMOUNT,

              // PERIOD
              FRDATE:         0,
              TODATE:         0,
              DUEDAT:         0
            }
          ],

          TOTAL_BREAKDOWN: {
            ...mergedMap[key].TOTAL_BREAKDOWN,
            // KEY
            RECTYP: "VI",
            ORNUM:  "xxxxxxxxxxxxx",

            BILTYP: 0,

            // VALUES
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
      } else {
        const selectedProject = coreDataStore.project_codes.find((code) => code.PROJCD === bill.PROJCD)
        const selectedCompany = COMPANIES.find((c) => c.COMPCD === bill.COMPCD) as COMPANY_DETAILS

        mergedMap[key] = {
          PBL_KEY:          bill.PBL_KEY,
          TCLTNO:           bill.TCLTNO,
          CLIENT_KEY_RAW:   bill.CLIENT_KEY_RAW,
          COMPCD:           bill.COMPCD,

          BILLINGS:         [ bill ],

          // COMPUTED
          HEADER: {
            COMPANY_NAME:   selectedCompany?.CONAME,
            ADDRESS:        selectedCompany?.ADDRESS,
            LOGO_URL:       selectedCompany?.IMG_URL,

            INVOICE_NAME:   'SERVICE INVOICE',
            INVOICE_NUMBER: 'VIxxxxxxxxxxxxx',
            INVOICE_DATE:   'xxxx/xx/xx',
          },

          // CIRCLTPF
          DETAILS: {
            // KEY
            RECTYP:         'VI',
            ORNUM:          'xxxxxxxxxxxxx',

            PAYTYP:         'Y',
            PIBIG:          '',
            SLSTYP:         'V',
            DATVAL:         20231114,

            // COMPANY INFO
            COMPCD:         bill.COMPCD,
            TELNO:          selectedCompany?.TEL_NO,
            REGTIN:         selectedCompany?.TIN,

            // CLIENT INFO
            CLTNME:         bill.CLIENT_NAME,
            RADDR1:         bill.CLIENT_ADDRESS, //
            RADDR2:         bill.CLIENT_ADDRESS, //
            CLTTIN:         bill.CLIENT_TIN,
            CLTKEY:         bill.CLIENT_KEY,
            PRJNAM:         selectedProject ? selectedProject.PTITLE : '-',
            UNIT:           bill.CLIENT_UNIT,

            // FOOTER
            DATSTP:         0,
            TIMSTP:         0,
            AUTHSG:         'xxxxxxxx',

            // TRACKING
            STATUS:         '',
            RUNDAT:         0,
            RUNTME:         0,
            RUNBY:          'xxxxxxxx',

            RPDATE:         0,
            RPTIME:         0,
            REPRBY:         '',

            SERIES_RANGE:   '',
          },
          // CIRBRKPF
          ITEM_BREAKDOWNS: [
            {
              // KEY
              RECTYP:         "VI",
              ORNUM:          "xxxxxxxxxxxxx",

              // TRACKING
              ITEMNO:         1,
              BILTYP:         bill.OLD_BILL_TYPE,
              ITEM:           bill.BDESC + " (September 1 - 30, 2001) VATable",
              QTY:            1,

              // VALUES
              UNTCST:         bill.UNIT_COST,
              VATAMT:         bill.VAT,
              VATSAL:         bill.VAT_SALES,
              VATEXM:         bill.VAT_EXEMPT,
              ZERSAL:         bill.ZERO_RATE,
              NETVAT:         bill.UNIT_COST,
              WTHTAX:         bill.WITHHOLDING_TAX,
              GOVTAX:         bill.GOVT_TAX,
              WTXRAT:         bill.WHTAX_RATE,
              AMTDUE:         bill.TOTAL_AMOUNT,

              // PERIOD
              FRDATE:         0,
              TODATE:         0,
              DUEDAT:         0
            }
          ],
          // CIRVATPF
          TOTAL_BREAKDOWN: {
            // KEY
            RECTYP: "VI",
            ORNUM:  "xxxxxxxxxxxxx",

            BILTYP: 0,

            // VALUES
            VATSAL: bill.VAT_SALES,
            VATEXM: bill.VAT_EXEMPT,
            ZERSAL: bill.ZERO_RATE,
            GOVTAX: bill.GOVT_TAX,

            TOTSAL: bill.AMOUNT,
            NETVAT: bill.UNIT_COST,
            VATAMT: bill.VAT,
            PRDTAX: bill.WITHHOLDING_TAX,
            AMTDUE: bill.TOTAL_AMOUNT,
          }
        }
      }

    })

    return [...Object.values(mergedMap)] as InvoiceRecord[]
  })

  const invoice_records_column = computed((): Column[] => {
    return [
      { field: 'PBL_KEY',  header: 'Project/Block/Lot' },
      { field: 'TCLTNO',  header: 'Temp. Client #' },
      { field: 'DESC.CLTNME',  header: 'Client Name' },
      // { field: 'BILL_TYPE', header: 'Bill Type' },
      // { field: 'DATDUE', header: 'Due Date'},
      // { field: 'PERIOD', header: 'Billing Period' },
      // { field: 'BILAMT',  header: 'Billing Amount' },
      // { field: 'BALAMT', header: 'Amount Due' },
      // { field: 'VAT_SALES', header: 'VAT Sales' },
      // { field: 'ZERO_RATE', header: 'Zero-Rated' },
      // { field: 'VAT_EXEMPT', header: 'VAT Exempt' },
      // { field: 'VAT', header: 'VAT' },
      // { field: 'GOVT_TAX', header: 'Govt. Tax' },
      { field: 'TOTAL_BREAKDOWN.TOTSAL', header: 'Total Sales' },
      { field: 'TOTAL_BREAKDOWN.PRDTAX', header: 'Withholding Tax' },
      { field: 'TOTAL_BREAKDOWN.AMTDUE', header: 'Total Amount Due' },
    ]
  })


  const handleOpenMainDialogBox = () => {
    console.log('INVOICE RECORDS', invoice_records_data.value);
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SelectedBillsTableModalFooter.vue'));
    const PerMonthYearDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        table_column: invoice_records_column.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
          handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD)
        },
        submit: () => {
          confirm.require({
            message: `The ${invoice_records_data.value.length} invoices will be final once issued.\n Are you sure you want to continue in generating the invoices?`,
            header: 'Confirm Issuance of Invoice (FINAL) ?',
            icon: 'pi pi-exclamation-triangle',
            rejectProps: {
              label: 'Cancel',
              severity: 'secondary',
              outlined: true
            },
            acceptProps: {
              label: 'Confirm'
            },
            accept: () => {
              handleExecuteIssueFinalInvoices()
            },
            reject: () => {
            }
          });
        },
        cancel: () => {
          PerMonthYearDialog.close()
        }
      },
      props: {
        header: 'For Issuance of Invoice (Per Batch)' ,
        style: {
          width: '75vw'
        },
        showHeader: true,
        maximizable: true,
        modal: true,
      },
      templates: {
        footer: markRaw(Footer)
      },
      onClose: () => {
        billings.value = []
      }
    })
  }

  const handleGenerateDraftInvoice = async (SELECTED_INVOICE_RECORD: InvoiceRecord) => {

    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/DraftInvoiceModalFooter.vue'));
    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: 'Generating Draft...'
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      },
    })

    const PAGE = handleGeneratePage(SELECTED_INVOICE_RECORD)

    const CONFIGURATION = {
      margin: 0,
      filename: 'DRAFT - ' + 'Service Invoice' + ' Single',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const PDF_BLOB = await html2pdf()
      .set(CONFIGURATION)
      .from(PAGE)
      .output('blob')

    loadingDialogRef.close()

    const ShowDraftInvoice = dialog.open(DraftInvoiceModal, {
      data: {
        pdfBlob: PDF_BLOB,
        download: () => {
          const url = URL.createObjectURL(PDF_BLOB);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'DRAFT - ' + 'Service Invoice' + ' Single.pdf';
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

  const handleExecuteIssueFinalInvoices = async () => {

    const SELECTED_INVOICES = invoice_records_data.value

    console.log('SELECTED_INVOICES FOR FINAL ISSUANCE', SELECTED_INVOICES)

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${SELECTED_INVOICES.length} Drafts...`
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
      type: 'BATCH',
      invoices: SELECTED_INVOICES,
    }

    const callback = (response: AxiosResponse) => {
      console.log('RESPONSE', response.data);

      // GENERATE PDF for Summary of Issuance then show it in a dialog

      const PDF_BLOB = null

      const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SummaryOfIssuanceModalFooter.vue'));
      const ShowSummaryOfIssuedInvoices = dialog.open(SummaryOfIssuanceModal, {
        data: {
          pdfBlob: PDF_BLOB,
          download: () => {
            // const url = URL.createObjectURL(PDF_BLOB);
            // const a = document.createElement('a');
            // a.href = url;
            // a.download = 'Summary of Issued Invoices.pdf';
            // a.click();
            // URL.revokeObjectURL(url);
          },
          submit: () => {
          },
          cancel: () => {
            ShowSummaryOfIssuedInvoices.close()
          }
        },
        props: {
          header: 'Summary of Issued Invoices',
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

    mainStore.handleExecuteIssueFinalInvoices(data, callback, () => loadingDialogRef.close())
  }

  const handleGeneratePage = (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
    console.log('GEN. DRAFT FOR SELECTED INVOICE', SELECTED_INVOICE_RECORD)

    const CONTENT_VALUES: InvoiceRecord = SELECTED_INVOICE_RECORD

    var TABLE_ITEMS_COMPONENT = ``

    CONTENT_VALUES.ITEM_BREAKDOWNS.forEach((item) => {
      TABLE_ITEMS_COMPONENT += `
        <div class="grid grid-cols-16">
          <div class="col-span-9 px-1 text-wrap">
            ${ item.ITEM || '-' }
          </div>
          <div class="col-span-1 px-1 text-center text-wrap">
            ${ item.QTY || '0' }
          </div>
          <div class="col-span-2 px-1 text-right text-wrap">
            ${ item.UNTCST ? configStore.formatFloatNumber1(item.UNTCST) : '0.00' }
          </div>
          <div class="col-span-2 px-1 text-right text-wrap">
            ${ item.VATAMT ? configStore.formatFloatNumber1(item.VATAMT) : '0.00' }
          </div>
          <div class="col-span-2 px-1 text-right text-wrap ">
            ${ item.AMTDUE ? configStore.formatFloatNumber1(item.AMTDUE) : '0.00' }
          </div>
        </div>
      `
    })

    const PAGE = `
      <div class="
          min-w-[816px] h-[1056px] min-h-[1056px] max-w-[1056px] p-[72px] gap-[12px] text-12 font-helvetica
          flex flex-col text-black bg-white
        "
      >
        <!-- HEADER -->
        <div class="grid grid-cols-8 -mt-4 min-h-24 max-h-24">
          <!-- LEFT -->
          <div class="flex items-center h-full col-span-5">
            <div class="flex items-center justify-center h-full resize-none shrink-0 w-fit">
              <img src="${ CONTENT_VALUES.HEADER.LOGO_URL }" alt="logo" class="w-20">
            </div>
            <div class="flex flex-col items-start justify-center flex-1 h-full gap-1 pl-4 -mt-4 resize-none shrink-0">
              <div class="font-semibold text-16 tracking-tighter">
                ${ CONTENT_VALUES.HEADER.COMPANY_NAME }
              </div>
              <div class="flex flex-col tracking-tighter text-10">
                <div class="text-wrap">
                  ${ CONTENT_VALUES.HEADER.ADDRESS }
                </div>
                <div>
                  TEL. NO. ${ CONTENT_VALUES.DETAILS.TELNO }
                </div>
                <div>
                  VAT REG TIN: ${ CONTENT_VALUES.DETAILS.REGTIN }
                </div>
              </div>
            </div>
          </div>
          <!-- RIGHT -->
          <div class="flex flex-col items-end justify-center h-full col-span-3 -mt-2">
            <div class="font-semibold text-20 -mt-[12px]">
              ${ CONTENT_VALUES.HEADER.INVOICE_NAME }
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                No.
              </div>
              <div>
                ${ CONTENT_VALUES.HEADER.INVOICE_NUMBER }
              </div>
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                Date :
              </div>
              <div>
                ${ CONTENT_VALUES.HEADER.INVOICE_DATE }
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div class="grid grid-cols-7 gap-10 mt-1">
          <div class="flex flex-col col-span-4 shrink-0">
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                SOLD TO
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DETAILS.CLTNME }
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                ADDRESS
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DETAILS.RADDR1 }${ CONTENT_VALUES.DETAILS.RADDR2 }
              </div>
            </div>
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                TIN
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DETAILS.CLTTIN }
              </div>
            </div>
          </div>
          <div class="flex flex-col col-span-3 shrink-0">
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                CLIENT KEY
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DETAILS.CLTKEY }
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                PROJECT
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DETAILS.PRJNAM }
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                UNIT
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DETAILS.UNIT }
              </div>
            </div>
          </div>
        </div>

        <!-- TABLE -->
        <div class="flex flex-col h-full mt-2">
          <!-- THEAD -->
          <div class="grid grid-cols-16 font-bold border border-black" style="line-height: 11px;">
            <div class="col-span-9 px-1 pb-3 border-r border-black -pt-4 text-wrap">
              Item / Description
            </div>
            <div class="col-span-1 px-1 pb-3 text-center border-r border-black -pt-4 text-wrap">
              Qty
            </div>
            <div class="col-span-2 px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Unit Cost
            </div>
            <div class="col-span-2 px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VAT Amount
            </div>
            <div class="col-span-2 px-1 pb-3 text-right -pt-4 text-wrap">
              Amount
            </div>
          </div>
          <!-- TBODY -->
          <div class="flex flex-col justify-between flex-1 border-b border-black border-x">
            <!-- ROWS -->
            <div class="flex flex-col">
              ${ TABLE_ITEMS_COMPONENT }
            </div>

            <!-- BOTTOM -->
            <div class="flex flex-col gap-1">

              <!-- 1 -->
              <div class="grid items-end grid-cols-2 gap-8 px-2 pb-3 tracking-normal">

                <!-- COL 1 -->
                <div class="flex flex-col">

                  <!-- BREAKDOWN -->
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      VATable Sales
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.VATSAL ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.VATSAL) : '0.00' }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      VAT Amount
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.VATAMT ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.VATAMT) : '0.00' }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      VAT Exempt Sales
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.VATEXM ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.VATEXM) : '0.00' }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Zero-Rated Sales
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.ZERSAL ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.ZERSAL) : '0.00' }
                    </div>
                  </div>
                </div>

                <!-- COL 2 -->
                <div class="flex flex-col">

                  <div class="grid grid-cols-2 mt-5">
                    <div class="text-left">
                      Total Sales
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.TOTSAL ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.TOTSAL) : '0.00' }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Less: VAT
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.VATAMT ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.VATAMT) : '0.00' }
                    </div>
                  </div>
                  <div class="mt-2 border-t border-black"></div>

                  <div class="grid grid-cols-2 -mt-2">
                    <div class="text-left">
                      Amount: Net of VAT
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.NETVAT ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.NETVAT) : '0.00' }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Add: VAT
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.VATAMT ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.VATAMT) : '0.00' }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Less: Withholding Tax
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.PRDTAX ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.PRDTAX) : '0.00' }
                    </div>
                  </div>
                  <div class="mt-2 border-t border-black"></div>

                  <div class="grid grid-cols-5 -mt-2">
                    <div class="col-span-2 text-left">
                      Total Amount Due
                    </div>
                    <div class="text-right">
                      PHP
                    </div>
                    <div class="col-span-2 text-right font-bold">
                      ${ CONTENT_VALUES.TOTAL_BREAKDOWN.AMTDUE ? configStore.formatFloatNumber1(CONTENT_VALUES.TOTAL_BREAKDOWN.AMTDUE) : '0.00' }
                    </div>
                  </div>
                </div>
              </div>

              <!-- MODE OF PAYMENT -->
              <!-- <div class="flex flex-col pb-3 tracking-normal">
                <div class="border-y border-black w-full px-2 pb-3 font-bold">
                  MODE OF PAYMENT
                </div>
                <div class="h-32">

                </div>
              </div> -->
            </div>

          </div>
        </div>

        <div class="flex justify-end mt-[15px] -mb-[30px]">
          <div class="flex flex-col w-36 font-bold">
            <div class="text-center">
              ${ CONTENT_VALUES.DETAILS.AUTHSG }
            </div>
            <div class="mt-2 border-t border-black"></div>
            <div class="text-center -mt-2">
              Authorized Signature
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex flex-col tracking-normal">
          <div>
            Acknowledgement Certificate No. : ${ CONTENT_VALUES.DETAILS.RECTYP }${ CONTENT_VALUES.DETAILS.ORNUM }
          </div>
          <div>
            Date Issued : ${ CONTENT_VALUES.DETAILS.DATVAL }
          </div>
          <div>
            Series Range : ${ CONTENT_VALUES.DETAILS.SERIES_RANGE }
          </div>
          <div>
            Timestamp : ${ CONTENT_VALUES.DETAILS.DATSTP } ${ CONTENT_VALUES.DETAILS.TIMSTP }
          </div>
        </div>
      </div>
    `

    return PAGE
  }


  return {
    perBatchRunForm,
    billings,

    invoice_records_data,

    handleOpenMainDialogBox,
  }
})