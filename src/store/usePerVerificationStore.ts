import { FAILED_INVOICE_RECORDS, InvoicePrintStatus, InvoiceRecord, LeaseBill, PerVerificationRunForm } from './types';
import { computed, defineAsyncComponent, ref } from 'vue';

import { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const ResultIssuedInvoicesModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultIssuedInvoicesModal.vue'));

export const usePerVerificationRunStore = defineStore('3_PerVerificationRun', () => {

  const toast = useToast();
  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore();
  const utilStore = useUtilitiesStore();
  const issuanceStore = useIssuanceStore();

  const perVerificationRunForm = ref<PerVerificationRunForm>({
    invoiceDate: new Date(),
  })

  const selectedInvoiceRecord = ref<InvoiceRecord>()

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return issuanceStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return issuanceStore.convertBillingsToInvoiceRecords(billings_data.value, perVerificationRunForm.value.invoiceDate)
  })

  const handleActionIssueInvoice = async () => {
    const INVOICE = selectedInvoiceRecord.value
    if (INVOICE) {
      confirm.require({
        message: `This action will issue invoice for the selected verification. Are you sure you want to continue in the issuance of invoice?`,
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
          mainStore.allowReloadExitPage = false;

          toast.add({
            summary: 'Please do not close this tab!',
            detail: 'Ongoing Batch Issuance of Invoices',
            severity: 'info',
            life: 3000,
          })

          const loading = utilStore.startLoadingModal(`Issuing invoice...`)

          const currentDate = new Date()
          const stampDate = utilStore.getCurrentDateNumberYYYYMMDD(currentDate)
          const stampTime = utilStore.getCurrentTimeNumberHHMMSS(currentDate)

          const NO_OF_MONTHS = selectedInvoiceRecord.value?.BILLINGS.length || 0

          var entry = INVOICE.ENTRY || undefined
          const invoice_date = INVOICE.CORFPF.DATVAL

          if (entry) {
            entry = {
              ...entry,
              GFL1PF: {
                ...entry.GFL1PF,
                DATTRN: invoice_date,
                DATECR: invoice_date,
                PAYCOD: '9999',
                PAYEE: INVOICE.DETAILS.CLTKEY + '/' + INVOICE.PBL_KEY + '/' + INVOICE.TCLTNO
              },
              GFL2PF: entry.GFL2PF.map((acc_entry) => {
                return {
                  ...acc_entry,
                  DATTRN: invoice_date
                }
              })
            }
          }

          const SELECTED_INVOICE: InvoiceRecord = {
            ...INVOICE,
            DETAILS: {
              ...INVOICE.DETAILS,
              RUNDAT: stampDate,
              RUNTME: stampTime,

              PRSTAT: "P" as InvoicePrintStatus,
              PRCNT: 1,

              UPDDTE: stampDate,
              UPDTME: stampTime,
            },
            CORFPF: {
              ...INVOICE.CORFPF,

              DATOR: stampDate,
              ORAMT: 0,
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
            LOPH2PF: {
              ...INVOICE.LOPH2PF,
              DATOR: stampDate,
              DATUPD: stampDate,
              TIMUPD: stampTime,
            },
            LOPD2PF: INVOICE.LOPD2PF
              .map((record) => {
                return {
                  ...record,
                  DATUPD: stampDate,
                  TIMUPD: stampTime,
                }
              }),
            CORF3PF: {
              ...INVOICE.CORF3PF,
              DATENT: stampDate,
              TIMENT: stampTime,
            },
            ENTRY: undefined
          }

          // console.log("FOR ISSUANCE", SELECTED_INVOICE);

          const data = {
            year: perVerificationRunForm.value.invoiceDate.getFullYear(),
            month: perVerificationRunForm.value.invoiceDate.getMonth() + 1,
            day: perVerificationRunForm.value.invoiceDate.getDate(),
            type: 'From Verification',
            invoices: [SELECTED_INVOICE] as InvoiceRecord[],
          }

          const callback = async (response?: AxiosResponse) => {
            // console.log('RESPONSE', response?.data);
            issuanceStore.handleActionSearch('C')

            const issuedInvoiceRecords = response?.data.data.success as InvoiceRecord[] || [];
            const failedInvoiceRecords = response?.data.data.error as FAILED_INVOICE_RECORDS || [];

            const ShowResultFinalInvoiceDialog = dialog.open(ResultIssuedInvoicesModal, {
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
                viewSuccessInvoices: () => {
                  issuanceStore.handleActionPreviewIssuedInvoice(issuedInvoiceRecords, data.year, data.month)
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
                closeOnEscape: false,
              },
            })
          }

          issuanceStore.handleActionPOSTNewIssueInvoices(data, callback, () => loading.close())
        },
        reject: () => {
        }
      })
    } else {
      //
    }
  }

  return {
    selectedInvoiceRecord,

    perVerificationRunForm,

    billings,
    billings_data,
    invoice_records_data,

    handleActionIssueInvoice,
  }
})