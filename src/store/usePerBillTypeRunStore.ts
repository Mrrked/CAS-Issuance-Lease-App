import { InvoiceRecord, LeaseBill, PerBillTypeOption, PerBillTypeRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref, watch } from 'vue';

import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const PreviewPDFModal = defineAsyncComponent(() => import('../components/Dialog/General/PreviewPDFModal.vue'));
const ResultFinalInvoiceModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultFinalInvoiceModal.vue'));
const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModal.vue'));

export const usePerBillTypeRunStore = defineStore('1_PerBillTypeRun', () => {

  const toast = useToast();
  const dialog = useDialog();
  const confirm = useConfirm();

  const utilStore = useUtilitiesStore()
  const issuanceStore = useIssuanceStore()

  const BILL_TYPE_OPTIONS: {value: 'A' | 'B' | 'C', name: PerBillTypeOption}[] = [
    { value: 'A', name: 'Rental and CUSA' },
    { value: 'B', name: 'Electricity and Generator Set' },
    { value: 'C', name: 'Water' },
  ]

  const perBillTypeRunForm = ref<PerBillTypeRunForm>({
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
      }
    }
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return issuanceStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return issuanceStore.processInvoiceRecords(billings_data.value, perBillTypeRunForm.value.invoiceDate)
  })

  const isShowPBLForm = computed((): boolean => {
    return perBillTypeRunForm.value.billType === 'A'
  });

  const handleActionViewMainDialog = () => {
    console.log('OPEN INITIAL / DRAFT INVOICE RECORDS', invoice_records_data.value);
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModalFooter.vue'));
    const PerBillTypeRunDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
          const loading = utilStore.startLoadingModal('Generating Draft...')
          issuanceStore.handleActionGenerateDraftInvoice(SELECTED_INVOICE_RECORD, () => loading.close())
        },
        view1: () => {
          const loading = utilStore.startLoadingModal(`Generating ${invoice_records_data.value.length} Drafts...`)
          issuanceStore.handleActionGenerateDraftInvoices(invoice_records_data.value, perBillTypeRunForm.value.invoiceDate, () => loading.close())
        },
        submit: () => {
          confirm.require({
            message: `This action will issue invoice for each of the ${invoice_records_data.value.length} records. Are you sure you want to continue in the issuance of invoices?`,
            header: '(FINAL) Confirm Issuance of Invoice?',
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
              handleActionIssueFinalInvoices()
              PerBillTypeRunDialog.close()
            },
            reject: () => {
            }
          });
        },
        cancel: () => {
          PerBillTypeRunDialog.close()
        }
      },
      props: {
        header: 'For Issuance of Invoice - ' + perBillTypeRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long' }),
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

  const handleActionIssueFinalInvoices = () => {

  }

  watch(
    () => perBillTypeRunForm.value.billType,
    (newBillType) => {
      if (newBillType !== 'A') {
        perBillTypeRunForm.value.PBL = {
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
          }
        }
      }
    },
    { deep: true }
  );

  return {
    BILL_TYPE_OPTIONS,

    perBillTypeRunForm,

    billings,
    billings_data,
    invoice_records_data,

    isShowPBLForm,

    handleActionViewMainDialog,
  }
})