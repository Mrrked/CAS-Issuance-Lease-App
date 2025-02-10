import { Column, InvoiceRecord, LeaseBill, PerBillTypeRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import SelectedBillsTableModal from '../components/Dialog/PerBatch/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';

export const usePerBillTypeRunStore = defineStore('1_PerBillTypeRun', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const issuanceStore = useIssuanceStore()

  const BILL_TYPE_OPTIONS = [
    { value: 'Rental and CUSA', name: 'Rental and CUSA' },
    { value: 'Electricity and Generator Set', name: 'Electricity and Generator Set' },
    { value: 'Water', name: 'Water' },
  ]

  const perBillTypeRunForm = ref<PerBillTypeRunForm>({
    invoiceDate: new Date(),
  })

  const billings = ref<LeaseBill[]>([])

  const showPBLForm = computed((): boolean => {
    return perBillTypeRunForm.value.billType?.value === 'Rental and CUSA'
  });

  const billings_data = computed(():LeaseBill[] => {
    return issuanceStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return issuanceStore.processInvoiceRecords(billings_data.value, perBillTypeRunForm.value.invoiceDate)
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
    // console.log('OPEN INITIAL / DRAFT INVOICE RECORDS', invoice_records_data.value);
    // const Footer = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModalFooter.vue'));
    // const PerMonthYearDialog = dialog.open(SelectedBillsTableModal, {
    //   data: {
    //     table_data : invoice_records_data.value,
    //     table_column: invoice_records_column.value,
    //     view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
    //       issuanceStore.handleGenerateDraftInvoice([SELECTED_INVOICE_RECORD])
    //     },
    //     submit: () => {
    //       confirm.require({
    //         message: 'Are you sure you want to issue invoice?',
    //         header: 'Confirm Issuance of Invoice (FINAL) ? ',
    //         icon: 'pi pi-exclamation-triangle',
    //         rejectProps: {
    //           label: 'Cancel',
    //           severity: 'secondary',
    //           outlined: true
    //         },
    //         acceptProps: {
    //           label: 'Confirm'
    //         },
    //         accept: () => {
    //           handleExecutePrintFinalInvoices()
    //         },
    //         reject: () => {
    //         }
    //       });
    //     },
    //     cancel: () => {
    //       PerMonthYearDialog.close()
    //     }
    //   },
    //   props: {
    //     header: 'Issuance of Invoice (Per Bill Type)' ,
    //     style: {
    //       width: '75vw'
    //     },
    //     showHeader: true,
    //     maximizable: true,
    //     modal: true,
    //   },
    //   templates: {
    //     footer: markRaw(Footer)
    //   },
    //   onClose: () => {
    //     billings.value = []
    //   }
    // })
  }

  const handleExecutePrintFinalInvoices = () => {

  }

  return {
    BILL_TYPE_OPTIONS,

    perBillTypeRunForm,
    billings,

    showPBLForm,
    invoice_records_data,

    handleOpenMainDialogBox,
  }
})