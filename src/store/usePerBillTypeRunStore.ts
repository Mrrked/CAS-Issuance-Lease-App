import { FAILED_INVOICE_RECORDS, InvoicePrintStatus, InvoiceRecord, LeaseBill, PerBillTypeOption, PerBillTypeRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref, watch } from 'vue';

import { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const ResultIssuedInvoicesModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultIssuedInvoicesModal.vue'));
const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModal.vue'));

export const usePerBillTypeRunStore = defineStore('1_PerBillTypeRun', () => {

  const toast = useToast();
  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore();
  const utilStore = useUtilitiesStore();
  const issuanceStore = useIssuanceStore();

  const BILL_TYPE_OPTIONS: {value: 'A' | 'B' | 'C', name: PerBillTypeOption}[] = [
    { value: 'B', name: 'Electricity and Generator Set' },
    { value: 'C', name: 'Water' },
  ]

  const perBillTypeRunForm = ref<PerBillTypeRunForm>({
    invoiceDate: new Date(),
    billType: 'B',

    projectCode: null,
    PBL: {
      pcs_code: {
        1: '',
      },
      phase: {
        1: '',
      },
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
    return issuanceStore.convertBillingsToInvoiceRecords(billings_data.value, perBillTypeRunForm.value.invoiceDate)
  })

  const isShowPBLForm = computed((): boolean => {
    return perBillTypeRunForm.value.billType === 'A'
  })

  const canRunSingleIssuance = computed(() => {
    const today = perBillTypeRunForm.value.invoiceDate.getDay()
    // Monday = 1, ..., Friday = 5
    return today >= 1 && today <= 5
  })

  const handleActionViewMainDialog = () => {
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModalFooter.vue'));
    const PerBillTypeRunDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        invoice_date: perBillTypeRunForm.value.invoiceDate,
        table_data : invoice_records_data.value,
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
              handleActionIssueInvoices()
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

  const handleActionIssueInvoices = async () => {

    mainStore.allowReloadExitPage = false;

    toast.add({
      summary: 'Please do not close this tab!',
      detail: 'Ongoing Batch Issuance of Invoices',
      severity: 'info',
      life: 3000,
    })

    const loading = utilStore.startLoadingModal(`Issuing ${invoice_records_data.value.length} Invoices...`)

    const SELECTED_INVOICES: InvoiceRecord[] = [
      ...invoice_records_data.value.map((INVOICE) => {

        const currentDate = new Date()
        const stampDate = utilStore.getCurrentDateNumberYYYYMMDD(currentDate)
        const stampTime = utilStore.getCurrentTimeNumberHHMMSS(currentDate)

        const NO_OF_MONTHS = issuanceStore.getNOMOS(INVOICE, [5,6,7])

        var entry = INVOICE.ENTRY || undefined
        const invoice_date = INVOICE.CORFPF.DATVAL

        if (entry) {
          entry = {
            ...entry,
            GFL1PF: {
              ...entry.GFL1PF,
                DATTRN: invoice_date,
                DATECR: invoice_date,
                PAYCOD: '8888',
                PAYEE:  'N.A.',
            },
            GFL2PF: entry.GFL2PF.map((acc_entry) => {
              return {
                ...acc_entry,
                DATTRN: invoice_date
              }
            })
          }
        }

        return {
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
          ENTRY: entry
        }
      })
    ]

    // console.log("FOR ISSUANCE", SELECTED_INVOICES);

    var type = ''

    const billType = BILL_TYPE_OPTIONS.find(type => type.value === perBillTypeRunForm.value.billType)
    if (billType && billType.value !== 'A') {
      type = `Bill Group ${billType.name} for ${perBillTypeRunForm.value.projectCode?.PROJCD}`
    } else if (billType && billType.value === 'A'){
      const form = perBillTypeRunForm.value.PBL
      const pbl = `${perBillTypeRunForm.value.projectCode?.PROJCD || '   '}${form.pcs_code['1'] || ' '}${form.phase['1'] || ' '}${form.block['1'] || ' '}${form.block['2'] || ' '}${form.lot['1'] || ' '}${form.lot['2'] || ' '}${form.lot['3'] || ' '}${form.lot['4'] || ' '}${form.unit_code['1'] || ' '}${form.unit_code['2'] || ' '}`.toUpperCase()
      type = `Bill Group ${billType.name} for ${pbl}`
    }

    const data = {
      year: perBillTypeRunForm.value.invoiceDate.getFullYear(),
      month: perBillTypeRunForm.value.invoiceDate.getMonth() + 1,
      day: perBillTypeRunForm.value.invoiceDate.getDate(),
      type: type,
      invoices: SELECTED_INVOICES as InvoiceRecord[],
    }

    const callback = async (response?: AxiosResponse) => {
      // console.log('RESPONSE', response?.data);

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
  }

  watch(
    () => perBillTypeRunForm.value.billType,
    () => {
      perBillTypeRunForm.value.PBL = {
        pcs_code: {
          1: '',
        },
        phase: {
          1: '',
        },
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
        },
      }
    }
  )

  return {
    BILL_TYPE_OPTIONS,

    perBillTypeRunForm,

    billings,
    billings_data,
    invoice_records_data,

    isShowPBLForm,

    canRunSingleIssuance,

    handleActionViewMainDialog,
  }
})