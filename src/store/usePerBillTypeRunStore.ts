import { FAILED_INVOICE_RECORDS, InvoiceRecord, LeaseBill, PerBillTypeOption, PerBillTypeRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref, watch } from 'vue';

import { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useFileStore } from './useFileStore';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const ResultFinalInvoiceModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultFinalInvoiceModal.vue'));
const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModal.vue'));

export const usePerBillTypeRunStore = defineStore('1_PerBillTypeRun', () => {

  const toast = useToast();
  const dialog = useDialog();
  const confirm = useConfirm();

  const fileStore = useFileStore()
  const mainStore = useMainStore();
  const utilStore = useUtilitiesStore();
  const issuanceStore = useIssuanceStore();

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
    // console.log('OPEN INITIAL / DRAFT INVOICE RECORDS', invoice_records_data.value);
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

  const handleActionIssueFinalInvoices = async () => {

    mainStore.allowReloadExitPage = false;

    toast.add({
      summary: 'Please do not close this tab!',
      detail: 'Ongoing Batch Issuance of Invoices',
      severity: 'info',
      life: 3000,
    })

    const loading = utilStore.startLoadingModal(`Generating ${invoice_records_data.value.length} Invoices...`)

    const SELECTED_INVOICES = [
      ...invoice_records_data.value.map((INVOICE) => {

        const currentDate = new Date()
        const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
        const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

        const NO_OF_MONTHS = issuanceStore.getNOMOS(INVOICE, [1, 11])

        return {
          ...INVOICE,
          DETAILS: {
            ...INVOICE.DETAILS,

            PRSTAT: 'P',
            PRCNT: 1,

            DATSTP: stampDate,
            TIMSTP: stampTime,

            RUNDAT: stampDate,
            RUNTME: stampTime,
          },
          CORFPF: {
            ...INVOICE.CORFPF,

            DATOR: stampDate,
            ORAMT: INVOICE.TOTAL_BREAKDOWN.AMTDUE,
            NOACCT: NO_OF_MONTHS,
            DATPRT: Number.parseInt(`${stampTime}` + (INVOICE.TOTAL_BREAKDOWN.VATAMT > 0 ? '01' : '00')),
            NOMOS: NO_OF_MONTHS,
          },
          CORTPF: {
            ...INVOICE.CORTPF,

            NOMOS: NO_OF_MONTHS,
          },
          CORF4PF: INVOICE.CORF4PF
            .map((record) => {
              return {
                ...record,
                DATENT: stampDate,
                TIMENT: stampTime,
              }
            }),
        }
      })
    ]

    // console.log("FOR ISSUANCE", SELECTED_INVOICES);

    const data = {
      year: perBillTypeRunForm.value.invoiceDate.getFullYear(),
      month: perBillTypeRunForm.value.invoiceDate.getMonth() + 1,
      type: 'BILL GROUP ' + perBillTypeRunForm.value.billType,
      invoices: SELECTED_INVOICES as InvoiceRecord[],
    }

    const callback = async (response?: AxiosResponse) => {
      // console.log('RESPONSE', response?.data);

      const issuedInvoiceRecords = response?.data.data.success as InvoiceRecord[] || [];
      const failedInvoiceRecords = response?.data.data.error as FAILED_INVOICE_RECORDS || [];

      const ShowResultFinalInvoiceDialog = dialog.open(ResultFinalInvoiceModal, {
        data: {
          issuedInvoiceRecords,
          failedInvoiceRecords,
          downloadFailedInvoices: () => {
            const JSON_BLOB = new Blob(
              [JSON.stringify(failedInvoiceRecords, null, 2)],
              { type: 'application/json' }
            );
            const url = URL.createObjectURL(JSON_BLOB);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ERRORS_INVOICE_ISSUANCE_${failedInvoiceRecords.RUN_AT}.json`;
            a.click();
            URL.revokeObjectURL(url);
          },
          viewSummarySuccessInvoices: null,
          viewSuccessInvoices: async () => {
            const loading = utilStore.startLoadingModal(`Loading ${issuedInvoiceRecords.length} Invoices...`)

            await new Promise(resolve => setTimeout(resolve, 1000));

            const PDF_BLOB = issuanceStore.handleActionGenerateInvoicePDFBlob(issuedInvoiceRecords)

            fileStore.handleActionDownloadFileBlob(PDF_BLOB, `Issued Invoices ${data.year}-${data.month}.pdf`)

            const header = 'Issued Invoices - ' + perBillTypeRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            fileStore.handleActionViewFilePDF(header, `Issued Invoices ${data.year}-${data.month}.pdf`, PDF_BLOB, null, () => {}, () => {})

            loading.close()
          },
          cancel: () => {
            confirm.require({
              message: `Please review the result of the invoice issuance. You might need to check and save the issued and/or failed invoices.`,
              header: 'Are you sure you want to close the results modal?',
              icon: 'pi pi-exclamation-triangle',
              rejectProps: {
                label: 'NO, return to results.',
                severity: 'secondary',
                outlined: true
              },
              acceptProps: {
                label: 'YES, close results.'
              },
              accept: () => {
                mainStore.allowReloadExitPage = true;
                ShowResultFinalInvoiceDialog.close()
              },
              reject: () => {
              }
            });
          }
        },
        props: {
          style: {
            width: '50vw'
          },
          showHeader: false,
          modal: true,
        },
      })
    }

    issuanceStore.handleActionIssueFinalInvoices(data, callback, () => loading.close())
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