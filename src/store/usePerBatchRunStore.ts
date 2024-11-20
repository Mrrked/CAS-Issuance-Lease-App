import { Column, GROUPED_INVOICE_RECORD, INVOICE_PER_PROJECT, InvoiceRecord, LeaseBill, PerBatchRunForm } from './types';
import { computed, defineAsyncComponent, markRaw, ref } from 'vue';

import { AxiosResponse } from 'axios';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue'
import PreviewPDFModal from '../components/Dialog/General/PreviewPDFModal.vue';
import SelectedBillsTableModal from '../components/Dialog/PerMonthYear/SelectedBillsTableModal.vue';
import { defineStore } from 'pinia';
import jsPDF from 'jspdf';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useMainStore } from './useMainStore';

export const usePerBatchRunStore = defineStore('2_PerBatchRun', () => {

  const dialog = useDialog();
  const confirm = useConfirm();

  const mainStore = useMainStore()

  const perBatchRunForm = ref<PerBatchRunForm>({
    invoiceDate: new Date()
  })

  const billings = ref<LeaseBill[]>([])

  const billings_data = computed(():LeaseBill[] => {
    return mainStore.processBillings(billings.value)
  })

  const invoice_records_data = computed((): InvoiceRecord[] => {
    return mainStore.processInvoiceRecords(billings_data.value, perBatchRunForm.value.invoiceDate)
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
    const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SelectedBillsTableModalFooter.vue'));
    const PerMonthYearDialog = dialog.open(SelectedBillsTableModal, {
      data: {
        table_data : invoice_records_data.value,
        table_column: invoice_records_column.value,
        view: (SELECTED_INVOICE_RECORD: InvoiceRecord) => {
          mainStore.handleGenerateDraftInvoice(SELECTED_INVOICE_RECORD)
        },
        submit: () => {
          confirm.require({
            message: `The ${invoice_records_data.value.length} invoices will be final once issued.\n Are you sure you want to continue in generating the invoices?`,
            header: 'Confirm Issuance of Invoice (FINAL) ?',
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
            },
            reject: () => {
            }
          });
        },
        cancel: () => {
          PerMonthYearDialog.close()
        }
      },
      props: {
        header: 'For Issuance of Invoice (Per Batch)' ,
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

  const handleGeneratePDFBlob_SummaryOfIssuedInvoicesPage = (groupedInvoiceRecords: GROUPED_INVOICE_RECORD[]): Blob => {

    var doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'letter'
    })

    return doc.output('blob')
  }

  const handleExecuteIssueFinalInvoices = async () => {

    const SELECTED_INVOICES = invoice_records_data.value

    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label: `Generating ${SELECTED_INVOICES.length} Invoices...`
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      }
    })

    const data = {
      type: 'BATCH',
      invoices: SELECTED_INVOICES,
    }

    const callback = async (response: AxiosResponse) => {
      console.log('RESPONSE', response.data);

      const issuedInvoiceRecords = response.data as InvoiceRecord[];

      // 1 GENERATE ARRAY OF ARRAY OF OBJECT THAT CONTAINS THE ARRAY OF INVOICE RECORDS
      const groupedInvoiceRecords: GROUPED_INVOICE_RECORD[] =
        (
          Object.values(
            issuedInvoiceRecords
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
              .reduce((acc: any , record: InvoiceRecord) => {
                const key = record.INVOICE_KEY.INVOICE_NUMBER.substring(0, 7)

                if (!acc[key]) {
                  console.log()
                  console.log('NEW PAGE FOR', key, '\n');
                  acc[key] = {
                    COMPCD: record.INVOICE_KEY.COMPCD,
                    BRANCH: record.INVOICE_KEY.BRANCH,
                    DEPTCD: record.INVOICE_KEY.DEPTCD,

                    INVOICE_RECORDS: [],
                    INVOICE_RECORDS_PER_PROJECT: []
                  };
                }

                console.log(key + '-' + record.INVOICE_KEY.PROJCD);
                acc[key].INVOICE_RECORDS.push(record);

                return acc;
              }, {})
          ) as GROUPED_INVOICE_RECORD[]
        )
        .map((grouped_record) => {
          const invoiceRecordPerProject: INVOICE_PER_PROJECT[] =
            Object.values(
              grouped_record.INVOICE_RECORDS
                .reduce((acc: any , record: InvoiceRecord) => {
                  if (!acc[record.INVOICE_KEY.PROJCD]) {
                    acc[record.INVOICE_KEY.PROJCD] = {
                      PROJCD: record.INVOICE_KEY.PROJCD,
                      PROJECT_NAME: record.DETAILS.PRJNAM,
                      INVOICE_RECORDS: []
                    };
                  }

                  acc[record.INVOICE_KEY.PROJCD].INVOICE_RECORDS.push(record);

                  return acc;
                }, {})
            )

          console.log('PER PROJECT', grouped_record.COMPCD, grouped_record.BRANCH, grouped_record.DEPTCD, invoiceRecordPerProject);

          return {
            ...grouped_record,
            INVOICE_RECORDS_PER_PROJECT: invoiceRecordPerProject
          }
        })

      console.log('GROUPED', groupedInvoiceRecords);

      // 2 GENERATE PDF for Summary of Issuance
      const PDF_BLOB = handleGeneratePDFBlob_SummaryOfIssuedInvoicesPage(groupedInvoiceRecords)

      // 3 Show it in a Dialog
      const Footer = defineAsyncComponent(() => import('../components/Dialog/PerMonthYear/SummaryOfIssuanceModalFooter.vue'));
      const ShowSummaryOfIssuedInvoices = dialog.open(PreviewPDFModal, {
        data: {
          pdfBlob: PDF_BLOB,
          exportToXLSX: () => {
          },
          download: () => {
            const url = URL.createObjectURL(PDF_BLOB);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Summary of Issued Invoices.pdf';
            a.click();
            URL.revokeObjectURL(url);
          },
          submit: () => {
          },
          cancel: () => {
            ShowSummaryOfIssuedInvoices.close()
          }
        },
        props: {
          header: 'Summary of Issued Invoices',
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