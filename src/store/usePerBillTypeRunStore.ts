import { InvoiceRecord, LeaseBill, PerBillTypeOption, PerBillTypeRunForm } from './types';
import { computed, defineAsyncComponent, ref } from 'vue';

import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';

const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModal.vue'));

export const usePerBillTypeRunStore = defineStore('1_PerBillTypeRun', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const issuanceStore = useIssuanceStore()

  const BILL_TYPE_OPTIONS: {value: PerBillTypeOption, name: string}[] = [
    { value: 'Rental and CUSA', name: 'Rental and CUSA' },
    { value: 'Electricity and Generator Set', name: 'Electricity and Generator Set' },
    { value: 'Water', name: 'Water' },
  ]

  const perBillTypeRunForm = ref<PerBillTypeRunForm>({
    invoiceDate: new Date(),
    projectCode: null,
    billType: null
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return issuanceStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return issuanceStore.processInvoiceRecords(billings_data.value, perBillTypeRunForm.value.invoiceDate)
  })

  const isShowPBLForm = computed((): boolean => {
    return perBillTypeRunForm.value.billType === 'Rental and CUSA'
  });

  const handleActionViewMainDialog = () => {

  }

  const handleActionIssueFinalInvoices = () => {

  }

  return {
    BILL_TYPE_OPTIONS,

    perBillTypeRunForm,

    billings,
    invoice_records_data,

    isShowPBLForm,

    handleActionViewMainDialog,
  }
})