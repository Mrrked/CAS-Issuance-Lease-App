import { Column, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import PreviewPDFModal from '../components/Dialog/General/PreviewPDFModal.vue';
import SelectedBillsTableModal from '../components/Dialog/PerBatch/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const toast = useToast()
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
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModalFooter.vue'));
    const PerBatchRunDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        table_column: invoice_records_column.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
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

          mainStore.handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD, () => loadingDialogRef.close())
        },
        view1: () => {
          const loadingDialogRef = dialog.open(LoadingModal, {
            data: {
              label: `Generating ${invoice_records_data.value.length} Drafts...`
            },
            props: {
              style: {
                paddingTop: '1.5rem',
              },
              showHeader: false,
              modal: true
            },
          })

          mainStore.handleGenerateDraftInvoices(invoice_records_data.value, () => loadingDialogRef.close())
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
              PerBatchRunDialog.close()
            },
            reject: () => {
            }
          });
        },
        cancel: () => {
          PerBatchRunDialog.close()
        }
      },
      props: {
        header: '(Per Batch) For Issuance of Invoice' ,
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

    toast.add({
      summary: 'Please do not close this tab!',
      detail: 'Ongoing Batch Issuance of Invoices',
      severity: 'info',
      life: 3000,
    })

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${invoice_records_data.value.length} Invoices...`
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      },
    })

    const SELECTED_INVOICES = invoice_records_data.value

    const data = {
      year: perBatchRunForm.value.invoiceDate.getFullYear(),
      month: perBatchRunForm.value.invoiceDate.getMonth() + 1,
      type: 'BATCH',
      invoices: SELECTED_INVOICES,
    }

    const callback = async (response?: AxiosResponse) => {
      // console.log('RESPONSE', response.data);

      const issuedInvoiceRecords = response?.data as InvoiceRecord[];

      const PDF_BLOB = mainStore.handleGenerateInvoicePDFBlob(issuedInvoiceRecords)

      const Footer = defineAsyncComponent(() => import('../components/Dialog/General/FinalInvoiceModalFooter.vue'));
      const ShowIssuedInvoices = dialog.open(PreviewPDFModal, {
        data: {
          pdfBlob: PDF_BLOB,
          download: () => {
            const url = URL.createObjectURL(PDF_BLOB);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Issued Invoices ${data.year}/${data.month}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
          },
          submit: () => {
          },
          cancel: () => {
            ShowIssuedInvoices.close()
          }
        },
        props: {
          header: '(Per Batch) Issued Invoices',
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