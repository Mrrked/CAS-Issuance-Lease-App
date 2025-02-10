import { Column, FAILED_INVOICE_RECORDS, INVOICE_PER_COMPANY_AND_PROJECT, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const PreviewPDFModal = defineAsyncComponent(() => import('../components/Dialog/General/PreviewPDFModal.vue'));
const ResultFinalInvoiceModal = defineAsyncComponent(() => import('../components/Dialog/General/ResultFinalInvoiceModal.vue'));
const SelectedBillsTableModal = defineAsyncComponent(() => import('../components/Dialog/PerBatch/SelectedBillsTableModal.vue'));

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const toast = useToast()
  const dialog = useDialog();
  const confirm = useConfirm();

  const issuanceStore = useIssuanceStore()
  const utilStore = useUtilitiesStore()

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
          const loading = utilStore.startLoadingModal('Generating Draft...')
          issuanceStore.handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD, () => loading.close())
        },
        view1: () => {
          const loading = utilStore.startLoadingModal(`Generating ${invoice_records_data.value.length} Drafts...`)
          issuanceStore.handleGenerateDraftInvoices(invoice_records_data.value, perBatchRunForm.value.invoiceDate, () => loading.close())
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
        header: '(Per Batch) For Issuance of Invoice - ' + perBatchRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long' }),
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

    issuanceStore.allowReloadExitPage = false;

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
            DATPRT: stampDate,
            NOMOS: NO_OF_MONTHS,
          },
          CORTPF: {
            ...INVOICE.CORTPF,

            NOMOS: NO_OF_MONTHS,
          },
        }
      })
    ]

    const data = {
      year: perBatchRunForm.value.invoiceDate.getFullYear(),
      month: perBatchRunForm.value.invoiceDate.getMonth() + 1,
      type: 'BATCH',
      invoices: SELECTED_INVOICES,
    }

    const callback = async (response?: AxiosResponse) => {
      console.log('RESPONSE', response?.data);

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

            const PDF_BLOB1 = await issuanceStore.handleGenerateSummaryInvoicesPDFBlob(groupedInvoiceRecords) ;

            const Footer1 = defineAsyncComponent(() => import('../components/Dialog/General/SummaryFinalInvoiceModalFooter.vue'));
            const ShowSummaryIssuedInvoices = dialog.open(PreviewPDFModal, {
              data: {
                pdfBlob: PDF_BLOB1,
                download: () => {
                  utilStore.handleDownloadFile(PDF_BLOB1, `Summary of Issued Invoices ${data.year}-${data.month}.pdf`)
                },
                submit: () => {
                },
                cancel: () => {
                  ShowSummaryIssuedInvoices.close()
                }
              },
              props: {
                header: '(Per Batch) Summary of Issued Invoices - ' + perBatchRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                style: {
                  width: '75vw'
                },
                showHeader: true,
                modal: true,
              },
              templates: {
                footer: markRaw(Footer1)
              },
            })

            loading.close()
          },
          viewSuccessInvoices: async () => {
            const loading = utilStore.startLoadingModal(`Loading ${issuedInvoiceRecords.length} Invoices...`)

            await new Promise(resolve => setTimeout(resolve, 1000));

            const PDF_BLOB = issuanceStore.handleGenerateInvoicePDFBlob(issuedInvoiceRecords)

            utilStore.handleDownloadFile(PDF_BLOB, `Issued Invoices ${data.year}-${data.month}.pdf`)

            const Footer = defineAsyncComponent(() => import('../components/Dialog/General/FinalInvoiceModalFooter.vue'));
            const ShowIssuedInvoices = dialog.open(PreviewPDFModal, {
              data: {
                pdfBlob: PDF_BLOB,
                download: () => {
                  utilStore.handleDownloadFile(PDF_BLOB, `Issued Invoices ${data.year}-${data.month}.pdf`)
                },
                submit: () => {
                },
                cancel: () => {
                  ShowIssuedInvoices.close()
                }
              },
              props: {
                header: '(Per Batch) Issued Invoices - ' + perBatchRunForm.value.invoiceDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
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
                issuanceStore.allowReloadExitPage = true;
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

    issuanceStore.handleExecuteIssueFinalInvoices(data, callback, () => loading.close())
  }

  return {
    perBatchRunForm,
    billings,

    invoice_records_data,

    handleOpenMainDialogBox,
  }
})