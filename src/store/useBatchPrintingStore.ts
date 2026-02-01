import { BatchPrintingForm, BatchPrintingOption, InvoicePDF, InvoicePrintStatus, InvoiceRecord } from './types';
import { computed, ref } from 'vue';

import JSZip from 'jszip'
import axios from '../axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useFileStore } from './useFileStore';
import { useIssuanceStore } from './useIssuanceStore';
import { useUtilitiesStore } from './useUtilitiesStore';

export const useBatchPrintingStore = defineStore('BatchPrinting', () => {

  const confirm = useConfirm()

  const fileStore = useFileStore()
  const utilStore = useUtilitiesStore()
  const issuanceStore = useIssuanceStore()

  const GROUP_OPTIONS: BatchPrintingOption[] = [
    'All',
    'Billing Group',
    'Recording Group'
  ]

  const batchPrintingForm = ref<BatchPrintingForm>({
    company: null,
    group: 'All'
  })

  const issuedDocuments = ref<InvoiceRecord[]>([])
  const selectedIssuedDocuments = ref<InvoiceRecord[]>([])

  const issued_documents_data = computed((): InvoiceRecord[] => {
    return issuedDocuments.value
  })

  const handleActionPrintSelectedInvoices = () => {
    if (selectedIssuedDocuments.value.length > 0) {
      confirm.require({
        message: 'Are you sure you want to print the selected document(s)?',
        header: 'Confirm Printing of Selected Documents',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
          label: 'Cancel',
          severity: 'secondary',
          outlined: true
        },
        acceptProps: {
          label: 'Confirm'
        },
        accept: async() => {
          const loading = utilStore.startLoadingModal('Printing...')

          await new Promise(resolve => setTimeout(resolve, 1000));

          const currentDate = new Date()
          const stampDate = utilStore.getCurrentDateNumberYYYYMMDD(currentDate)
          const stampTime = utilStore.getCurrentTimeNumberHHMMSS(currentDate)

          const ORIGINAL_ISSUED_DOCUMENTS: InvoiceRecord[] = selectedIssuedDocuments.value
            .map((selected) => {
              return {
                ...selected,
                DETAILS: {
                  ...selected.DETAILS,
                  PRSTAT: 'P' as InvoicePrintStatus,
                  PRCNT: 1,
                }
              }
            })
            .sort((a, b) => {
              const rectypCompare = a.DETAILS.RECTYP.localeCompare(b.DETAILS.RECTYP);
              if (rectypCompare !== 0) return rectypCompare;
              return a.DETAILS.ORNUM.localeCompare(b.DETAILS.ORNUM);
            });

          const invoicePDFDataS: InvoicePDF[] = ORIGINAL_ISSUED_DOCUMENTS.map((invoiceRecord) => issuanceStore.convertInvoiceRecordsToInvoicePDFs(invoiceRecord))
          const PDF_BLOBS = invoicePDFDataS.map((invoicePDFData) => issuanceStore.generateInvoicePDFBlob(invoicePDFData))
          const PDF_BLOB = await fileStore.mergePDFBlobs(PDF_BLOBS)

          const header = '(REPRINT) ' + (batchPrintingForm.value.group) + ( batchPrintingForm.value.company ? ` - ${batchPrintingForm.value.company.COINIT}` : '' )
          const name = '(REPRINT) ' + (batchPrintingForm.value.group) + ( batchPrintingForm.value.company ? ` - ${batchPrintingForm.value.company.COINIT}` : '' ) + ` - ${stampDate}-${stampTime}`

          fileStore.handleActionViewFilePDF(
            header,
            `${name}.pdf`,
            PDF_BLOB,
            null,
            () => {},
            () => {}
          )
          fileStore.handleActionDownloadFileBlob(
            PDF_BLOB,
            `${name}.pdf`
          )

          // 4. ZIP individual invoices ✅
          const zip = new JSZip()

          invoicePDFDataS.forEach((invoicePDFData, index) => {
            const fileName =
              `${invoicePDFData.header.dateValue.replace(/\//g, '-')} ` +
              `${invoicePDFData.header.clientKey.slice(0, 4)}` +
              `${invoicePDFData.header.unit} - ` +
              `${invoicePDFData.header.controlNumber}.pdf`

            zip.file(fileName, PDF_BLOBS[index])
          })

          // 5. Generate ZIP blob
          const ZIP_BLOB = await zip.generateAsync({ type: 'blob' })

          // 6. Download ZIP (single browser download → no limit)
          fileStore.handleActionDownloadFileBlob(
            ZIP_BLOB,
            `${name} (Individual).zip`
          )

          loading.close()
        },
        reject: () => {
        }
      });
    }
  }

  const handleActionSearch = () => {
    issuedDocuments.value = []
    selectedIssuedDocuments.value = []

    const loading = utilStore.startLoadingModal('Fetching invoices...')

    const data = {
      group: batchPrintingForm.value.group,
      company: batchPrintingForm.value.company?.COMPCD || null,
    }

    axios.post(`issuance_lease/batch_reprint/`, data)
      .then((response) => {
        // console.log('ISSUED DOCUMENTS FOR REPRINTING ', response.data.data);
        issuedDocuments.value = response.data.data
      })
      .catch(utilStore.handleAxiosError)
      .finally(() => {
        loading.close()
      })
  }

  const handleActionReset = () => {
    batchPrintingForm.value = {
      company: null,
      group: 'All'
    }
    issuedDocuments.value = []
    selectedIssuedDocuments.value = []
  }

  return {
    GROUP_OPTIONS,

    batchPrintingForm,

    issuedDocuments,
    selectedIssuedDocuments,

    issued_documents_data,

    handleActionPrintSelectedInvoices,
    handleActionSearch,
    handleActionReset,
  }
})