import { COMPANIES, COMPANY_DETAILS } from '../components/Dialog/PerMonthYear/data';
import { Column, InvoiceDateForm, InvoiceRecord, LeaseBill } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import DraftInvoiceModal from '../components/Dialog/PerMonthYear/DraftInvoiceModal.vue';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import SelectedBillsTableModal from '../components/Dialog/PerMonthYear/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import html2pdf from 'html2pdf.js';
import { useConfigStore } from './useConfigStore';
import { useConfirm } from 'primevue/useconfirm';
import { useCoreDataStore } from './useCoreDataStore';
import { useDialog } from 'primevue/usedialog';

export const usePerYearMonthStore = defineStore('2_PerYearMonth', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const configStore = useConfigStore()
  const coreDataStore = useCoreDataStore()

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const invoiceDateForm = ref<InvoiceDateForm>({
    year: {
      value: currentYear,
      name: String(currentYear)
    },
    month: {
      value: currentMonth,
      name: `${String(currentMonth + 1).padStart(2, '0')} - ${new Date(0, currentMonth).toLocaleString('default', { month: 'long' })}`
    }
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

          TABLE_ITEMS: [
            ...mergedMap[key].TABLE_ITEMS,
            {
              item_name:      'string',
              qty:            1,
              unit_cost:      'string',
              vat_amount:     'string',
              amount:         'string',
            }
          ],
          // MODE_OF_PAYMENT: {
          //   check: {
          //     list: []
          //   },
          // },
        }
      } else {
        const selectedProject = coreDataStore.project_codes.find((code) => code.PROJCD === bill.PROJCD)
        const selectedCompany = COMPANIES.find((c) => c.COMPCD === bill.COMPCD) as COMPANY_DETAILS

        mergedMap[key] = {
          PBL_KEY:          bill.PBL_KEY,
          TCLTNO:           bill.TCLTNO,
          CLIENT_KEY_RAW:   bill.CLIENT_KEY_RAW,
          COMPCD:           bill.COMPCD,

          BILLINGS:         [],

          HEADER: {
            img_url:        selectedCompany?.IMG_URL,
            company_name:   selectedCompany?.CONAME,
            address:        selectedCompany?.ADDRESS,
            tel_no:         selectedCompany?.TEL_NO,
            tin:            selectedCompany?.TIN,

            invoice_name:   'SERVICE INVOICE',
            invoice_number: 'VI01133xxxxxxxx',
            invoice_date:   'xxxx/xx/xx',
          },

          DESC: {
            client_name:    bill.CLIENT_NAME,
            address:        bill.CLIENT_ADDRESS,
            tin:            bill.CLIENT_TIN,
            client_key:     bill.CLIENT_KEY,
            project:        selectedProject ? selectedProject.PTITLE : '-',
            unit:           bill.CLIENT_UNIT,
          },

          TABLE_ITEMS:      [],

          MODE_OF_PAYMENT: {
            cash:           '0.00',
            check: {
              amount:       '',
              list:         [],
            },
            total_amount:   '0.00',
          },

          BREAKDOWN: {
            vatable_sales:    '0.00',
            vat_amount:       '0.00',
            vat_exempt_sales: '0.00',
            zero_rated_sales: '0.00',

            total_sales:      '0.00',
            net_of_vat:       '0.00',
            wht_tax:          '0.00',
            total_amount_due: '0.00',
          },

          SIGNATORY: {
            user_id:        'xxxxxxxx'
          },

          FOOTER: {
            certificate_no: 'xxxxxxxxxxxx',
            date_issued:    'xxxx/xx/xx',
            series_range:   'VI01133xxxxxxxx - VI01133xxxxxxxx',
            timestamp:      'xx/xx/xxxx xx:xx:xx'
          }
        }
      }

    })

    console.log('INVOICE RECORDS', mergedMap);

    return [...Object.values(mergedMap)] as InvoiceRecord[]
  })

  const invoice_records_column = computed((): Column[] => {
    return [
      { field: 'PBL_KEY',  header: 'Project/Block/Lot' },
      { field: 'TCLTNO',  header: 'Temp. Client #' },
      { field: 'DESC.client_name',  header: 'Client Name' },
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
      { field: 'BREAKDOWN.total_sales', header: 'Total Sales' },
      { field: 'BREAKDOWN.wht_tax', header: 'Withholding Tax' },
      { field: 'BREAKDOWN.total_amount_due', header: 'Total Amount Due' },
    ]
  })


  const handleOpenMainDialogBox = () => {
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SelectedBillsTableModalFooter.vue'));
    const PerMonthYearDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        table_column: invoice_records_column.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
          handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD)
        },
        view1: () => {
          confirm.require({
            message: 'Are you sure you want to print draft invoices?',
            header: 'Confirm Print Invoices (DRAFT) ? ',
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
              handleExecutePrintDraftInvoices()
            },
            reject: () => {
            }
          });
        },
        submit: () => {
          confirm.require({
            message: 'Are you sure you want to issue invoice?',
            header: 'Confirm Issuance of Invoice (FINAL) ? ',
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
              handleExecutePrintFinalInvoices()
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
        header: 'For Issuance of Invoice' ,
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

  const handleExecutePrintDraftInvoices = async () => {
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/DraftInvoiceModalFooter.vue'));

    const SELECTED_INVOICES_1D = invoice_records_data.value

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${SELECTED_INVOICES_1D.length} Drafts...`
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      }
    })

    const chunkArray = (array: InvoiceRecord[], chunkSize: number): InvoiceRecord[][] => {
      const result: InvoiceRecord[][] = [];

      for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
      }

      return result;
    }

    const SELECTED_INVOICES_2D: InvoiceRecord[][] = chunkArray(SELECTED_INVOICES_1D, 20)

    // console.log('SELECTED_BILLINGS_2D ', SELECTED_BILLINGS_2D);

    // const selectedCompany = COMPANIES.find((c) => c.COMPCD === 1) as COMPANY_DETAILS
    // const PAGE = `
    //   <div class="
    //       min-w-[816px] h-[1056px] min-h-[1056px] max-w-[1056px] p-[36px] gap-[12px] text-12 font-helvetica
    //       flex flex-col text-black bg-white
    //     "
    //   >
    //     <!-- HEADER -->
    //     <div class="grid grid-cols-7 -mt-4 min-h-24 max-h-24">
    //       <!-- LEFT -->
    //       <div class="flex items-center h-full col-span-5">
    //         <div class="flex items-center justify-center h-full resize-none shrink-0 w-fit">
    //           <img src="${selectedCompany.IMG_URL}" alt="logo" class="w-20">
    //         </div>
    //         <div class="flex flex-col items-start justify-center flex-1 h-full gap-1 pl-4 -mt-4 resize-none shrink-0">
    //           <div class="font-semibold text-16">
    //             ${ selectedCompany.CONAME }
    //           </div>
    //           <div class="flex flex-col tracking-tighter text-10">
    //             <div class="text-wrap">
    //               ${ selectedCompany.ADDRESS }
    //             </div>
    //             <div>
    //               TEL. NO. ${ selectedCompany.TEL_NO }
    //             </div>
    //             <div>
    //               VAT REG TIN: ${ selectedCompany.TIN }
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //       <!-- RIGHT -->
    //       <div class="flex flex-col items-end justify-center h-full col-span-2 -mt-2">
    //         <div class="font-semibold text-20 -mt-[12px]">
    //           SERVICE INVOICE
    //         </div>
    //         <div class="flex gap-3 font-semibold text-14">
    //           <div>
    //             No.
    //           </div>
    //           <div>
    //             VI011331A000001
    //           </div>
    //         </div>
    //         <div class="flex gap-3 font-semibold text-14">
    //           <div>
    //             Date :
    //           </div>
    //           <div>
    //             2021/12/01
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     <!-- DESCRIPTION -->
    //     <div class="grid items-end grid-cols-7 gap-10 mt-1">
    //       <div class="flex flex-col col-span-4 shrink-0">
    //         <div class="flex items-end gap-3">
    //           <div class="w-24 font-semibold">
    //             SOLD TO
    //           </div>
    //           <div>
    //             :
    //           </div>
    //           <div>
    //             Juan Antonio D. Perez
    //           </div>
    //         </div>
    //         <div class="flex items-start gap-3">
    //           <div class="w-24 font-semibold shrink-0">
    //             ADDRESS
    //           </div>
    //           <div>
    //             :
    //           </div>
    //           <div class="flex flex-col w-full">
    //             <div>
    //               123 Mabini Street, Barangay Poblacion,
    //             </div>
    //             <div>
    //               Makati City, Metro Manila, Philippines
    //             </div>
    //           </div>
    //         </div>
    //         <div class="flex items-end gap-3">
    //           <div class="w-24 font-semibold">
    //             TIN
    //           </div>
    //           <div>
    //             :
    //           </div>
    //           <div>
    //             123-456-789-000
    //           </div>
    //         </div>
    //       </div>
    //       <div class="flex flex-col col-span-3 shrink-0">
    //         <div class="flex items-end gap-3">
    //           <div class="w-24 font-semibold">
    //             CLIENT KEY
    //           </div>
    //           <div>
    //             :
    //           </div>
    //           <div>
    //             CL310271 00
    //           </div>
    //         </div>
    //         <div class="flex items-end gap-3">
    //           <div class="w-24 font-semibold">
    //             PROJECT
    //           </div>
    //           <div>
    //             :
    //           </div>
    //           <div>
    //             CITYNET CENTRAL
    //           </div>
    //         </div>
    //         <div class="flex items-end gap-3">
    //           <div class="w-24 font-semibold">
    //             UNIT
    //           </div>
    //           <div>
    //             :
    //           </div>
    //           <div class=""> L 0000</div>
    //         </div>
    //       </div>
    //     </div>

    //     <!-- TABLE -->
    //     <div class="flex flex-col h-full mt-2 tracking-tighter text-10">
    //       <!-- THEAD -->
    //       <div class="grid grid-cols-11 font-bold border border-black" style="line-height: 11px;">
    //         <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
    //           <div class="col-span-5 px-1 pb-3 border-r border-black -pt-4 text-wrap">
    //             Item / Description
    //           </div>
    //           <div class="px-1 pb-3 text-center border-r border-black -pt-4 text-wrap">
    //             Qty
    //           </div>
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           Unit Cost
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           VATable Sales
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           VAT Exempt Sales
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           Zero Rated Sales
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           VAT
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           Government Taxes
    //         </div>
    //         <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
    //           Withholding Tax
    //         </div>
    //         <div class="px-1 pb-3 text-right -pt-4 text-wrap">
    //           Amount Due
    //         </div>
    //       </div>
    //       <!-- TBODY -->
    //       <div class="flex flex-col justify-between flex-1 pb-3 border-b border-black border-x">
    //         <!-- ROWS -->
    //         <div class="flex flex-col">
    //           <div class="grid grid-cols-11">
    //             <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
    //               <div class="col-span-5 px-1 text-wrap">
    //                 Pen. on Rental for September 1 - 30, 2021
    //               </div>
    //               <div class="px-1 text-center text-wrap">
    //                 1
    //               </div>
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               1,619.09
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               1,445.62
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               173.47
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               (28.91)
    //             </div>
    //             <div class="px-1 text-right text-wrap ">
    //               1,590.18
    //             </div>
    //           </div>
    //           <div class="grid grid-cols-11">
    //             <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
    //               <div class="col-span-5 px-1 text-wrap">
    //                 Cusa for November 1 - 30, 2021
    //               </div>
    //               <div class="px-1 text-center text-wrap">
    //                 1
    //               </div>
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               259,485.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               259,485.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               (5,189.70)
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               254.295.30
    //             </div>
    //           </div>
    //           <div class="grid grid-cols-11">
    //             <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
    //               <div class="col-span-5 px-1 text-wrap">
    //                 Pen. on Cusa for September 1 - 30, 2021
    //               </div>
    //               <div class="px-1 text-center text-wrap">
    //                 1
    //               </div>
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               345.98
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               308.91
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               37.07
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               0.00
    //             </div>
    //             <div class="px-1 text-right text-wrap">
    //               (6.18)
    //             </div>
    //             <div class="px-1 text-right text-wrap ">
    //               339.80
    //             </div>
    //           </div>
    //           <pre> </pre>
    //         </div>

    //         <!-- BREAKDOWN -->
    //         <div class="grid items-end grid-cols-2 gap-16 px-2 tracking-normal text-12">
    //           <!-- COL 1 -->
    //           <div class="flex flex-col">
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 VATable Sales
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 1,754.53
    //               </div>
    //             </div>
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 VAT Amount
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 210.54
    //               </div>
    //             </div>
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 VAT Exempt Sales
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 0.00
    //               </div>
    //             </div>
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 Zero-Rated Sales
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 259,485.00
    //               </div>
    //             </div>
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 Government Taxes
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 0.00
    //               </div>
    //             </div>
    //           </div>
    //           <!-- COL 2 -->
    //           <div class="flex flex-col">
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 Total Sales
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 261,239.53
    //               </div>
    //             </div>
    //             <div class="grid grid-cols-3">
    //               <div class="col-span-1 font-bold text-left">
    //                 Add: VAT
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 210.54
    //               </div>
    //             </div>
    //             <div class="grid grid-cols-5">
    //               <div class="col-span-2 font-bold text-left">
    //                 Less: Withholding Tax
    //               </div>
    //               <div class="col-span-3 text-right">
    //                 5,224.79
    //               </div>
    //             </div>
    //             <div class="mt-2 border-t border-black"></div>
    //             <div class="grid grid-cols-3 -mt-1">
    //               <div class="col-span-1 font-bold text-left">
    //                 Total Amount Due
    //               </div>
    //               <div class="col-span-2 text-right">
    //                 256,225.28
    //               </div>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     <!-- GENERATE LABEL -->
    //     <div class="flex flex-col mt-[100px] mb-[20px] ">
    //       <div v-if="withBankCharges" class="w-full pb-2">
    //         * Bank charges are to be remitted to the Bank.
    //       </div>
    //       <div class="italic text-center border-t border-black">
    //         This document is computer generated, no signature required.
    //       </div>
    //     </div>

    //     <!-- FOOTER -->
    //     <div class="flex flex-col tracking-normal">
    //       <div>
    //         Acknowledgement Certificate No. : xxxxxxxxxxxxxxx
    //       </div>
    //       <div>
    //         Date Issued : xxxx/xx/xx
    //       </div>
    //       <div>
    //         Series Range : VI011331A000001 - VI011339Z999999
    //       </div>
    //       <div>
    //         Timestamp : 12/01/2021 10:35:28 CELOISA
    //       </div>
    //     </div>
    //   </div>
    // `;

    // const PAGE1 = `
    //   <div class="
    //       min-w-[816px] h-[1056px] min-h-[1056px] max-w-[1056px] p-[36px] gap-[12px] text-12 font-helvetica
    //       flex flex-col text-black bg-white
    //     "
    //   >

    //     <!-- GENERATE LABEL -->
    //     <div class="flex flex-col mt-[100px] mb-[20px] ">
    //       <div v-if="withBankCharges" class="w-full pb-2">
    //         * Bank charges are to be remitted to the Bank.
    //       </div>
    //       <div class="italic text-center border-t border-black">
    //         This document is computer generated, no signature required.
    //       </div>
    //     </div>

    //     <!-- FOOTER -->
    //     <div class="flex flex-col tracking-normal">
    //       <div>
    //         Acknowledgement Certificate No. : xxxxxxxxxxxxxxx
    //       </div>
    //       <div>
    //         Date Issued : xxxx/xx/xx
    //       </div>
    //       <div>
    //         Series Range : VI011331A000001 - VI011339Z999999
    //       </div>
    //       <div>
    //         Timestamp : 12/01/2021 10:35:28 CELOISA
    //       </div>
    //     </div>
    //   </div>
    // `;

    const PAGES_2D: string[] = []

    console.log('CREATING 2D SELECTED BILLINGS');

    SELECTED_INVOICES_2D.forEach((INVOICE_2D) => {
      let PAGES_1D = ``
      INVOICE_2D.forEach((INVOICE_RECORD) => {
        PAGES_1D += handleGeneratePage(INVOICE_RECORD)
      })
      PAGES_2D.push(PAGES_1D)
    })

    // console.log('PAGES_2D ', PAGES_2D);

    const CONFIGURATION = {
      margin: 0,
      filename: 'DRAFT - ' + 'Service Invoice' + ' Multiple' + SELECTED_INVOICES_2D.length,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    console.log('GENERATING PDF BLOBS');

    console.log(PAGES_2D);

    const pdfBlobs: Blob[] = await Promise.all(
      PAGES_2D.map(async (PAGES_1D) => {
        return await html2pdf()
          .set(CONFIGURATION)
          .from(PAGES_1D)
          .output('blob');
      })
    );

    console.log('MERGING PDF BLOBS');

    const MERGED_PDF_BLOB = await configStore.mergePDF(pdfBlobs)

    loadingDialogRef.close()


    const ShowDraftInvoices = dialog.open(DraftInvoiceModal, {
      data: {
        pdfBlob: MERGED_PDF_BLOB,
        download: () => {
          const url = URL.createObjectURL(MERGED_PDF_BLOB);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'DRAFT - ' + 'Service Invoice' + ' Multiple ' + SELECTED_INVOICES_1D.length + '.pdf';
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

  const handleExecutePrintFinalInvoices = () => {
    
  }

  const handleGeneratePage = (SELECTED_INVOICE_RECORD: InvoiceRecord) => {

    // OLD
    // const selectedCompany = COMPANIES.find((c) => c.COMPCD === SELECTED_INVOICE_RECORD.COMPCD) as COMPANY_DETAILS
    // const CONTENT_VALUES: InvoiceRecord = {
    //   PBL_KEY:          'CL3 L 0000  ',
    //   TCLTNO:           0,
    //   COMPCD:           2,

    //   BILLINGS:         [],

    //   HEADER: {
    //     img_url:        selectedCompany.IMG_URL,
    //     company_name:   selectedCompany.CONAME,
    //     address:        selectedCompany.ADDRESS,
    //     tel_no:         selectedCompany.TEL_NO,
    //     tin:            selectedCompany.TIN,

    //     invoice_name:   'SERVICE INVOICE',
    //     invoice_number: 'VI011331A000001',
    //     invoice_date:   '2021/12/01',
    //   },

    //   DESC: {
    //     client_name:    'Juan Antonio D. Perez',
    //     address:        '123 Mabini Street, Barangay Poblacion, Makati City, Metro Manila, Philippines',
    //     tin:            '123-456-789-000',
    //     client_key:     'CL310271 00',
    //     project:        'CITYNET CENTRAL',
    //     unit:           'L 0000',
    //   },

    //   TABLE_ITEMS: [
    //     {
    //       item_name:    'PENALTY ON RENTAL (September 1 - 30, 2021) VATable',
    //       qty:          1,
    //       unit_cost:    '1,445.62',
    //       vat_amount:   '173.47',
    //       amount:       '1,619.09',
    //     },
    //     {
    //       item_name:    'CUSA CHARGES (November 1 - 30, 2021) Zero-Rated',
    //       qty:          1,
    //       unit_cost:    '259,485.00',
    //       vat_amount:   '0.00',
    //       amount:       '259,485.00',
    //     },
    //     {
    //       item_name:    'PEN. ON CUSA CHARGES (September 1 - 30, 2021) VATable',
    //       qty:          1,
    //       unit_cost:    '308.91',
    //       vat_amount:   '37.07',
    //       amount:       '345.98',
    //     },
    //   ],

    //   MODE_OF_PAYMENT: {
    //     cash:           '0.00',
    //     // cash:           '256,225.28',
    //     check: {
    //       amount:       '',
    //       list: [
    //         {
    //           number:   1,
    //           details:  'BDO 10 987654321',
    //           date:     '2021/12/01',
    //           amount:   '42,704.21',
    //         },
    //         {
    //           number:   2,
    //           details:  'BDO 10 987654321',
    //           date:     '2021/12/01',
    //           amount:   '42,704.21',
    //         },
    //         {
    //           number:   3,
    //           details:  'BDO 10 987654321',
    //           date:     '2021/12/01',
    //           amount:   '42,704.21',
    //         },
    //         {
    //           number:   4,
    //           details:  'BDO 10 987654321',
    //           date:     '2021/12/01',
    //           amount:   '42,704.21',
    //         },
    //         {
    //           number:   5,
    //           details:  'BDO 10 987654321',
    //           date:     '2021/12/01',
    //           amount:   '42,704.21',
    //         },
    //         {
    //           number:   6,
    //           details:  'BDO 10 987654321',
    //           date:     '2021/12/01',
    //           amount:   '42,704.23',
    //         },
    //       ],
    //     },
    //     total_amount:   '256,225.28',
    //   },

    //   BREAKDOWN: {
    //     vatable_sales:    '1,754.53',
    //     vat_amount:       '210.54',
    //     vat_exempt_sales: '0.00',
    //     zero_rated_sales: '259,485.00',

    //     total_sales:      '261,450.07',
    //     net_of_vat:       '261,239.53',
    //     wht_tax:          '5,224.79',
    //     total_amount_due: '265,225.28',
    //   },

    //   SIGNATORY: {
    //     user_id:        'CDKARINA'
    //   },

    //   FOOTER: {
    //     certificate_no: 'xxxxxxxxxxxx',
    //     date_issued:    'xxxx/xx/xx',
    //     series_range:   'VI011331A000001 - VI011339Z999999',
    //     timestamp:      '12/01/2021 10:35:28'
    //   }
    // }

    console.log('SELECTED_INVOICE_RECORD ', SELECTED_INVOICE_RECORD)

    const CONTENT_VALUES: InvoiceRecord = SELECTED_INVOICE_RECORD

    var TABLE_ITEMS_COMPONENT = ``

    CONTENT_VALUES.TABLE_ITEMS.forEach((item) => {
      TABLE_ITEMS_COMPONENT += `
        <div class="grid grid-cols-16">
          <div class="col-span-9 px-1 text-wrap">
            ${ item.item_name }
          </div>
          <div class="col-span-1 px-1 text-center text-wrap">
            ${ item.qty }
          </div>
          <div class="col-span-2 px-1 text-right text-wrap">
            ${ item.unit_cost }
          </div>
          <div class="col-span-2 px-1 text-right text-wrap">
            ${ item.vat_amount }
          </div>
          <div class="col-span-2 px-1 text-right text-wrap ">
            ${ item.amount }
          </div>
        </div>
      `
    })


    var CHECKS_COMPONENT = `
      <div class="col-span-1 text-center text-[9px] font-bold">
        #
      </div>
      <div class="col-span-2 text-center text-[9px] font-bold">
        Cheque Details
      </div>
      <div class="col-span-2 text-center text-[9px] font-bold">
        Check Date
      </div>
      <div class="col-span-2 text-right pr-2 text-[9px] font-bold">
        Amount
      </div>
    `

    CONTENT_VALUES.MODE_OF_PAYMENT.check.list.forEach((check) => {
      CHECKS_COMPONENT += `
        <div class="col-span-1 text-center text-[9px]">
          ${ check.number }
        </div>
        <div class="col-span-2 text-center text-[9px]">
          ${ check.details }
        </div>
        <div class="col-span-2 text-center text-[9px]">
          ${ check.date }
        </div>
        <div class="col-span-2 text-right pr-2 text-[9px]">
          ${ check.amount }
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
              <img src="${ CONTENT_VALUES.HEADER.img_url }" alt="logo" class="w-20">
            </div>
            <div class="flex flex-col items-start justify-center flex-1 h-full gap-1 pl-4 -mt-4 resize-none shrink-0">
              <div class="font-semibold text-16 tracking-tighter">
                ${ CONTENT_VALUES.HEADER.company_name }
              </div>
              <div class="flex flex-col tracking-tighter text-10">
                <div class="text-wrap">
                  ${ CONTENT_VALUES.HEADER.address }
                </div>
                <div>
                  TEL. NO. ${ CONTENT_VALUES.HEADER.tel_no }
                </div>
                <div>
                  VAT REG TIN: ${ CONTENT_VALUES.HEADER.tin }
                </div>
              </div>
            </div>
          </div>
          <!-- RIGHT -->
          <div class="flex flex-col items-end justify-center h-full col-span-3 -mt-2">
            <div class="font-semibold text-20 -mt-[12px]">
              ${ CONTENT_VALUES.HEADER.invoice_name }
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                No.
              </div>
              <div>
                ${ CONTENT_VALUES.HEADER.invoice_number }
              </div>
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                Date :
              </div>
              <div>
                ${ CONTENT_VALUES.HEADER.invoice_date }
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div class="grid grid-cols-7 gap-10 mt-1">
          <div class="flex flex-col col-span-4 shrink-0">
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                SOLD TO
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DESC.client_name }
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
                ${ CONTENT_VALUES.DESC.address }
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
                ${ CONTENT_VALUES.DESC.tin }
              </div>
            </div>
          </div>
          <div class="flex flex-col col-span-3 shrink-0">
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                CLIENT KEY
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DESC.client_key }
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
                ${ CONTENT_VALUES.DESC.project }
              </div>
            </div>
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                UNIT
              </div>
              <div>
                :
              </div>
              <div>
                ${ CONTENT_VALUES.DESC.unit }
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

                  <!-- MODE OF PAYMENT -->
                  <div class="mt-3 -mb-1">
                    <div class="flex flex-col tracking-normal">
                      <div class="border border-black w-full px-2 pb-3 font-bold">
                        MODE OF PAYMENT
                      </div>
                      <div class="grid grid-cols-7 border border-black border-t-[0px] pb-3 -mt-1">
                        <!-- CASH -->
                        <div class="col-span-5 pl-2 font-bold">
                          Cash
                        </div>
                        <div class="col-span-2 text-right pr-2">
                          ${ CONTENT_VALUES.MODE_OF_PAYMENT.cash }
                        </div>

                        <!-- CHECK -->
                        <div class="col-span-5 pl-2 font-bold">
                          Check
                        </div>
                        <div class="col-span-2 text-right pr-2">
                          ${ CONTENT_VALUES.MODE_OF_PAYMENT.check.amount }
                        </div>

                        ${ CHECKS_COMPONENT }

                        <div class="col-span-5 pl-2 font-bold mt-2">
                          TOTAL
                        </div>
                        <div class="col-span-2 pr-2 text-right mt-2 font-bold">
                          ${ CONTENT_VALUES.MODE_OF_PAYMENT.total_amount }
                        </div>
                      </div>
                    </div>
                  </div>



                </div>
                <!-- COL 2 -->
                <div class="flex flex-col">

                  <!-- BREAKDOWN -->
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      VATable Sales
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.vatable_sales }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      VAT Amount
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.vat_amount }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      VAT Exempt Sales
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.vat_exempt_sales }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Zero-Rated Sales
                    </div>
                    <div class="font-bold text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.zero_rated_sales }
                    </div>
                  </div>


                  <div class="grid grid-cols-2 mt-5">
                    <div class="text-left">
                      Total Sales
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.total_sales }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Less: VAT
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.vat_amount }
                    </div>
                  </div>
                  <div class="mt-2 border-t border-black"></div>

                  <div class="grid grid-cols-2 -mt-2">
                    <div class="text-left">
                      Amount: Net of VAT
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.net_of_vat }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Add: VAT
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.vat_amount }
                    </div>
                  </div>
                  <div class="grid grid-cols-2">
                    <div class="text-left">
                      Less: Withholding Tax
                    </div>
                    <div class="text-right">
                      ${ CONTENT_VALUES.BREAKDOWN.wht_tax }
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
                      ${ CONTENT_VALUES.BREAKDOWN.total_amount_due }
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
              ${ CONTENT_VALUES.SIGNATORY.user_id }
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
            Acknowledgement Certificate No. : ${ CONTENT_VALUES.FOOTER.certificate_no }
          </div>
          <div>
            Date Issued : ${ CONTENT_VALUES.FOOTER.date_issued }
          </div>
          <div>
            Series Range : ${ CONTENT_VALUES.FOOTER.series_range }
          </div>
          <div>
            Timestamp : ${ CONTENT_VALUES.FOOTER.timestamp }
          </div>
        </div>
      </div>
    `;

    return PAGE
  }


  return {
    billings,
    invoiceDateForm,
    handleOpenMainDialogBox,
  }
})