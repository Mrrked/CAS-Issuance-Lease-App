<script lang="ts" setup>
  import { usePerBillTypeRunStore } from '../../store/usePerBillTypeRunStore';
  import { usePerBatchRunStore } from '../../store/usePerBatchRunStore';
  import { useCoreDataStore } from '../../store/useCoreDataStore';
  import { useMainStore } from '../../store/useMainStore';
  import { useDialog } from 'primevue/usedialog';
  import { onMounted } from 'vue'
  import PreviewPDFModal from '../../components/Dialog/General/PreviewPDFModal.vue';
  import { InvoiceRecord } from '../../store/types';

  const dialog = useDialog()
  const mainStore = useMainStore()
  const coreDataStore = useCoreDataStore()
  const perBatchRunStore = usePerBatchRunStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()

  const {
    handleExecuteSearch,
    handleExecuteReset,
  } = mainStore

  onMounted(() => {
    coreDataStore.fetchData()
    // mainStore.handleExecuteSearch(2)

    // const SELECTED_INVOICE_RECORD: InvoiceRecord = {
    //   "PBL_KEY": "CL3 L  U001  ",
    //   "TCLTNO": 2405014,
    //   "CLIENT_KEY_RAW": "CL3174L0",
    //   "BILLINGS": [
    //     {
    //       "ID": "CL3 L  U001  2405014",
    //       "PBL_KEY": "CL3 L  U001  ",
    //       "CLIENT_NAME": "AT GROUP SERVICES LIMITED - PHILIPPINE BRANCH",
    //       "CLIENT_ADDRESS": "LU001 CITYNET CENTRAL, SULTAN STREET, BRGY. HIGHWAY HILLS, MANDALUYONG CITY",
    //       "CLIENT_TIN": "010-410-346-00000 ",
    //       "CLIENT_KEY": "CL310074L00",
    //       "CLIENT_KEY_RAW": "CL3174L0",
    //       "CLIENT_PROJECT_CODE": "CL3",
    //       "CLIENT_UNIT": " L  U001  ",
    //       "CLIENT_PIBIG": "V",
    //       "COMPCD": 1,
    //       "BRANCH": 1,
    //       "ACNUM": "Acknowledgement Certificate No. : AC_RDO_mmyyyy_xxxxxx",
    //       "ACDAT": "Date Issued : xxxx/xx/xx",
    //       "WHTAX_RATE": 5,
    //       "YYYYMM": "2025/01",
    //       "BILL_TYPE": 1,
    //       "MBTYPE": 0,
    //       "OLD_BILL_TYPE": 1,
    //       "OLD_BILL_TYPE_DESC": "RENTAL",
    //       "SALTYP": "VAT",
    //       "PROJCD": "CL3",
    //       "PCSCOD": " ",
    //       "PHASE": "L",
    //       "BLOCK": "  ",
    //       "LOT": "U001",
    //       "UNITCD": "  ",
    //       "TCLTNO": 2405014,
    //       "CLTNUM": 0,
    //       "PDSCOD": "L",
    //       "PDSNUM": 0,
    //       "YY": 2025,
    //       "MM": 1,
    //       "PAYTYP": "Y",
    //       "BTYPE": 1,
    //       "BILAMT": 90528.48,
    //       "BALAMT": 90528.48,
    //       "AMTPD": 0,
    //       "PRPTAX": 0,
    //       "DATDUE": 20250113,
    //       "PERIOD": "01/13/25 - 02/12/25 ",
    //       "FRBILL": 20250113,
    //       "TOBILL": 20250212,
    //       "BALCOD": " ",
    //       "UPDCOD": " ",
    //       "RECCOD": " ",
    //       "VERTAG": " ",
    //       "USRUPD": "IRCHIN",
    //       "DATUPD": 20240507,
    //       "TIMUPD": 145238,
    //       "BDESC": "RENTAL",
    //       "ORDER": 15,
    //       "PENRAT": 2,
    //       "INTRAT": 3,
    //       "ORTYPE": "O",
    //       "FIXPEN": "N",
    //       "WTHPEN": "Y",
    //       "MOTACT": 0,
    //       "PRJACT": "",
    //       "DEPACT": 0,
    //       "GENACT": 0,
    //       "SUBACT": 0,
    //       "FILL1": 5,
    //       "FILL2": 0,
    //       "FILL3": 0,
    //       "FILL4": "R",
    //       "FILL5": "",
    //       "IS_VATABLE": "Y",
    //       "VAT_RATE": 12,
    //       "INVOICE_KEY": {
    //         "RECTYP": "VI",
    //         "TRNTYP": "V",
    //         "COMPLETE_OR_KEY": "01111xxxxxxxx",
    //         "COMPCD": 1,
    //         "BRANCH": 1,
    //         "DEPTCD": 11,
    //         "ORCOD": "",
    //         "ORNUM": 0,
    //         "PROJCD": "CL3",
    //         "YY": 2025,
    //         "MM": 1,
    //         "INVOICE_NAME": "SERVICE",
    //         "INVOICE_NUMBER": "VI01111xxxxxxxx",
    //         "SERIES_RANGE": "VI011111A000001 - VI011119Z999999"
    //       },
    //       "INDEX": 29,
    //       "UNIT_COST": 80829,
    //       "AMOUNT": 90528.48,
    //       "VAT_SALES": 80829,
    //       "VAT_EXEMPT": 0,
    //       "ZERO_RATE": 0,
    //       "TOTAL_SALE": 80829,
    //       "GOVT_TAX": 0,
    //       "VAT": 9699.48,
    //       "WITHHOLDING_TAX": 4041.45,
    //       "TOTAL_AMOUNT": 86487.03
    //     }
    //   ],
    //   "HEADER": {
    //     "COMPANY_NAME": "CITYLAND DEVELOPMENT CORPORATION",
    //     "ADDRESS": "2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V. DELA COSTA ST BEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
    //     "LOGO_URL": "/src/assets/cdc.png",
    //     "LOGO_SIZE_INCH": {
    //       "WIDTH": 0.8,
    //       "HEIGHT": 0.8
    //     }
    //   },
    //   "INVOICE_KEY": {
    //     "RECTYP": "BI",
    //     "TRNTYP": "B",
    //     "COMPLETE_OR_KEY": "01111xxxxxxxx",
    //     "COMPCD": 1,
    //     "BRANCH": 1,
    //     "DEPTCD": 11,
    //     "ORCOD": "",
    //     "ORNUM": 0,
    //     "PROJCD": "CL3",
    //     "YY": 2025,
    //     "MM": 1,
    //     "INVOICE_NAME": "BILLING",
    //     "INVOICE_NUMBER": "BI01111xxxxxxxx",
    //     "SERIES_RANGE": "BI0111101000001 - BI0111199999999  "
    //   },
    //   "FOOTER": {
    //     "ACNUM": "Acknowledgement Certificate No. : AC_RDO_mmyyyy_xxxxxx",
    //     "ACDAT": "Date Issued : xxxx/xx/xx"
    //   },
    //   "DETAILS": {
    //     "RECTYP": "BI",
    //     "ORNUM": "01111xxxxxxxx",
    //     "PAYTYP": "Y",
    //     "PIBIG": "V",
    //     "SLSTYP": "",
    //     "DATVAL": 20250101,
    //     "COMPCD": 1,
    //     "TELNO": "8893-6060",
    //     "REGTIN": "000-527-103-00000",
    //     "CLTNME": "AT GROUP SERVICES LIMITED - PHILIPPINE BRANCH",
    //     "RADDR1": "LU001 CITYNET CENTRAL, SULTAN STREET, BRGY. HIGHWAY HILLS, MANDALUYONG CITY",
    //     "RADDR2": "",
    //     "CLTTIN": "010-410-346-00000 ",
    //     "CLTKEY": "CL310074L00",
    //     "PRJNAM": "CITYNET CENTRAL",
    //     "PBLKEY": "CL3 L  U001  ",
    //     "DATSTP": 20241203,
    //     "TIMSTP": 104542,
    //     "AUTHSG": "IT_MARK",
    //     "STATUS": "",
    //     "RUNDAT": 20241203,
    //     "RUNTME": 104542,
    //     "RUNBY": "IT_MARK",
    //     "RPDATE": 0,
    //     "RPTIME": 0,
    //     "REPRBY": ""
    //   },
    //   "ITEM_BREAKDOWNS": [
    //     {
    //       "RECTYP": "BI",
    //       "ORNUM": "01111xxxxxxxx",
    //       "ITEMNO": 1,
    //       "BILTYP": 1,
    //       "ITEM": "WATER CHARGES ( January 2025 ) VAT Exempt",
    //       "QTY": 1,
    //       "UNTCST": 596.36,
    //       "VATAMT": 0,
    //       "VATSAL": 0,
    //       "VATEXM": 596.36,
    //       "ZERSAL": 0,
    //       "NETVAT": 596.36,
    //       "WTHTAX": 11.93,
    //       "GOVTAX": 14.91,
    //       "WTXRAT": 2,
    //       "AMTDUE": 596.36,
    //       "FRDATE": 20250113,
    //       "TODATE": 20250212,
    //       "DUEDAT": 20250113
    //     },
    //   ],
    //   "TOTAL_BREAKDOWN": {
    //     "RECTYP": "BI",
    //     "ORNUM": "01111xxxxxxxx",
    //     "BILTYP": 0,
    //     "VATSAL": 0,
    //     "VATEXM": 596.36,
    //     "ZERSAL": 0,
    //     "GOVTAX": 14.91,
    //     "TOTSAL": 596.36,
    //     "NETVAT": 596.36,
    //     "VATAMT": 0,
    //     "PRDTAX": 11.93,
    //     "AMTDUE": 599.34
    //   },
    //   "CORFPF": {
    //       "COMPCD": 1,
    //       "BRANCH": 1,
    //       "DEPTCD": 11,
    //       "ORCOD" : "",
    //       "ORNUM" : 0,
    //       "DATOR" : 0,
    //       "CASHCD": "IT_MARK",
    //       "COLSTF": "",
    //       "ORAMT" : 86487.03,
    //       "NOACCT": 0,
    //       "PAYTYP": "Y",
    //       "INTRST": 0,
    //       "PNALTY": 0,
    //       "OTHERS": 0,
    //       "OVRPAY": 0,
    //       "UNDPAY": 0,
    //       "PROJCD": "CL3",
    //       "PCSCOD": " ",
    //       "PHASE" : "L",
    //       "BLOCK" : "  ",
    //       "LOT"   : "U001",
    //       "UNITCD": "  ",
    //       "PAYCOD": "",
    //       "PAYEE" : "AT GROUP SERVICES LIMITED - PHILIPP",
    //       "PN#": 0,
    //       "DATVAL": 20250101,
    //       "DATPRT": 0,
    //       "BANKCD": "",
    //       "BNKACT": "",
    //       "NOCHK" : 0,
    //       "PRNO"  : 0,
    //       "CSHAMT": 0,
    //       "TCHKAM": 0,
    //       "LEAFNO": 0,
    //       "NORMRK": 0,
    //       "DATCAN": 0,
    //       "RETCOD": "",
    //       "UPDCOD": "",
    //       "NOMOS" : 0,
    //       "TRANSN": 0,
    //       "DELOR" : ""
    //   },
    //   "CORTPF": {
    //       "COMPCD": 1,
    //       "BRANCH": 1,
    //       "DEPTCD": 11,
    //       "ORCOD": "",
    //       "ORNUM": 0,
    //       "DATVAL": 20250101,
    //       "PROJCD": "CL3",
    //       "PCSCOD": " ",
    //       "PHASE": "L",
    //       "BLOCK": "  ",
    //       "LOT": "U001",
    //       "UNITCD": "  ",
    //       "PAYTYP": "Y",
    //       "CLTNUM": 0,
    //       "PDSCOD": "L",
    //       "PDSNUM": 0,
    //       "TCLTNO": 2405014,
    //       "DATINS": 20250113,
    //       "BALRUN": 0,
    //       "PAYNO": 0,
    //       "NOMOS": 0
    //   }
    // }

    // const currentDate = new Date()
    // const stampDate = parseInt(currentDate.toISOString().slice(0, 10).replace(/-/g, ''))
    // const stampTime = parseInt(currentDate.toTimeString().slice(0, 8).replace(/:/g, ''))

    // const PDF_BLOB = mainStore.handleGenerateInvoicePDFBlob([{
    //   ...SELECTED_INVOICE_RECORD,
    //   DETAILS: {
    //     ...SELECTED_INVOICE_RECORD.DETAILS,

    //     DATSTP: stampDate,
    //     TIMSTP: stampTime,

    //     RUNDAT: stampDate,
    //     RUNTME: stampTime,
    //   }
    // }])

    // const ShowDraftInvoice = dialog.open(PreviewPDFModal, {
    //   data: {
    //     pdfBlob: PDF_BLOB,
    //     submit: () => {
    //     },
    //     cancel: () => {
    //       ShowDraftInvoice.close()
    //     }
    //   },
    //   props: {
    //     header: 'Preview Draft Billing Invoice - ' + SELECTED_INVOICE_RECORD.PBL_KEY,
    //     style: {
    //       width: '75vw'
    //     },
    //     showHeader: true,
    //     modal: true,
    //   },
    // })
  })

