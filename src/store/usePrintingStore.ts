import { CheckDetails, Client, ClientForm, GenHeader, HistoryOfPayment, InquiryType, InvoicePDF, InvoicePrintStatus, InvoiceRecord, LeaseHeader, LedgerRemark, Unit, UnitForm } from './types';
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';

import axios from '../axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useFileStore } from './useFileStore';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useSessionStore } from './useSessionStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const CheckDetailsModal = defineAsyncComponent(() => import('../components/Dialog/Printing/CheckDetailsModal.vue'));
const HistoryOfPaymentsTableModal = defineAsyncComponent(() => import('../components/Dialog/Printing/HistoryOfPaymentsTableModal.vue'));
const InvoiceReceiptDetailsModal = defineAsyncComponent(() => import('../components/Dialog/Printing/InvoiceReceiptDetailsModal.vue'));
const LeaseBillTypesTableModal = defineAsyncComponent(() => import('../components/Dialog/Printing/LeaseBillTypesTableModal.vue'));
const RemarksTableModal = defineAsyncComponent(() => import('../components/Dialog/Printing/RemarksTableModal.vue'));

export const usePrintingStore = defineStore('print', () => {

  interface ClientUnit extends Client, Unit {
    PBL_KEY: string
    PBL_KEY_RAW: string
    CLIENT_KEY: string
    CLIENT_KEY_RAW: string
    CLIENT_NAME: string

    genHeader: GenHeader
    leaseHeader: LeaseHeader
    remarks: LedgerRemark[]
    historyOfPayments: HistoryOfPayment[]
    historyOfIssuedDocuments: InvoiceRecord[]
  }

  const toast = useToast();
  const dialog = useDialog();
  const confirm = useConfirm()

  const fileStore = useFileStore()
  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()
  const issuanceStore = useIssuanceStore()

  const INQUIRY_TYPES = ref([
    {
      value: 'Unit',
      label: "By Project | Block | Lot"
    },
    {
      value: 'Client Name',
      label: "By Client's Name",
    }
  ])

  const DOCUMENT_STATUSES = [
    { value: 'D', name: 'DELETED'},
    { value: 'C', name: 'CANCELLED'}
  ]

  const PRINT_STATUSES = [
    { value: 'P', name: 'PRINTED'},
    { value: 'R', name: 'REPRINTED'}
  ]

  const stepperPage = ref<number>(1)
  const selectedInquiryType = ref<InquiryType | null>('Unit')

  const clients = ref<Client[]>([]);
  const units = ref<Unit[]>([]);

  const selectedUnit = ref<ClientUnit>()
  const selectedHistoryOfIssuedDocument = ref<InvoiceRecord[]>([])

  const queryUnitForm = ref<UnitForm>({
    project_code: null,
    pcs_code: {
      1: '',
    },
    phase: {
      1: '',
    },
    block: {
      1: '',
      2: '',
    },
    lot: {
      1: '',
      2: '',
      3: '',
      4: '',
    },
    unit_code: {
      1: '',
      2: '',
    },
  })

  const queryClientForm = ref<ClientForm>({
    name: ''
  })

  const clients_data = computed(() => {
    return clients.value
  })

  const units_data = computed(() => {
    return units.value
  })

  const isMainScreen = computed(() => {
    return stepperPage.value === 4
  })

  const showStepper = computed(() => {
    return selectedInquiryType.value !== null &&
      selectedInquiryType.value === 'Client Name' &&
      !isMainScreen.value
  })

  const handleActionSearch = () => {
    const validateQueryUnitForm = () => {
      const validate1 = queryUnitForm.value.project_code?.PROJCD
      const validate2 = (
        queryUnitForm.value.pcs_code['1']  ||
        queryUnitForm.value.phase['1']     ||
        queryUnitForm.value.block['1']     ||
        queryUnitForm.value.block['2']     ||
        queryUnitForm.value.lot['1']       ||
        queryUnitForm.value.lot['2']       ||
        queryUnitForm.value.lot['3']       ||
        queryUnitForm.value.lot['4']       ||
        queryUnitForm.value.unit_code['1'] ||
        queryUnitForm.value.unit_code['2']
      )
      if (!validate1) {
        toast.add({
          severity: 'warn',
          summary: 'Error: Invalid Project',
          detail: 'Unable to recognize the selected project. Please check.',
          life: 3000
        });
        return false
      }
      if (!validate2) {
        toast.add({
          severity: 'warn',
          summary: 'Error: Missing Unit Identifiers',
          detail: 'No PCS Code, Phase, Block, Lot or Unit Code was entered. Please check.',
          life: 3000
        });
        return false
      }

      return validate1 && validate2
    }

    const validateQueryClientForm = () => {
      const validate = queryClientForm.value.name
      if (!validate) {
        toast.add({
          severity: 'warn',
          summary: 'Error: Missing Client Name',
          detail: 'Please enter a partial or full client name before proceeding!',
          life: 3000
        });
        return false
      }

      return validate
    }

    switch (selectedInquiryType.value) {
      // BY PBL
      case 'Unit':
        if (validateQueryUnitForm()) {
          handleActionOpenUnit()
        }
        break;

      // BY CLIENTS NAME
      case 'Client Name':
        if (validateQueryClientForm()) {
          const loading = utilStore.startLoadingModal('Searching Client ...')

          const name = queryClientForm.value.name.toUpperCase()

          axios.get(`general/client/${name}`)
          .then((response) => {
            // console.log('RESPONSE ', response);
            clients.value = response.data.data
            stepperPage.value = 2
          })
          .catch(utilStore.handleAxiosError)
          .finally(() => {
            loading.close()
          })
        }
        break;
    }
  }

  const handleActionReturnInquiryForm = () => {
    stepperPage.value = 1
    clients.value = []
    units.value = []
  }

  const handleActionReturnClientSelection = () => {
    stepperPage.value = 2
    units.value = []
  }

  const handleActionReturnUnitSelection = () => {
    stepperPage.value = 3
  }

  const handleActionReset = () => {
    units.value = []
    clients.value = []
    selectedUnit.value = undefined

    queryClientForm.value = {
      name: '',
    }

    queryUnitForm.value = {
      project_code: null,
      pcs_code: {
        1: ''
      },
      phase: {
        1: ''
      },
      block: {
        1: '',
        2: '',
      },
      lot: {
        1: '',
        2: '',
        3: '',
        4: '',
      },
      unit_code: {
        1: '',
        2: '',
      },
    }

    stepperPage.value = 1
  }

  const handleActionSearchClientUnits = (CACCT: string) => {
    const loading = utilStore.startLoadingModal('Searching Client\s Units ...')

    axios.get(`general/client/${CACCT}/unit`)
    .then((response) => {
      // console.log('RESPONSE ', response);
      units.value = response.data.data
      stepperPage.value = 3
    })
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      loading.close()
    })
  }

  const handleActionSelectUnit = (data: Unit) => {
    if (data) {
      handleActionOpenUnit(data)
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Error',
        detail: 'Failed to select unit!',
        life: 3000
      });
    }
  }

  const getPBL = computed((): string => {
    if (selectedInquiryType.value === 'Unit') {
      return `${queryUnitForm.value.project_code?.PROJCD || '   '}${queryUnitForm.value.pcs_code['1'] || ' '}${queryUnitForm.value.phase['1'] || ' '}${queryUnitForm.value.block['1'] || ' '}${queryUnitForm.value.block['2'] || ' '}${queryUnitForm.value.lot['1'] || ' '}${queryUnitForm.value.lot['2'] || ' '}${queryUnitForm.value.lot['3'] || ' '}${queryUnitForm.value.lot['4'] || ' '}${queryUnitForm.value.unit_code['1'] || ' '}${queryUnitForm.value.unit_code['2'] || ' '}`.toUpperCase()
    } else if (selectedInquiryType.value === 'Client Name') {
      return `${selectedUnit.value?.PROJCD || '   '}${selectedUnit.value?.PCSCOD || ' '}${selectedUnit.value?.PHASE || ' '}${selectedUnit.value?.BLOCK || '  '}${selectedUnit.value?.LOT || '    '}${selectedUnit.value?.UNITCD || '  '}`
    }
    return ''
  })

  const handleActionOpenUnit = (unit?: Unit) => {
    let pos: number = 1;
    let pbl: string = getPBL.value

    if (selectedInquiryType.value === 'Unit') {
      pos = 2
    } else if(unit) {
      pos = 4
    }

    const loading = utilStore.startLoadingModal('Fetching Unit ...')

    axios.get(`issuance_lease/lease_unit/${pbl}/`)
    .then((response) => {
      selectedUnit.value = response.data.data
      // console.log(selectedUnit.value);
      stepperPage.value = pos
    })
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      loading.close()
    })
  }

  // LEASE

  const getSelectedClientUnit = computed(() => {

    return {
      pbl:                      selectedUnit.value?.PBL_KEY || "-",
      client_name:              selectedUnit.value?.CLIENT_NAME || "-",
      client_key:               selectedUnit.value?.CLIENT_KEY || "-",
      client_key_temp_number:   `${selectedUnit.value?.CLIENT_KEY || "-"} / ${selectedUnit.value?.TCLTNO || ''}`,
      tcltno:                   selectedUnit.value?.TCLTNO || '-',
      tin:                      selectedUnit.value?.TAN1 || '-',
      company_code:             `${utilStore.addLeadingZeroes(selectedUnit.value?.COMPCD || 0, 2)} / ${mainStore.company_codes.find((code) => code.COMPCD === selectedUnit.value?.COMPCD)?.COINIT || ''  }`,

      lease_type:               selectedUnit.value?.leaseHeader ? selectedUnit.value?.leaseHeader.REGTYP : '-',
      sale_type:                selectedUnit.value?.leaseHeader ? selectedUnit.value?.leaseHeader.SALTYP : '-',
    }
  })

  const history_of_payments_data = computed((): HistoryOfPayment[] => {
    return selectedUnit.value?.historyOfPayments
      .sort((a,b) => {
        const dateComparison = b.DATVAL - a.DATVAL;
        const payTypeComparison = a.PAYTYP.localeCompare(b.PAYTYP)
        const orKeyComparison = b.OR_KEY.localeCompare(a.OR_KEY)

        if (dateComparison === 0) {
          if (payTypeComparison === 0) {
            return orKeyComparison;
          }
          return payTypeComparison;
        }
        return dateComparison
      }) as HistoryOfPayment[]
  })

  const remarks_data = computed((): LedgerRemark[] => {
    return selectedUnit.value?.remarks || []
  })

  const history_of_issued_documents_data = computed(():InvoiceRecord[] => {
    return selectedUnit.value?.historyOfIssuedDocuments
      .map((invoice) => {

        return {
          ...invoice,
          TCLTNO: selectedUnit.value?.TCLTNO || 0,

          EXTRA: {
            TIMESTAMP_PRINT: invoice.DETAILS.RUNDAT ? `${ invoice.DETAILS.RUNDAT ? utilStore.formatDateNumberToStringYYYYMMDD(invoice.DETAILS.RUNDAT) : '-' } ${ invoice.DETAILS.RUNTME ? utilStore.formatTimeNumberToString12H(invoice.DETAILS.RUNTME) : '-' }` : '-',
            TIMESTAMP_REPRINT: invoice.DETAILS.RPDATE ? `${ invoice.DETAILS.RPDATE ? utilStore.formatDateNumberToStringYYYYMMDD(invoice.DETAILS.RPDATE) : '-' } ${ invoice.DETAILS.RPTIME ? utilStore.formatTimeNumberToString12H(invoice.DETAILS.RPTIME) : '-' }` : '-'
          }
        }
      }) || []
  })

  const handleActionRefresh = () => {
    const loading = utilStore.startLoadingModal('Refreshing ...')

    axios.get(`issuance_lease/lease_unit/${selectedUnit.value?.PBL_KEY_RAW}/`)
    .then((response) => {
      selectedUnit.value = undefined
      selectedHistoryOfIssuedDocument.value = []
      selectedUnit.value = response.data.data
    })
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      loading.close()
    })
  }

  const handleActionQuietRefresh = () => {
    axios.get(`issuance_lease/lease_unit/${selectedUnit.value?.PBL_KEY_RAW}/`)
    .then((response) => {
      selectedUnit.value = undefined
      selectedUnit.value = response.data.data
    })
    .catch(utilStore.handleAxiosError)
  }

  const handleActionViewHistoryOfPayments = (table_data: HistoryOfPayment[]) => {
    const HistoryOfPaymentsDialog = dialog.open(HistoryOfPaymentsTableModal, {
      data: {
        table_data : table_data,
        submit: (selectedHistoryOfPayment: HistoryOfPayment) => {
          handleActionViewHistoryOfPayment(selectedHistoryOfPayment)
        },
        cancel: () => {
          HistoryOfPaymentsDialog.close()
        }
      },
      props: {
        header: 'History of Payments',
        style: {
          width: '80vw'
        },
        showHeader: true,
        maximizable: true,
        modal: true
      }
    })
  }

  const handleActionViewHistoryOfPayment = (selectedHistoryOfPayment: HistoryOfPayment) => {
    const InvoiceReceiptDetailsDialog = dialog.open(InvoiceReceiptDetailsModal, {
      data: {
        invoice_receipt: selectedHistoryOfPayment,
        submit: (selectedCheck: CheckDetails) => {
          handleActionViewSelectedCheckDetails(selectedCheck)
        },
        cancel: () => {
          InvoiceReceiptDetailsDialog.close()
        }
      },
      props: {
        header: (selectedHistoryOfPayment.DOCUMENT_TYPE || 'Old Official Receipt') + ' # ' + selectedHistoryOfPayment.OR_KEY,
        style: {
          width: '49vw'
        },
        showHeader: true,
        modal: true,
      }
    })
  }

  const handleActionViewSelectedCheckDetails = (selectedCheck: CheckDetails) => {
    const CheckDetailsDialog = dialog.open(CheckDetailsModal, {
      data: {
        check_details: selectedCheck,
        submit: () => {
        },
        cancel: () => {
          CheckDetailsDialog.close()
        }
      },
      props: {
        header: 'Check #' + selectedCheck.CHKNUM,
        style: {
          width: '30vw'
        },
        showHeader: true,
        modal: true,
      }
    })
  }

  const handleActionViewBillTypes = () => {
    dialog.open(LeaseBillTypesTableModal, {
      props: {
        header: 'Lease Bill Types',
        style: {
          width: '45vw'
        },
        showHeader: true,
        maximizable: true,
        modal: true
      }
    })
  }

  const handleActionViewLedgerRemarks = () => {
    dialog.open(RemarksTableModal, {
      props: {
        header: 'Remarks',
        style: {
          width: '45vw'
        },
        showHeader: true,
        maximizable: false,
        modal: true
      }
    })
  }

  const handleActionPrintOriginal = () => {
    if (selectedHistoryOfIssuedDocument.value.length > 0) {
      sessionStore.handleActionVerifyUserAuthority("GENERAL_OVERRIDE", () => {
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

            const ORIGINAL_ISSUED_DOCUMENTS: InvoiceRecord[] = selectedHistoryOfIssuedDocument.value
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
              .sort((a,b) => a.INVOICE_KEY.INVOICE_NUMBER.localeCompare(b.INVOICE_KEY.INVOICE_NUMBER))

            const invoicePDFDataS: InvoicePDF[] = ORIGINAL_ISSUED_DOCUMENTS.map((invoiceRecord) => issuanceStore.convertInvoiceRecordsToInvoicePDFs(invoiceRecord))
            const PDF_BLOBS = invoicePDFDataS.map((invoicePDFData) => issuanceStore.generateInvoicePDFBlob(invoicePDFData))
            const PDF_BLOB = await fileStore.mergePDFBlobs(PDF_BLOBS)

            const header = '(ORIGINAL) Selected Documents'
            const name = `(ORIGINAL) Selected Documents ${stampDate}-${stampTime}`

            fileStore.handleActionViewFilePDF(
              header,
              `${name}.pdf`,
              PDF_BLOB,
              null,
              () => {},
              () => {}
            )

            loading.close()
          },
          reject: () => {
          }
        });
      })
    }
  }

  const handleActionReprint = () => {
    confirm.require({
      message: 'Are you sure you want to reprint the selected document(s)?',
      header: 'Confirm Reprinting of Selected Documents',
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
        const loading = utilStore.startLoadingModal('Reprinting...')

        await new Promise(resolve => setTimeout(resolve, 1000));

        const currentDate = new Date()
        const stampDate = utilStore.getCurrentDateNumberYYYYMMDD(currentDate)
        const stampTime = utilStore.getCurrentTimeNumberHHMMSS(currentDate)

        const FOR_UPDATE_CIRCLTPF: object[] = []
        const REPRINTED_ISSUED_DOCUMENTS: InvoiceRecord[] =
          selectedHistoryOfIssuedDocument.value
            .map((selected) => {

              const FOR_UPDATE = {
                PRSTAT: 'R' as InvoicePrintStatus,
                PRCNT:  selected.DETAILS.PRCNT + 1,

                RPDATE: stampDate,
                RPTIME: stampTime,
                REPRBY: sessionStore.authenticatedUser?.username || '',

                UPDDTE: stampDate,
                UPDTME: stampTime,
                UPDBY:  sessionStore.authenticatedUser?.username || '',

                RECTYP: selected.DETAILS.RECTYP,
                ORNUM: selected.DETAILS.ORNUM,
              }

              FOR_UPDATE_CIRCLTPF.push(FOR_UPDATE)

              return {
                ...selected,
                DETAILS: {
                  ...selected.DETAILS,
                  ...FOR_UPDATE,
                }
              }
            })
            .sort((a,b) => a.INVOICE_KEY.INVOICE_NUMBER.localeCompare(b.INVOICE_KEY.INVOICE_NUMBER))

        const data = {
          FOR_UPDATE_CIRCLTPF: FOR_UPDATE_CIRCLTPF
        }

        axios.put('issuance_lease/invoice/', data)
        .then(async (response) => {
          toast.add({
            severity: 'success',
            summary: 'Success',
            detail: response.data.message,
            life: 3000
          })

          const invoicePDFDataS: InvoicePDF[] = REPRINTED_ISSUED_DOCUMENTS.map((invoiceRecord) => issuanceStore.convertInvoiceRecordsToInvoicePDFs(invoiceRecord))

          const PDF_BLOBS = invoicePDFDataS.map((invoicePDFData) => issuanceStore.generateInvoicePDFBlob(invoicePDFData))
          const PDF_BLOB = await fileStore.mergePDFBlobs(PDF_BLOBS)

          const header = '(REPRINTED) Selected Documents'
          const name = `(REPRINTED) Selected Documents ${stampDate}-${stampTime}`

          fileStore.handleActionViewFilePDF(
            header,
            `${name}.pdf`,
            PDF_BLOB,
            null,
            () => {},
            () => {}
          )
        })
        .catch(utilStore.handleAxiosError)
        .finally(() => {
          loading.close()
          handleActionQuietRefresh()
        })
      },
      reject: () => {
      }
    });
  }

  onMounted(() => {
    clients.value = []
    units.value = []
    selectedUnit.value = undefined
    selectedHistoryOfIssuedDocument.value = []
  })

  return {
    INQUIRY_TYPES,
    DOCUMENT_STATUSES,
    PRINT_STATUSES,

    stepperPage,
    selectedInquiryType,

    clients,
    units,

    clients_data,
    units_data,

    isMainScreen,
    showStepper,

    queryUnitForm,
    queryClientForm,

    getPBL,

    handleActionSearch,

    handleActionReturnInquiryForm,
    handleActionReturnClientSelection,
    handleActionReturnUnitSelection,

    handleActionReset,

    handleActionSearchClientUnits,
    handleActionSelectUnit,

    // LEASE
    selectedHistoryOfIssuedDocument,

    getSelectedClientUnit,
    history_of_payments_data,
    remarks_data,
    history_of_issued_documents_data,

    handleActionRefresh,

    handleActionViewHistoryOfPayments,
    handleActionViewHistoryOfPayment,

    handleActionViewBillTypes,
    handleActionViewLedgerRemarks,

    handleActionPrintOriginal,
    handleActionReprint,
  }
})