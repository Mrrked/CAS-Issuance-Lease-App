import { Column, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import SelectedBillsTableModal from '../components/Dialog/PerMonthYear/SelectedBillsTableModal.vue';
import SummaryOfIssuanceModal from '../components/Dialog/PerMonthYear/SummaryOfIssuanceModal.vue';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useMainStore } from './useMainStore';

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore()

  const perBatchRunForm = ref<PerBatchRunForm>({
    invoiceDate: new Date()
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return mainStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return mainStore.processInvoiceRecords(billings_data.value, perBatchRunForm.value.invoiceDate)
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
    console.log('OPEN INITIAL / DRAFT INVOICE RECORDS', invoice_records_data.value);
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SelectedBillsTableModalFooter.vue'));
    const PerMonthYearDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        table_column: invoice_records_column.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
          mainStore.handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD)
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

  const handleExecuteIssueFinalInvoices = async () => {

    const SELECTED_INVOICES = invoice_records_data.value

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${SELECTED_INVOICES.length} Invoices...`
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
      invoices: [SELECTED_INVOICES[0]],
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


  return {
    perBatchRunForm,
    billings,

    invoice_records_data,

    handleOpenMainDialogBox,
  }
})