</script>

<template>
  <div class="flex flex-col w-full h-full gap-3 pt-4">
    <Tabs value="0">
      <TabList>
        <Tab value="0">Run Per Bill Type</Tab>
        <Tab value="1">Run Per Batch</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="0" class="flex flex-col items-start justify-start ">
          <Fieldset legend="Per Bill Type" class="min-w-80">
            <div class="flex flex-col gap-2">
              <InputGroup>
                <InputGroupAddon>
                  <label for="invoice_date" class="font-bold w-28 text-content-background">
                    Invoice Date
                  </label>
                </InputGroupAddon>
                <DatePicker
                  v-model="perBillTypeRunStore.perBillTypeRunForm.invoiceDate"
                  :minDate="new Date()"
                  placeholder="Select..."
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <label for="bill_Type" class="font-bold w-28 text-content-background">
                    Bill Type
                  </label>
                </InputGroupAddon>
                <Select
                  v-model="perBillTypeRunStore.perBillTypeRunForm.billType"
                  :options="perBillTypeRunStore.BILL_TYPE_OPTIONS"
                  filter
                  optionLabel="name"
                  placeholder="Select..."
                ></Select>
              </InputGroup>
              <InputGroup>
                <InputGroupAddon>
                  <label for="project_code" class="font-bold w-28 text-content-background">
                    Project
                  </label>
                </InputGroupAddon>
                <Select
                  v-model="perBillTypeRunStore.perBillTypeRunForm.projectCode"
                  :options="coreDataStore.project_code_options"
                  filter
                  optionLabel="name"
                  placeholder="Select..."
                ></Select>
              </InputGroup>

              <div v-if="perBillTypeRunStore.showPBLForm" class="grid grid-cols-23 gap-4 mt-3 max-w-[50rem]">
                <div class="flex flex-col items-center justify-center col-span-3 gap-2">
                  <label name="pcs_code" class="font-bold text-center">
                    PCS Code
                  </label>
                  <InputText
                    name="pcs_code"
                    maxlength="1"
                    class="font-semibold text-center uppercase w-11"
                    size="large"
                    autocomplete="off"
                  />
                </div>
                <div class="flex flex-col items-center justify-center col-span-3 gap-2">
                  <label name="phase" class="font-bold text-center">
                    Phase
                  </label>
                  <InputText
                    name="phase"
                    maxlength="1"
                    class="font-semibold text-center uppercase w-11"
                    size="large"
                    autocomplete="off"
                  />
                </div>
                <div class="flex flex-col items-center justify-center col-span-4 gap-2">
                  <label name="block" class="font-bold text-center">
                    Block
                  </label>
                  <div class="flex gap-1">
                    <InputText
                      name="block"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                    <InputText
                      name="block"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                  </div>
                </div>
                <div class="flex flex-col items-center justify-center col-span-1 gap-2 font-bold">
                  <div>
                    /
                  </div>
                  <div class="flex items-center h-full">
                    /
                  </div>
                </div>
                <div class="flex flex-col items-center justify-center col-span-7 gap-2">
                  <label name="lot" class="font-bold text-center">
                    Lot
                  </label>
                  <div class="flex gap-1">
                    <InputText
                      name="lot"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                    <InputText
                      name="lot"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                    <InputText
                      name="lot"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                    <InputText
                      name="lot"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                  </div>
                </div>
                <div class="flex flex-col items-center justify-center col-span-1 gap-2 font-bold">
                  <div>
                    /
                  </div>
                  <div class="flex items-center h-full">
                    /
                  </div>
                </div>
                <div class="flex flex-col items-center justify-center col-span-4 gap-2">
                  <label name="unit_code" class="font-bold text-center">
                    Unit Code
                  </label>
                  <div class="flex gap-1">
                    <InputText
                      name="lot"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                    <InputText
                      name="lot"
                      maxlength="1"
                      class="font-semibold text-center uppercase w-11"
                      size="large"
                      autocomplete="off"
                    />
                  </div>
                </div>
              </div>

              <div class="flex justify-between w-full gap-3 mt-3">
                <Button @click="handleExecuteReset(1)"
                  raised
                  type="reset"
                  label="Reset"
                />
                <Button @click="handleExecuteSearch(1)"
                  raised
                  type="submit"
                  label="Search"
                  icon="pi pi-search"
                />
              </div>
            </div>
          </Fieldset>
        </TabPanel>
        <TabPanel value="1" class="flex flex-col items-start justify-start ">
          <Fieldset legend="Batch Running" class="min-w-80">
            <div class="flex flex-col gap-2">
              <InputGroup>
                <InputGroupAddon>
                  <label for="invoice_date" class="font-bold w-28 text-content-background">
                    Invoice Date
                  </label>
                </InputGroupAddon>
                <DatePicker
                  v-model="perBatchRunStore.perBatchRunForm.invoiceDate"
                  :minDate="new Date()"
                  placeholder="Select..."
                />
              </InputGroup>
              <div class="flex justify-between w-full gap-3 mt-3">
                <Button @click="handleExecuteReset(2)"
                  raised
                  type="reset"
                  label="Reset"
                />
                <Button @click="handleExecuteSearch(2)"
                  raised
                  type="submit"
                  label="Find All"
                  icon="pi pi-search"
                />
              </div>
            </div>
          </Fieldset>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>