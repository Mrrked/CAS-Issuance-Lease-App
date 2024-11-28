import { Column, FAILED_INVOICE_RECORDS, INVOICE_PER_COMPANY_AND_PROJECT, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import PreviewPDFModal from '../components/Dialog/General/PreviewPDFModal.vue';
import SelectedBillsTableModal from '../components/Dialog/PerBatch/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import { useConfigStore } from './useConfigStore';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useMainStore } from './useMainStore';
import { useToast } from 'primevue/usetoast';

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const toast = useToast()
  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore()
  const configStore = useConfigStore()

  const perBatchRunForm = ref<PerBatchRunForm>({
    invoiceDate: new Date()
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return mainStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return mainStore.processInvoiceRecords(billings_data.value, perBatchRunForm.value.invoiceDate)
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
          const loadingDialogRef = dialog.open(LoadingModal, {
            data: {
              label: 'Generating Draft...'
            },
            props: {
              style: {
                paddingTop: '1.5rem',
              },
              showHeader: false,
              modal: true
            },
          })

          mainStore.handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD, () => loadingDialogRef.close())
        },
        view1: () => {
          const loadingDialogRef = dialog.open(LoadingModal, {
            data: {
              label: `Generating ${invoice_records_data.value.length} Drafts...`
            },
            props: {
              style: {
                paddingTop: '1.5rem',
              },
              showHeader: false,
              modal: true
            },
          })

          mainStore.handleGenerateDraftInvoices(invoice_records_data.value, perBatchRunForm.value.invoiceDate, () => loadingDialogRef.close())
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
        header: '(Per Batch) For Issuance of Invoice' ,
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

    toast.add({
      summary: 'Please do not close this tab!',
      detail: 'Ongoing Batch Issuance of Invoices',
      severity: 'info',
      life: 3000,
    })

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${invoice_records_data.value.length} Invoices...`
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      },
    })

    const SELECTED_INVOICES = [
      ...invoice_records_data.value.map((INVOICE) => {

        const currentDate = new Date()
        const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
        const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

        const NO_OF_MONTHS = mainStore.getNOMOS(INVOICE, [1, 11])

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
      // console.log('RESPONSE', response.data);

      const issuedInvoiceRecords = response?.data.success as InvoiceRecord[] || [];
      const failedInvoiceRecords = response?.data.error as FAILED_INVOICE_RECORDS || [];

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
              const key = configStore.fillNumberWithZeroes(record.INVOICE_KEY.COMPCD, 2) + '_' + record.INVOICE_KEY.PROJCD
              if (!acc[key]) {
                // console.log('NEW PAGE FOR', key, '\n');
                acc[key] = {
                  COMPCD: record.INVOICE_KEY.COMPCD,
                  PROJCD: record.INVOICE_KEY.PROJCD,
                  COMPANY_NAME: record.HEADER.COMPANY_NAME,
                  PROJECT_NAME: record.DETAILS.PRJNAM,

                  INVOICE_RECORDS: [],
                };
              }
              // console.log(key);
              acc[key].INVOICE_RECORDS.push(record);
              return acc;
            }, {})
        ) as INVOICE_PER_COMPANY_AND_PROJECT[]
      )

      console.log('GROUPED FOR SUMMARY', groupedInvoiceRecords);

      console.log('FAILED ISSUED INVOICE RECORDS', failedInvoiceRecords);

      const PDF_BLOB = mainStore.handleGenerateInvoicePDFBlob(issuedInvoiceRecords)

      configStore.handleDownloadFile(PDF_BLOB, `Issued Invoices ${data.year}-${data.month}.pdf`)

      const Footer = defineAsyncComponent(() => import('../components/Dialog/General/FinalInvoiceModalFooter.vue'));
      const ShowIssuedInvoices = dialog.open(PreviewPDFModal, {
        data: {
          pdfBlob: PDF_BLOB,
          failedInvoiceRecords: failedInvoiceRecords,
          download: () => {
            configStore.handleDownloadFile(PDF_BLOB, `Issued Invoices ${data.year}-${data.month}.pdf`)
          },
          downloadErrorLogs: () => {
            const JSON_BLOB = new Blob(
              [JSON.stringify(failedInvoiceRecords, null, 2)],
              { type: 'application/json' }
            );
            const url = URL.createObjectURL(JSON_BLOB);
            const a = document.createElement('a');
            a.href = url;
            a.download = `errors_invoice_issuance_${failedInvoiceRecords.timestamp}.json`;
            a.click();
            URL.revokeObjectURL(url);
          },
          viewSummary: () => {
            const PDF_BLOB = mainStore.handleGenerateSummaryInvoicesPDFBlob(groupedInvoiceRecords);

            const Footer1 = defineAsyncComponent(() => import('../components/Dialog/General/FinalInvoiceModalFooter.vue'));
            const ShowSummaryIssuedInvoices = dialog.open(PreviewPDFModal, {
              data: {
                pdfBlob: PDF_BLOB,
                download: configStore.handleDownloadFile(PDF_BLOB, `Summary of Issued Invoices ${data.year}-${data.month}.pdf`),
                submit: () => {
                },
                cancel: () => {
                  ShowSummaryIssuedInvoices.close()
                }
              },
              props: {
                header: '(Per Batch) Summary of Issued Invoices',
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
          },
          submit: () => {
          },
          cancel: () => {
            ShowIssuedInvoices.close()
          }
        },
        props: {
          header: '(Per Batch) Issued Invoices',
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
    }

    mainStore.handleExecuteIssueFinalInvoices(data, callback, () => loadingDialogRef.close())
  }

  return {
    perBatchRunForm,
    billings,

    invoice_records_data,

    handleOpenMainDialogBox,
  }
})