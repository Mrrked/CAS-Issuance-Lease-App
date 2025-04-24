import { FAILED_INVOICE_RECORDS, INVOICE_PER_COMPANY_AND_PROJECT, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const ResultFinalInvoiceModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultFinalInvoiceModal.vue'));
const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModal.vue'));
const ViewScheduleBatchIssuanceModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/ViewScheduleBatchIssuanceModal.vue'));

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const toast = useToast()
  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const issuanceStore = useIssuanceStore()

  const perBatchRunForm = ref<PerBatchRunForm>({
    invoiceDate: new Date()
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return issuanceStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return issuanceStore.processInvoiceRecords(billings_data.value, perBatchRunForm.value.invoiceDate)
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

  const getCurrentYear = computed(() => {
    return new Date().getFullYear()
  })

  const getCurrentMonth = computed(() => {
    return new Date().getMonth() + 1
  })

  const getFirstBusinessDayPerMonth = computed(() => {
    let position = -1;
    const previousYear = getCurrentYear.value - 1
    const nextYear = getCurrentYear.value + 1

    return mainStore.first_business_days
      .filter((business_day) => {
        if (business_day.YEAR === previousYear) {
          if (business_day.MONTH >= 11) {
            return true
          }
          return false
        } else if (business_day.YEAR === nextYear) {
          if (business_day.MONTH <= 2) {
            return true
          }
          return false
        }
        return true
      })
      .map((business_day) => {
        let newPosition = position
        if (business_day.MONTH === getCurrentMonth.value && business_day.YEAR === getCurrentYear.value) {
          newPosition = 0
          position = 1
        }

        return {
          ...business_day,
          position: newPosition,
        }
      })
  })

  const getCurrentSchedule = computed(() => {
    return getFirstBusinessDayPerMonth.value
      .find((business_day) => business_day.position === 0)
  })

  const getNextSchedule = computed(() => {
    return getFirstBusinessDayPerMonth.value
      .find((business_day) => business_day.position === 1)
  })

  const canRunBatchIssuance = computed(() => {
    const currentDate = new Date()
    return utilStore.convertDateObjToNumberYYYYMMDD(currentDate) === getCurrentSchedule.value?.EARLIEST_CWORK_DATE
  })

  const handleActionViewMainDialog = () => {
    // console.log('OPEN INITIAL / DRAFT INVOICE RECORDS', invoice_records_data.value);
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModalFooter.vue'));
    const PerBatchRunDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
          const loading = utilStore.startLoadingModal('Generating Draft...')
          issuanceStore.handleActionGenerateDraftInvoice(SELECTED_INVOICE_RECORD, () => loading.close())
        },
        view1: () => {
          const loading = utilStore.startLoadingModal(`Generating ${invoice_records_data.value.length} Drafts...`)
          issuanceStore.handleActionGenerateDraftInvoices(invoice_records_data.value, perBatchRunForm.value.invoiceDate, () => loading.close())
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
        header: '(Batch) For Issuance of Invoice - ' + perBatchRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long' }),
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
      year: perBatchRunForm.value.invoiceDate.getFullYear(),
      month: perBatchRunForm.value.invoiceDate.getMonth() + 1,
      type: 'BATCH',
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

                        HEADER: {
                          COMPANY_NAME:   record.HEADER.COMPANY_NAME,
                          PROJECT_NAME:   record.DETAILS.PRJNAM,
                          ADDRESS:        record.HEADER.ADDRESS,
                          LOGO_URL:       record.HEADER.LOGO_URL,
                          LOGO_SIZE_INCH: record.HEADER.LOGO_SIZE_INCH,
                          INVOICE_DATE:   record.DETAILS.DATVAL
                        },

                        FOOTER: {
                          ACNUM:          record.FOOTER.ACDAT,
                          ACDAT:          record.FOOTER.ACNUM,
                          TIMSTP:         record.DETAILS.TIMSTP,
                          DATSTP:         record.DETAILS.DATSTP
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

            const header = '(Batch) Summary of Issued Invoices - ' + perBatchRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            utilStore.handleActionViewFilePDF(header, `Summary of Issued Invoices ${data.year}-${data.month}.pdf`, PDF_BLOB, null, () => {}, () => {})

            loading.close()
          },
          viewSuccessInvoices: async () => {
            const loading = utilStore.startLoadingModal(`Loading ${issuedInvoiceRecords.length} Invoices...`)

            await new Promise(resolve => setTimeout(resolve, 1000));

            const PDF_BLOB = issuanceStore.handleActionGenerateInvoicePDFBlob(issuedInvoiceRecords)

            utilStore.handleDownloadFile(PDF_BLOB, `Issued Invoices ${data.year}-${data.month}.pdf`)

            const header = '(Batch) Issued Invoices - ' + perBatchRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            utilStore.handleActionViewFilePDF(header, `Issued Invoices ${data.year}-${data.month}.pdf`, PDF_BLOB, null, () => {}, () => {})

            loading.close()
          },
          cancel: () => {
            confirm.require({
              message: `Please review the result of the batch invoice issuance. You might need to check and save the issued and/or failed invoices.`,
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

  const handleActionViewScheduleOfBatchIssuance = () => {
    dialog.open(ViewScheduleBatchIssuanceModal, {
      props: {
        header: 'Schedule For Batch Issuance of Invoice',
        style: {
          width: '40vw'
        },
        showHeader: true,
        maximizable: true,
        modal: true,
      },
    })
  }

  const handleActionAdminBatchIssuance = () => {
    utilStore.handleActionConfirmAdminPassword(ADMIN_PASSWORD, () => {
      issuanceStore.handleActionSearch(2)
    })
  }

  return {
    perBatchRunForm,
    billings,

    invoice_records_data,

    getFirstBusinessDayPerMonth,
    getCurrentSchedule,
    getNextSchedule,
    getCurrentYear,
    getCurrentMonth,

    canRunBatchIssuance,

    handleActionViewMainDialog,
    handleActionViewScheduleOfBatchIssuance,
    handleActionAdminBatchIssuance
  }
})