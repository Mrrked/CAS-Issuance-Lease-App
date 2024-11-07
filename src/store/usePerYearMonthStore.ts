import { Column, InvoiceDateForm, LeaseBill } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import DraftInvoiceModal from '../components/Dialog/PerMonthYear/DraftInvoiceModal.vue';
import DraftInvoicesModal from '../components/Dialog/PerMonthYear/DraftInvoicesModal.vue';
import SelectedBillsTableModal from '../components/Dialog/PerMonthYear/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';

export const usePerYearMonthStore = defineStore('2_PerYearMonth', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

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
          handleShowDraftInvoice(selectedBilling)
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

  const handleShowDraftInvoice = (selectedBilling: LeaseBill) => {
    const ShowDraftInvoice = dialog.open(DraftInvoiceModal, {
      data: {
        bill: selectedBilling,
        submit: () => {
        },
        cancel: () => {
          ShowDraftInvoice.close()
        }
      },
      props: {
        header: 'Preview Draft Invoice' ,
        style: {
          width: '75vw'
        },
        showHeader: true,
        modal: true,
      }
    })
  }


  const handleExecutePrintDraftInvoices = () => {
    const ShowDraftInvoice = dialog.open(DraftInvoicesModal, {
      data: {
        bills: billings_data.value,
        file_name: '',
        submit: () => {
        },
        cancel: () => {
          ShowDraftInvoice.close()
        }
      },
      props: {
        header: 'Preview Draft Invoices' ,
        style: {
          width: '75vw'
        },
        showHeader: true,
        modal: true,
      }
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