import { BatchPDFSavingForm, InsertDocumentDetails, InvoiceDetails, InvoicePrintStatus, InvoiceRecord } from './types';
import { computed, ref } from 'vue';

import axios from '../axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useIssuanceStore } from './useIssuanceStore';
import { useUtilitiesStore } from './useUtilitiesStore';

export const useBatchPDFSavingStore = defineStore('BatchPDFSaving', () => {

  const confirm = useConfirm()

  const utilStore = useUtilitiesStore()
  const issuanceStore = useIssuanceStore()

  const batchPDFSavingForm = ref<BatchPDFSavingForm>({
    valueDate: new Date(),
    company: null
  })

  const issuedDocuments = ref<InvoiceRecord[]>([])
  const selectedIssuedDocuments = ref<InvoiceRecord[]>([])

  const issued_documents_data = computed((): InvoiceRecord[] => {
    return issuedDocuments.value
  })

  const generateDocumentPath = (invoiceDetails: InvoiceDetails) => {

    const valueDate = invoiceDetails.DATVAL.toString();

    const year = parseInt(valueDate.substring(0, 4));
    const month = parseInt(valueDate.substring(4, 6));

    return `/CAS_DOCUMENTS/${invoiceDetails.COMPCD}/${invoiceDetails.RECTYP}/${year}/${month}/${valueDate}/${invoiceDetails.RECTYP}${invoiceDetails.ORNUM}.pdf`
  }

  const handleActionSaveSelectedInvoices = () => {
    if (selectedIssuedDocuments.value.length > 0) {
      confirm.require({
        message: 'Are you sure you want to save the selected document(s)?',
        header: 'Confirm Saving of Selected Documents PDF',
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
          const loading = utilStore.startLoadingModal('Saving invoices...')

          await new Promise(resolve => setTimeout(resolve, 1000));

          const formData = new FormData()

          const ORIGINAL_INVOICES: InvoiceRecord[] = selectedIssuedDocuments.value
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

          ORIGINAL_INVOICES.forEach((invoiceRecord) => {
            const invoicePDFData = issuanceStore.convertInvoiceRecordsToInvoicePDFs(invoiceRecord)
            const PDF_BLOB = issuanceStore.generateInvoicePDFBlob(invoicePDFData)

            formData.append(
              `files`, PDF_BLOB,
              `${invoicePDFData.header.controlNumber}.pdf`
            );

            const pdfSavingData: InsertDocumentDetails = {
              CORFXPF: {
                COMPCD: invoiceRecord.INVOICE_KEY.COMPCD,
                BRANCH: invoiceRecord.INVOICE_KEY.BRANCH,
                DEPTCD: invoiceRecord.INVOICE_KEY.DEPTCD,
                ORCOD:  invoiceRecord.INVOICE_KEY.ORCOD,
                ORNUM:  invoiceRecord.INVOICE_KEY.ORNUM,
                DATOR:  invoiceRecord.DETAILS.RUNDAT,
                DATVAL: invoiceRecord.DETAILS.DATVAL,
                ISSUE: '0',
              },
              DOCUMENT_REGISTRY: {
                DOCNUM: invoiceRecord.DETAILS.RECTYP + invoiceRecord.DETAILS.ORNUM,
                DOCPTH: generateDocumentPath(invoiceRecord.DETAILS),

                SYSVER: 'v.1.0.0',
                // GENUSR: invoiceRecord.DETAILS.RUNBY,
                GENUSR: 'IT_MARK'
              }
            }

            formData.append(
              "invoices",
              JSON.stringify(pdfSavingData)
            )
          })

          console.log(formData.values());

          axios.post(`issuance_lease/rerun_save_pdf/`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
            .then((response) => {
              console.log(response.data.data)
            })
            .catch(utilStore.handleAxiosError)
            .finally(() => {
              loading.close()
            })
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
      year: batchPDFSavingForm.value.valueDate.getFullYear(),
      month: batchPDFSavingForm.value.valueDate.getMonth() + 1,
      company: batchPDFSavingForm.value.company?.COMPCD || null,
    }

    axios.post(`issuance_lease/invoices/all/`, data)
      .then((response) => {
        console.log('ALL ISSUED DOCUMENTS FOR SAVING PDF', response.data.data);
        issuedDocuments.value = response.data.data
        issuedDocuments.value = issuedDocuments.value.filter((i) => i.ITEM_BREAKDOWNS.length > 0)
        issuedDocuments.value.forEach((invoiceRecord) => {
          console.log(invoiceRecord.ITEM_BREAKDOWNS.length);
        })
      })
      .catch(utilStore.handleAxiosError)
      .finally(() => {
        loading.close()
      })
  }

  const handleActionReset = () => {
    batchPDFSavingForm.value = {
      valueDate: new Date(),
      company: null,
    }
    issuedDocuments.value = []
    selectedIssuedDocuments.value = []
  }

  return {
    batchPDFSavingForm,

    issuedDocuments,
    selectedIssuedDocuments,

    issued_documents_data,

    handleActionSaveSelectedInvoices,
    handleActionSearch,
    handleActionReset,
  }
})