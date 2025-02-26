import { COMPANIES, COMPANY_DETAILS } from '../components/Dialog/General/data';
import { CheckDetails, Client, ClientForm, Config, GenHeader, HistoryOfPayment, InvoicePrintStatus, InvoiceRecord, LeaseHeader, LedgerRemark, Unit, UnitForm } from './types';
import { computed, defineAsyncComponent, markRaw, onMounted, ref } from 'vue';

import axios from '../axios';
import { defineStore } from 'pinia';
import { useConfirm } from 'primevue/useconfirm';
import { useDialog } from 'primevue/usedialog';
import { useIssuanceStore } from './useIssuanceStore';
import { useMainStore } from './useMainStore';
import { useSessionStore } from './useSessionStore';
import { useToast } from 'primevue/usetoast';
import { useUtilitiesStore } from './useUtilitiesStore';

const CheckDetailsModal = defineAsyncComponent(() => import('../components/Dialog/Printing/CheckDetailsModal.vue'));
const HistoryOfPaymentsTableModal = defineAsyncComponent(() => import('../components/Dialog/Printing/HistoryOfPaymentsTableModal.vue'));
const OfficialReceiptModal = defineAsyncComponent(() => import('../components/Dialog/Printing/OfficialReceiptModal.vue'));
const BillTypesTableModal = defineAsyncComponent(() => import('../components/Dialog/Printing/BillTypesTableModal.vue'));
const RemarksTableModal = defineAsyncComponent(() => import('../components/Dialog/Printing/RemarksTableModal.vue'));

