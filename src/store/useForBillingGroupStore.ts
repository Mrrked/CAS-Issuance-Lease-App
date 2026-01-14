import { FAILED_INVOICE_RECORDS, ForBillingGroupForm, ForBillingGroupOption, INVOICE_PER_COMPANY_AND_PROJECT, InvoiceDetails, InvoiceRecord, LeaseBill } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useFileStore } from './useFileStore';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const ResultIssuedInvoicesModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultIssuedInvoicesModal.vue'));
const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/ForBillingGroup/SelectedBillsTableModal.vue'));

export const useForBillingGroupStore = defineStore('ForBillingGroup', () => {

  const toast = useToast()
  const dialog = useDialog()
  const confirm = useConfirm()

  const fileStore = useFileStore()
  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const issuanceStore = useIssuanceStore()

  const BILL_TYPE_OPTIONS: ForBillingGroupOption[] = [
    { value: 'A', name: '(A) Electricity and Generator Set',  billTypes: [5, 7]},
    { value: 'B', name: '(B) Water',                          billTypes: [6]},
    { value: 'C', name: '(C) Rental and CUSA',                billTypes: [1, 4, 2, 10, 11, 41]},
    { value: 'D', name: '(D) Rental Only',                    billTypes: [1]},
    { value: 'E', name: '(E) CUSA Only',                      billTypes: [4]},
    { value: 'F', name: '(F) Penalty on Rental Only',         billTypes: [11]},
    { value: 'G', name: '(G) Penalty on CUSA Only',           billTypes: [41]},
  ]

  const forBillingGroupForm = ref<ForBillingGroupForm>({
    invoiceDate: new Date(),
    billType: { value: 'A', name: '(A) Electricity and Generator Set',  billTypes: [5, 7]},

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
    return issuanceStore.convertBillingsToInvoiceRecords(billings_data.value, forBillingGroupForm.value.invoiceDate)
      .sort((a,b) => {
        // COMPCD LOWEST TO HIGHEST
        if (a.INVOICE_KEY.COMPCD !== b.INVOICE_KEY.COMPCD) {
          return a.INVOICE_KEY.COMPCD - b.INVOICE_KEY.COMPCD;
        }

        if (a.INVOICE_KEY.BRANCH !== b.INVOICE_KEY.BRANCH) {
          return a.INVOICE_KEY.BRANCH - b.INVOICE_KEY.BRANCH;
        }

        if (a.INVOICE_KEY.DEPTCD !== b.INVOICE_KEY.DEPTCD) {
          return a.INVOICE_KEY.DEPTCD - b.INVOICE_KEY.DEPTCD;
        }

        return a.INVOICE_KEY.PROJCD.toLowerCase().localeCompare(b.INVOICE_KEY.PROJCD.toLowerCase())
      })
  })

  const isShowPBLForm = computed((): boolean => {
    return (
      ['D','E','F','G'].includes(forBillingGroupForm.value.billType.value)
    )
  })

  const getCurrentYear = computed(() => {
    return new Date().getFullYear()
  })

  const getCurrentMonth = computed(() => {
    return new Date().getMonth() + 1
  })

  const canRunIssuance = computed(() => {
    const today = forBillingGroupForm.value.invoiceDate.getDay()
    // Monday = 1, ..., Friday = 5
    return today >= 1 && today <= 5
  })

  const handleActionViewMainDialog = () => {
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModalFooter.vue'));
    const PerBatchRunDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        invoice_date: forBillingGroupForm.value.invoiceDate,
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
        header: '(Batch) For Issuance of Invoice - ' + forBillingGroupForm.value.invoiceDate.toLocaleString('en-US', { month: 'long' }),
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
      detail: 'Ongoing Issuance of Invoices',
      severity: 'info',
      life: 3000,
    })

    const loading = utilStore.startLoadingModal(`Issuing ${invoice_records_data.value.length} Invoices...`)

    const SELECTED_INVOICES: InvoiceRecord[] = [
      ...invoice_records_data.value.map((INVOICE) => {

        const currentDate = new Date()
        const stampDate = utilStore.getCurrentDateNumberYYYYMMDD(currentDate)
        const stampTime = utilStore.getCurrentTimeNumberHHMMSS(currentDate)

        const NO_OF_MONTHS = issuanceStore.getNOMOS(INVOICE, [1,4])

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
                PAYEE: INVOICE.DETAILS.CLTKEY + '/' +
                  INVOICE.PBL_KEY + '/' +
                  INVOICE.TCLTNO
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

            PRSTAT: 'P',
            PRCNT: 1,

            UPDDTE: stampDate,
            UPDTME: stampTime,
          } as InvoiceDetails,
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
          LOPHTF: {
            ...INVOICE.LOPHTF,
            DATOR: stampDate,
            DATUPD: stampDate,
            TIMUPD: stampTime,
          },
          LOPDTF: INVOICE.LOPDTF
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

    const data = {
      year: forBillingGroupForm.value.invoiceDate.getFullYear(),
      month: forBillingGroupForm.value.invoiceDate.getMonth() + 1,
      day: forBillingGroupForm.value.invoiceDate.getDate(),
      type: `From Billing Group (${forBillingGroupForm.value.billType.value})`,
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
          viewSummarySuccessInvoices: async () => {
            const loading = utilStore.startLoadingModal(`Generating Summary of Invoices Report...`)

            await new Promise(resolve => setTimeout(resolve, 1000));

            const groupedInvoiceRecords: INVOICE_PER_COMPANY_AND_PROJECT[] =
            (
              Object.values(
                issuedInvoiceRecords
                  .sort((a,b) => {
                    // COMPCD LOWEST TO HIGHEST
                    if (a.INVOICE_KEY.COMPCD !== b.INVOICE_KEY.COMPCD) {
                      return a.INVOICE_KEY.COMPCD - b.INVOICE_KEY.COMPCD;
                    }
                    return a.INVOICE_KEY.PROJCD.toLowerCase().localeCompare(b.INVOICE_KEY.PROJCD.toLowerCase())
                  })
                  .reduce((acc: any , record: InvoiceRecord) => {
                    const key = utilStore.addLeadingZeroes(record.INVOICE_KEY.COMPCD, 2) + '_' + record.INVOICE_KEY.PROJCD
                    if (!acc[key]) {
                      // console.log('NEW PAGE FOR', key, '\n');
                      acc[key] = {
                        COMPCD:           record.INVOICE_KEY.COMPCD,
                        PROJCD:           record.INVOICE_KEY.PROJCD,

                        FOOTER: {
                          ACNUM:          record.DETAILS.ACDAT,
                          ACDAT:          record.DETAILS.ACNUM,
                        },

                        INVOICE_RECORDS: [],
                      };
                    }
                    // console.log(key);
                    acc[key].INVOICE_RECORDS.push(record);
                    return acc;
                  }, {})
              ) as INVOICE_PER_COMPANY_AND_PROJECT[]
            )

            const PDF_BLOB = await issuanceStore.handleActionGenerateSummaryInvoicesPDFBlob(groupedInvoiceRecords)

            const header = '(Batch) Summary of Issued Invoices - ' + forBillingGroupForm.value.invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            fileStore.handleActionViewFilePDF(header, `Summary of Issued Invoices ${data.year}-${data.month}.pdf`, PDF_BLOB, null, () => {}, () => {})

            loading.close()
          },
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

  // watch(
  //   () => forBillingGroupForm.value.billType,
  //   () => {
  //     forBillingGroupForm.value.PBL = {
  //       pcs_code: {
  //         1: '',
  //       },
  //       phase: {
  //         1: '',
  //       },
  //       block: {
  //         1: '',
  //         2: ''
  //       },
  //       lot: {
  //         1: '',
  //         2: '',
  //         3: '',
  //         4: ''
  //       },
  //       unit_code: {
  //         1: '',
  //         2: ''
  //       },
  //     }
  //   }
  // )

  return {
    BILL_TYPE_OPTIONS,

    forBillingGroupForm,

    billings,

    invoice_records_data,

    isShowPBLForm,

    getCurrentYear,
    getCurrentMonth,

    canRunIssuance,

    handleActionViewMainDialog,
  }
})