import { COMPANIES, COMPANY_DETAILS } from '../components/Dialog/PerMonthYear/data';
import { Column, InvoiceDateForm, LeaseBill } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import DraftInvoiceModal from '../components/Dialog/PerMonthYear/DraftInvoiceModal.vue';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import SelectedBillsTableModal from '../components/Dialog/PerMonthYear/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import html2pdf from 'html2pdf.js';
import { useConfigStore } from './useConfigStore';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';

export const usePerYearMonthStore = defineStore('2_PerYearMonth', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore()
  const configStore = useConfigStore()

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

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

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return billings.value.map((bill, index) => {
      return {
        ...bill,
        INDEX: index
      }
    })
  })

  const billings_column = computed((): Column[] => {
    return [
      { field: 'PBL_KEY',  header: 'PBL' },
      { field: 'CLIENT_NAME',  header: 'Client Name' },
      { field: 'BILL_TYPE', header: 'Bill Type' },
      { field: 'DATDUE', header: 'Due Date'},
      { field: 'PERIOD', header: 'Billing Period' },
      // { field: 'BILAMT',  header: 'Billing Amount' },
      { field: 'BALAMT', header: 'Amount Due' },
      // { field: 'VAT_SALES', header: 'VAT Sales' },
      // { field: 'ZERO_RATE', header: 'Zero-Rated' },
      // { field: 'VAT_EXEMPT', header: 'VAT Exempt' },
      // { field: 'VAT', header: 'VAT' },
      // { field: 'GOVT_TAX', header: 'Govt. Tax' },
      { field: 'WITHHOLDING_TAX', header: 'Withholding Tax' },
      { field: 'TOTAL_AMOUNT', header: 'Total Amount Due' },
    ]
  })


  const handleOpenMainDialogBox = () => {
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SelectedBillsTableModalFooter.vue'));
    const PerMonthYearDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : billings_data.value,
        table_column: billings_column.value,
        view: (selectedBilling: LeaseBill) => {
          handleGenerateDraftInvoice(selectedBilling)
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
        header: 'Selected Billings for Issuance of Invoice' ,
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

  const handleGenerateDraftInvoice = async (SELECTED_BILLING: LeaseBill) => {
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

    // console.log('SELECTED_BILLING ', SELECTED_BILLING);

    const selectedCompany = COMPANIES.find((c) => c.COMPCD === 1) as COMPANY_DETAILS

    const PAGE = `
      <div class="
          min-w-[816px] h-[1056px] min-h-[1056px] max-w-[1056px] p-[36px] gap-[12px] text-12 font-helvetica
          flex flex-col text-black bg-white
        "
      >
        <!-- HEADER -->
        <div class="grid grid-cols-7 -mt-4 min-h-24 max-h-24">
          <!-- LEFT -->
          <div class="flex items-center h-full col-span-5">
            <div class="flex items-center justify-center h-full resize-none shrink-0 w-fit">
              <img src="${selectedCompany.IMG_URL}" alt="logo" class="w-20">
            </div>
            <div class="flex flex-col items-start justify-center flex-1 h-full gap-1 pl-4 -mt-4 resize-none shrink-0">
              <div class="font-semibold text-16">
                ${ selectedCompany.CONAME }
              </div>
              <div class="flex flex-col tracking-tighter text-10">
                <div class="text-wrap">
                  ${ selectedCompany.ADDRESS }
                </div>
                <div>
                  TEL. NO. ${ selectedCompany.TEL_NO }
                </div>
                <div>
                  VAT REG TIN: ${ selectedCompany.TIN }
                </div>
              </div>
            </div>
          </div>
          <!-- RIGHT -->
          <div class="flex flex-col items-end justify-center h-full col-span-2 -mt-2">
            <div class="font-semibold text-20 -mt-[12px]">
              SERVICE INVOICE
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                No.
              </div>
              <div>
                VI011331A000001
              </div>
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                Date :
              </div>
              <div>
                2021/12/01
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div class="grid items-end grid-cols-7 gap-10 mt-1">
          <div class="flex flex-col col-span-4 shrink-0">
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                SOLD TO
              </div>
              <div>
                :
              </div>
              <div>
                Juan Antonio D. Perez
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                ADDRESS
              </div>
              <div>
                :
              </div>
              <div class="flex flex-col w-full">
                <div>
                  123 Mabini Street, Barangay Poblacion,
                </div>
                <div>
                  Makati City, Metro Manila, Philippines
                </div>
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
                123-456-789-000
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
                CL310271 00
              </div>
            </div>
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                PROJECT
              </div>
              <div>
                :
              </div>
              <div>
                CITYNET CENTRAL
              </div>
            </div>
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                UNIT
              </div>
              <div>
                :
              </div>
              <div class=""> L 0000</div>
            </div>
          </div>
        </div>

        <!-- TABLE -->
        <div class="flex flex-col h-full mt-2 tracking-tighter text-10">
          <!-- THEAD -->
          <div class="grid grid-cols-11 font-bold border border-black" style="line-height: 11px;">
            <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
              <div class="col-span-5 px-1 pb-3 border-r border-black -pt-4 text-wrap">
                Item / Description
              </div>
              <div class="px-1 pb-3 text-center border-r border-black -pt-4 text-wrap">
                Qty
              </div>
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Unit Cost
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VATable Sales
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VAT Exempt Sales
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Zero Rated Sales
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VAT
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Government Taxes
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Withholding Tax
            </div>
            <div class="px-1 pb-3 text-right -pt-4 text-wrap">
              Amount Due
            </div>
          </div>
          <!-- TBODY -->
          <div class="flex flex-col justify-between flex-1 pb-3 border-b border-black border-x">
            <!-- ROWS -->
            <div class="flex flex-col">
              <div class="grid grid-cols-11">
                <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                  <div class="col-span-5 px-1 text-wrap">
                    Pen. on Rental for September 1 - 30, 2021
                  </div>
                  <div class="px-1 text-center text-wrap">
                    1
                  </div>
                </div>
                <div class="px-1 text-right text-wrap">
                  1,619.09
                </div>
                <div class="px-1 text-right text-wrap">
                  1,445.62
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  173.47
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  (28.91)
                </div>
                <div class="px-1 text-right text-wrap ">
                  1,590.18
                </div>
              </div>
              <div class="grid grid-cols-11">
                <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                  <div class="col-span-5 px-1 text-wrap">
                    Cusa for November 1 - 30, 2021
                  </div>
                  <div class="px-1 text-center text-wrap">
                    1
                  </div>
                </div>
                <div class="px-1 text-right text-wrap">
                  259,485.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  259,485.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  (5,189.70)
                </div>
                <div class="px-1 text-right text-wrap">
                  254.295.30
                </div>
              </div>
              <div class="grid grid-cols-11">
                <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                  <div class="col-span-5 px-1 text-wrap">
                    Pen. on Cusa for September 1 - 30, 2021
                  </div>
                  <div class="px-1 text-center text-wrap">
                    1
                  </div>
                </div>
                <div class="px-1 text-right text-wrap">
                  345.98
                </div>
                <div class="px-1 text-right text-wrap">
                  308.91
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  37.07
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  (6.18)
                </div>
                <div class="px-1 text-right text-wrap ">
                  339.80
                </div>
              </div>
              <pre> </pre>
            </div>

            <!-- BREAKDOWN -->
            <div class="grid items-end grid-cols-2 gap-16 px-2 tracking-normal text-12">
              <!-- COL 1 -->
              <div class="flex flex-col">
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    VATable Sales
                  </div>
                  <div class="col-span-2 text-right">
                    1,754.53
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    VAT Amount
                  </div>
                  <div class="col-span-2 text-right">
                    210.54
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    VAT Exempt Sales
                  </div>
                  <div class="col-span-2 text-right">
                    0.00
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Zero-Rated Sales
                  </div>
                  <div class="col-span-2 text-right">
                    259,485.00
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Government Taxes
                  </div>
                  <div class="col-span-2 text-right">
                    0.00
                  </div>
                </div>
              </div>
              <!-- COL 2 -->
              <div class="flex flex-col">
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Total Sales
                  </div>
                  <div class="col-span-2 text-right">
                    261,239.53
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Add: VAT
                  </div>
                  <div class="col-span-2 text-right">
                    210.54
                  </div>
                </div>
                <div class="grid grid-cols-5">
                  <div class="col-span-2 font-bold text-left">
                    Less: Withholding Tax
                  </div>
                  <div class="col-span-3 text-right">
                    5,224.79
                  </div>
                </div>
                <div class="mt-2 border-t border-black"></div>
                <div class="grid grid-cols-3 -mt-1">
                  <div class="col-span-1 font-bold text-left">
                    Total Amount Due
                  </div>
                  <div class="col-span-2 text-right">
                    256,225.28
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GENERATE LABEL -->
        <div class="flex flex-col mt-[100px] mb-[20px] ">
          <div v-if="withBankCharges" class="w-full pb-2">
            * Bank charges are to be remitted to the Bank.
          </div>
          <div class="italic text-center border-t border-black">
            This document is computer generated, no signature required.
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex flex-col tracking-normal">
          <div>
            Acknowledgement Certificate No. : xxxxxxxxxxxxxxx
          </div>
          <div>
            Date Issued : xxxx/xx/xx
          </div>
          <div>
            Series Range : VI011331A000001 - VI011339Z999999
          </div>
          <div>
            Timestamp : 12/01/2021 10:35:28 CELOISA
          </div>
        </div>
      </div>
    `;

    const CONFIGURATION = {
      margin: 0,
      filename: 'DRAFT - ' + 'Service Invoice' + ' Single ' + SELECTED_BILLING.INDEX,
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

    const SELECTED_BILLINGS_1D = billings_data.value

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${SELECTED_BILLINGS_1D.length} Drafts...`
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      }
    })

    const chunkArray = (array: LeaseBill[], chunkSize: number): LeaseBill[][] => {
      const result: LeaseBill[][] = [];

      for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
      }

      return result;
    }

    const SELECTED_BILLINGS_2D: LeaseBill[][] = chunkArray(SELECTED_BILLINGS_1D, 20)

    // console.log('SELECTED_BILLINGS_2D ', SELECTED_BILLINGS_2D);

    const selectedCompany = COMPANIES.find((c) => c.COMPCD === 1) as COMPANY_DETAILS

    const PAGE = `
      <div class="
          min-w-[816px] h-[1056px] min-h-[1056px] max-w-[1056px] p-[36px] gap-[12px] text-12 font-helvetica
          flex flex-col text-black bg-white
        "
      >
        <!-- HEADER -->
        <div class="grid grid-cols-7 -mt-4 min-h-24 max-h-24">
          <!-- LEFT -->
          <div class="flex items-center h-full col-span-5">
            <div class="flex items-center justify-center h-full resize-none shrink-0 w-fit">
              <img src="${selectedCompany.IMG_URL}" alt="logo" class="w-20">
            </div>
            <div class="flex flex-col items-start justify-center flex-1 h-full gap-1 pl-4 -mt-4 resize-none shrink-0">
              <div class="font-semibold text-16">
                ${ selectedCompany.CONAME }
              </div>
              <div class="flex flex-col tracking-tighter text-10">
                <div class="text-wrap">
                  ${ selectedCompany.ADDRESS }
                </div>
                <div>
                  TEL. NO. ${ selectedCompany.TEL_NO }
                </div>
                <div>
                  VAT REG TIN: ${ selectedCompany.TIN }
                </div>
              </div>
            </div>
          </div>
          <!-- RIGHT -->
          <div class="flex flex-col items-end justify-center h-full col-span-2 -mt-2">
            <div class="font-semibold text-20 -mt-[12px]">
              SERVICE INVOICE
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                No.
              </div>
              <div>
                VI011331A000001
              </div>
            </div>
            <div class="flex gap-3 font-semibold text-14">
              <div>
                Date :
              </div>
              <div>
                2021/12/01
              </div>
            </div>
          </div>
        </div>

        <!-- DESCRIPTION -->
        <div class="grid items-end grid-cols-7 gap-10 mt-1">
          <div class="flex flex-col col-span-4 shrink-0">
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                SOLD TO
              </div>
              <div>
                :
              </div>
              <div>
                Juan Antonio D. Perez
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-24 font-semibold shrink-0">
                ADDRESS
              </div>
              <div>
                :
              </div>
              <div class="flex flex-col w-full">
                <div>
                  123 Mabini Street, Barangay Poblacion,
                </div>
                <div>
                  Makati City, Metro Manila, Philippines
                </div>
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
                123-456-789-000
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
                CL310271 00
              </div>
            </div>
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                PROJECT
              </div>
              <div>
                :
              </div>
              <div>
                CITYNET CENTRAL
              </div>
            </div>
            <div class="flex items-end gap-3">
              <div class="w-24 font-semibold">
                UNIT
              </div>
              <div>
                :
              </div>
              <div class=""> L 0000</div>
            </div>
          </div>
        </div>

        <!-- TABLE -->
        <div class="flex flex-col h-full mt-2 tracking-tighter text-10">
          <!-- THEAD -->
          <div class="grid grid-cols-11 font-bold border border-black" style="line-height: 11px;">
            <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
              <div class="col-span-5 px-1 pb-3 border-r border-black -pt-4 text-wrap">
                Item / Description
              </div>
              <div class="px-1 pb-3 text-center border-r border-black -pt-4 text-wrap">
                Qty
              </div>
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Unit Cost
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VATable Sales
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VAT Exempt Sales
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Zero Rated Sales
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              VAT
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Government Taxes
            </div>
            <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
              Withholding Tax
            </div>
            <div class="px-1 pb-3 text-right -pt-4 text-wrap">
              Amount Due
            </div>
          </div>
          <!-- TBODY -->
          <div class="flex flex-col justify-between flex-1 pb-3 border-b border-black border-x">
            <!-- ROWS -->
            <div class="flex flex-col">
              <div class="grid grid-cols-11">
                <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                  <div class="col-span-5 px-1 text-wrap">
                    Pen. on Rental for September 1 - 30, 2021
                  </div>
                  <div class="px-1 text-center text-wrap">
                    1
                  </div>
                </div>
                <div class="px-1 text-right text-wrap">
                  1,619.09
                </div>
                <div class="px-1 text-right text-wrap">
                  1,445.62
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  173.47
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  (28.91)
                </div>
                <div class="px-1 text-right text-wrap ">
                  1,590.18
                </div>
              </div>
              <div class="grid grid-cols-11">
                <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                  <div class="col-span-5 px-1 text-wrap">
                    Cusa for November 1 - 30, 2021
                  </div>
                  <div class="px-1 text-center text-wrap">
                    1
                  </div>
                </div>
                <div class="px-1 text-right text-wrap">
                  259,485.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  259,485.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  (5,189.70)
                </div>
                <div class="px-1 text-right text-wrap">
                  254.295.30
                </div>
              </div>
              <div class="grid grid-cols-11">
                <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                  <div class="col-span-5 px-1 text-wrap">
                    Pen. on Cusa for September 1 - 30, 2021
                  </div>
                  <div class="px-1 text-center text-wrap">
                    1
                  </div>
                </div>
                <div class="px-1 text-right text-wrap">
                  345.98
                </div>
                <div class="px-1 text-right text-wrap">
                  308.91
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  37.07
                </div>
                <div class="px-1 text-right text-wrap">
                  0.00
                </div>
                <div class="px-1 text-right text-wrap">
                  (6.18)
                </div>
                <div class="px-1 text-right text-wrap ">
                  339.80
                </div>
              </div>
              <pre> </pre>
            </div>

            <!-- BREAKDOWN -->
            <div class="grid items-end grid-cols-2 gap-16 px-2 tracking-normal text-12">
              <!-- COL 1 -->
              <div class="flex flex-col">
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    VATable Sales
                  </div>
                  <div class="col-span-2 text-right">
                    1,754.53
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    VAT Amount
                  </div>
                  <div class="col-span-2 text-right">
                    210.54
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    VAT Exempt Sales
                  </div>
                  <div class="col-span-2 text-right">
                    0.00
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Zero-Rated Sales
                  </div>
                  <div class="col-span-2 text-right">
                    259,485.00
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Government Taxes
                  </div>
                  <div class="col-span-2 text-right">
                    0.00
                  </div>
                </div>
              </div>
              <!-- COL 2 -->
              <div class="flex flex-col">
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Total Sales
                  </div>
                  <div class="col-span-2 text-right">
                    261,239.53
                  </div>
                </div>
                <div class="grid grid-cols-3">
                  <div class="col-span-1 font-bold text-left">
                    Add: VAT
                  </div>
                  <div class="col-span-2 text-right">
                    210.54
                  </div>
                </div>
                <div class="grid grid-cols-5">
                  <div class="col-span-2 font-bold text-left">
                    Less: Withholding Tax
                  </div>
                  <div class="col-span-3 text-right">
                    5,224.79
                  </div>
                </div>
                <div class="mt-2 border-t border-black"></div>
                <div class="grid grid-cols-3 -mt-1">
                  <div class="col-span-1 font-bold text-left">
                    Total Amount Due
                  </div>
                  <div class="col-span-2 text-right">
                    256,225.28
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GENERATE LABEL -->
        <div class="flex flex-col mt-[100px] mb-[20px] ">
          <div v-if="withBankCharges" class="w-full pb-2">
            * Bank charges are to be remitted to the Bank.
          </div>
          <div class="italic text-center border-t border-black">
            This document is computer generated, no signature required.
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex flex-col tracking-normal">
          <div>
            Acknowledgement Certificate No. : xxxxxxxxxxxxxxx
          </div>
          <div>
            Date Issued : xxxx/xx/xx
          </div>
          <div>
            Series Range : VI011331A000001 - VI011339Z999999
          </div>
          <div>
            Timestamp : 12/01/2021 10:35:28 CELOISA
          </div>
        </div>
      </div>
    `;

    const PAGES_2D: string[] = []

    SELECTED_BILLINGS_2D.forEach((BILLS_2D) => {
      let PAGES_1D = ``
      BILLS_2D.forEach(() => {
        PAGES_1D += PAGE
      })
      PAGES_2D.push(PAGES_1D)
    })

    // console.log('PAGES_2D ', PAGES_2D);

    const CONFIGURATION = {
      margin: 0,
      filename: 'DRAFT - ' + 'Service Invoice' + ' Multiple' + SELECTED_BILLINGS_1D.length,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    const pdfBlobs: Blob[] = await Promise.all(
      PAGES_2D.map(async (PAGES_1D) => {
        return await html2pdf()
          .set(CONFIGURATION)
          .from(PAGES_1D)
          .output('blob');
      })
    );

    const MERGED_PDF_BLOB = await configStore.mergePDF(pdfBlobs)

    loadingDialogRef.close()


    const ShowDraftInvoices = dialog.open(DraftInvoiceModal, {
      data: {
        pdfBlob: MERGED_PDF_BLOB,
        download: () => {
          const url = URL.createObjectURL(MERGED_PDF_BLOB);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'DRAFT - ' + 'Service Invoice' + ' Multiple ' + SELECTED_BILLINGS_1D.length + '.pdf';
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

  return {
    billings,
    invoiceDateForm,
    handleOpenMainDialogBox,
  }
})