const PreviewPDFModal = defineAsyncComponent(() => import('../components/Dialog/General/PreviewPDFModal.vue'));

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

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

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()
  const issuanceStore = useIssuanceStore()

  const clients = ref<Client[]>([]);
  const units = ref<Unit[]>([]);

  const selectedUnit = ref<ClientUnit>()
  const selectedHistoryOfIssuedDocument = ref<InvoiceRecord[]>([])

  const DOCUMENT_STATUSES = [
    { value: 'D', name: 'DELETED'},
    { value: 'C', name: 'CANCELLED'}
  ]
  const PRINT_STATUSES = [
    { value: 'P', name: 'PRINTED'},
    { value: 'R', name: 'REPRINTED'}
  ]

  const config = ref<Config>({
    isMainScreen: false,
    selectedOption: 'By Project | Block | Lot',
    options: ['By Project | Block | Lot', 'By Client\'s Name'],
  })

  const queryUnitForm = ref<UnitForm>({
    project_code: null,
    pcs_code: '',
    phase: '',
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

  const showStepper = computed(() => {
    return config.value.selectedOption !== null &&
      config.value.selectedOption === 'By Client\'s Name' && !config.value.isMainScreen
  })

  const handleActionSearch = (activateCallback: Function) => {
    const validateQueryUnitForm = () => {
      return (
        queryUnitForm.value.block ||
        queryUnitForm.value.lot ||
        queryUnitForm.value.pcs_code ||
        queryUnitForm.value.phase ||
        queryUnitForm.value.project_code ||
        queryUnitForm.value.unit_code
      )
    }

    const validateQueryClientForm = () => {
      return (queryClientForm.value.name)
    }

    switch (config.value.selectedOption) {
      // BY PBL
      case 'By Project | Block | Lot':
        if (validateQueryUnitForm()) {
          handleActionOpenUnit(activateCallback)
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Error',
            detail: 'Unable to execute search without any query details',
            life: 3000
          });
        }
        break;

      // BY CLIENTS NAME
      case 'By Client\'s Name':
        if (validateQueryClientForm()) {
          const loading = utilStore.startLoadingModal('Searching Client ...')

          const data = {
            name: queryClientForm.value.name.toUpperCase(),
          }

          axios.post('issuance_lease/clients/', data)
          .then((response) => {
            // console.log('RESPONSE ', response);
            clients.value = response.data.data
            activateCallback('2')
          })
          .catch(utilStore.handleAxiosError)
          .finally(() => {
            loading.close()
          })
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Error',
            detail: 'Unable to execute search without any query details',
            life: 3000
          });
        }
        break;
    }
  }

  const handleActionReturnInquiryForm = (activateCallback: Function) => {
    activateCallback('1')
    clients.value = []
    units.value = []
  }

  const handleActionReturnClientSelection = (activateCallback: Function) => {
    activateCallback('2')
    units.value = []
  }

  const handleActionReturnUnitSelection = (activateCallback: Function) => {
    config.value.isMainScreen = false
    activateCallback('3')
  }

  const handleActionReset = (activateCallback: Function) => {
    config.value.isMainScreen = false

    units.value = []
    clients.value = []

    queryClientForm.value = {
      name: '',
    }

    queryUnitForm.value = {
      project_code: null,
      pcs_code: '',
      phase: '',
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

    activateCallback('1')
  }

  const handleActionSearchClientUnits = (CACCT: string, activateCallback: Function) => {
    const loading = utilStore.startLoadingModal('Searching Client\s Units ...')

    axios.get(`issuance_lease/units/client/${CACCT}`)
    .then((response) => {
      // console.log('RESPONSE ', response);
      units.value = response.data.data
      activateCallback('3')
    })
    .catch(utilStore.handleAxiosError)
    .finally(() => {
      loading.close()
    })
  }

  const handleActionSelectUnit = (data: Unit, activateCallback: Function) => {
    if (data) {
      handleActionOpenUnit(activateCallback, data)
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Error',
        detail: 'Failed to select unit!',
        life: 3000
      });
    }
  }

  const handleActionOpenUnit = (activateCallback: Function, unit?: Unit) => {
    let pos = '';
    let pbl = ''

    if (config.value.selectedOption === 'By Project | Block | Lot') {
      pos = '2'
      pbl = `${queryUnitForm.value.project_code?.PROJCD || '   '}${queryUnitForm.value.pcs_code || ' '}${queryUnitForm.value.phase || ' '}${queryUnitForm.value.block['1'] || ' '}${queryUnitForm.value.block['2'] || ' '}${queryUnitForm.value.lot['1'] || ' '}${queryUnitForm.value.lot['2'] || ' '}${queryUnitForm.value.lot['3'] || ' '}${queryUnitForm.value.lot['4'] || ' '}${queryUnitForm.value.unit_code['1'] || ' '}${queryUnitForm.value.unit_code['2'] || ' '}`.toUpperCase()
    } else if(unit) {
      pos = '4'
      pbl = `${unit.PROJCD || '   '}${unit.PCSCOD || ' '}${unit.PHASE || ' '}${unit.BLOCK || '  '}${unit.LOT || '    '}${unit.UNITCD || '  '}`
    }

    const loading = utilStore.startLoadingModal('Fetching Unit ...')

    axios.get(`issuance_lease/unit/${pbl}/`)
    .then((response) => {
      selectedUnit.value = response.data.data
      console.log(selectedUnit.value);
      activateCallback(pos)
      config.value.isMainScreen = true
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
        const selectedCompany = COMPANIES.find((c) => c.COMPCD === invoice.DETAILS.COMPCD) as COMPANY_DETAILS || COMPANIES[0]

        return {
          ...invoice,
          TCLTNO: selectedUnit.value?.TCLTNO || 0,

          HEADER: {
            COMPANY_NAME:   selectedCompany.CONAME,
            ADDRESS:        selectedCompany.ADDRESS,
            LOGO_URL:       selectedCompany.IMG_URL,
            LOGO_SIZE_INCH: selectedCompany.IMG_SIZE_INCH
          },

          EXTRA: {
            TIMESTAMP_PRINT: invoice.DETAILS.RUNDAT ? `${ invoice.DETAILS.RUNDAT ? utilStore.formatDateNumberToStringYYYYMMDD(invoice.DETAILS.RUNDAT) : '-' } ${ invoice.DETAILS.RUNTME ? utilStore.formatTimeNumberToString12H(invoice.DETAILS.RUNTME) : '-' }` : '-',
            TIMESTAMP_REPRINT: invoice.DETAILS.RPDATE ? `${ invoice.DETAILS.RPDATE ? utilStore.formatDateNumberToStringYYYYMMDD(invoice.DETAILS.RPDATE) : '-' } ${ invoice.DETAILS.RPTIME ? utilStore.formatTimeNumberToString12H(invoice.DETAILS.RPTIME) : '-' }` : '-'
          }
        }
      }) || []
  })

  const handleActionRefresh = () => {
    const loading = utilStore.startLoadingModal('Refreshing ...')

    axios.get(`issuance_lease/unit/${selectedUnit.value?.PBL_KEY_RAW}/`)
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
    const HistoryOfPaymentDialog = dialog.open(OfficialReceiptModal, {
      data: {
        or_record: selectedHistoryOfPayment,
        submit: (selectedCheck: CheckDetails) => {
          handleActionViewSelectedCheckDetails(selectedCheck)
        },
        cancel: () => {
          HistoryOfPaymentDialog.close()
        }
      },
      props: {
        header: 'Official Receipt: ' + selectedHistoryOfPayment.OR_KEY,
        style: {
          width: '45vw'
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
    dialog.open(BillTypesTableModal, {
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
      const password = prompt('Enter password: ')
      if (password === ADMIN_PASSWORD) {
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
            const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
            const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

            const ORIGINAL_ISSUED_DOCUMENTS: InvoiceRecord[] =
              selectedHistoryOfIssuedDocument.value
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
            const PDF_BLOB = issuanceStore.handleActionGenerateInvoicePDFBlob(ORIGINAL_ISSUED_DOCUMENTS)

            const Footer = defineAsyncComponent(() => import('../components/Dialog/General/DraftInvoiceModalFooter.vue'));
            const ShowDraftInvoices = dialog.open(PreviewPDFModal, {
              data: {
                pdfBlob: PDF_BLOB,
                download: () => {
                  const url = URL.createObjectURL(PDF_BLOB);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `(ORIGINAL) Selected Documents ${stampDate}-${stampTime}.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                },
                submit: () => {
                },
                cancel: () => {
                  ShowDraftInvoices.close()
                }
              },
              props: {
                header: '(ORIGINAL) Selected Documents',
                style: {
                  width: '75vw'
                },
                showHeader: true,
                modal: true,
              },
              templates: {
                footer: markRaw(Footer)
              },
              onClose: () => {
                selectedHistoryOfIssuedDocument.value = []
              }
            })

            loading.close()
          },
          reject: () => {
          }
        });
      }
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
        const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
        const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

        const FOR_UPDATE_CIRCLTPF: object[] = []
        const REPRINTED_ISSUED_DOCUMENTS: InvoiceRecord[] =
          selectedHistoryOfIssuedDocument.value
            .map((selected) => {

              const FOR_UPDATE = {
                PRSTAT: 'R' as InvoicePrintStatus,
                PRCNT:  selected.DETAILS.PRCNT + 1,

                RPDATE: stampDate,
                RPTIME: stampTime,
                REPRBY: sessionStore.authenticatedUser.username || '',

                RUNDAT: stampDate,
                RUNTME: stampTime,
                RUNBY:  sessionStore.authenticatedUser.username || '',

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
          const PDF_BLOB = issuanceStore.handleActionGenerateInvoicePDFBlob(REPRINTED_ISSUED_DOCUMENTS)

          const Footer = defineAsyncComponent(() => import('../components/Dialog/General/DraftInvoiceModalFooter.vue'));
          const ShowDraftInvoices = dialog.open(PreviewPDFModal, {
            data: {
              pdfBlob: PDF_BLOB,
              download: () => {
                const url = URL.createObjectURL(PDF_BLOB);
                const a = document.createElement('a');
                a.href = url;
                a.download = `(REPRINTED) Selected Documents ${stampDate}-${stampTime}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              },
              submit: () => {
              },
              cancel: () => {
                ShowDraftInvoices.close()
              }
            },
            props: {
              header: '(REPRINTED) Selected Documents',
              style: {
                width: '75vw'
              },
              showHeader: true,
              modal: true,
            },
            templates: {
              footer: markRaw(Footer)
            },
            onClose: () => {
              selectedHistoryOfIssuedDocument.value = []
            }
          })
        })
        .catch(utilStore.handleAxiosError)
        .finally(() => {
          loading.close()
          axios.get(`issuance_lease/unit/${selectedUnit.value?.PBL_KEY_RAW}/`)
          .then((response) => {
            selectedUnit.value = undefined
            selectedUnit.value = response.data.data
          })
          .catch(utilStore.handleAxiosError)
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
    DOCUMENT_STATUSES,
    PRINT_STATUSES,

    config,

    clients,
    units,

    clients_data,
    units_data,

    showStepper,

    queryUnitForm,
    queryClientForm,

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