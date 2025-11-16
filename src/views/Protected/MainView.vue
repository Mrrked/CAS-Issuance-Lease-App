<script lang="ts" setup>
  import { usePerBillTypeRunStore } from '../../store/usePerBillTypeRunStore';
  import { usePerBatchRunStore } from '../../store/usePerBatchRunStore';
  import { useIssuanceStore } from '../../store/useIssuanceStore';
  import { useMainStore } from '../../store/useMainStore';
  import { defineAsyncComponent, onMounted } from 'vue'
  import { useUtilitiesStore } from '../../store/useUtilitiesStore';

  const PartialUnitInquiry = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiry.vue'))

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const issuanceStore = useIssuanceStore()
  const perBatchRunStore = usePerBatchRunStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()

  const ALLOW_ADVANCE_BATCH = import.meta.env.VITE_ALLOW_ADVANCE_BATCH || 'FALSE';
  const ALLOW_ADVANCE_SINGLE = import.meta.env.VITE_ALLOW_ADVANCE_SINGLE || 'FALSE';

  onMounted(() => {
    mainStore.fetchAllData()
  })
</script>

<template>
  <div class="flex flex-col w-full h-full gap-3 pt-4">
    <Tabs value="0">
      <!-- TABS -->
      <TabList>
        <Tab value="0">Run Per Bill Type</Tab>
        <Tab value="1">Run Per Batch</Tab>
      </TabList>

      <!-- TAB CONTENTS -->
      <TabPanels>

        <!-- PER BILL TYPE RUNNING -->
        <TabPanel value="0" class="flex flex-col items-center justify-start">
          <Fieldset legend="Bill Type Group Running" class="min-w-[700px] max-w-[700px]">
            <div v-focustrap class="flex flex-col gap-2">
              <InputGroup>
                <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                  <label for="invoice_date" class="font-bold w-28">
                    Invoice Date
                  </label>
                </InputGroupAddon>
                <DatePicker
                  v-model="perBillTypeRunStore.perBillTypeRunForm.invoiceDate"
                  dateFormat="yy/mm/dd"
                  :minDate="new Date()"
                  :maxDate="ALLOW_ADVANCE_SINGLE === 'TRUE' ? undefined : new Date()"
                  placeholder="Select..."
                />
              </InputGroup>
              <InputGroup>
                <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                  <label for="bill_type" class="font-bold w-28">
                    Bill Type
                  </label>
                </InputGroupAddon>
                <Select
                  v-model="perBillTypeRunStore.perBillTypeRunForm.billType"
                  :options="perBillTypeRunStore.BILL_TYPE_OPTIONS"
                  optionLabel="name"
                  option-value="value"
                  placeholder="Select..."
                ></Select>
              </InputGroup>
              <PartialUnitInquiry v-if="perBillTypeRunStore.isShowPBLForm" />
              <InputGroup v-else>
                <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                  <label for="project_code" class="font-bold">
                    Project Code
                  </label>
                </InputGroupAddon>
                <Select
                  ref="indexRef"
                  v-model="perBillTypeRunStore.perBillTypeRunForm.projectCode"
                  :options="mainStore.getProjectCodeOptions"
                  optionLabel="option_name"
                  placeholder="Select one"
                  class="w-full uppercase md:w-56"
                  editable
                ></Select>
              </InputGroup>
            </div>
            <div class="flex justify-between w-full gap-3 mt-3">
              <Button @click="issuanceStore.handleActionReset(1)"
                raised
                type="reset"
                label="Reset"
              />
              <Button @click="issuanceStore.handleActionSearch(1)"
                raised
                type="submit"
                label="Search"
                icon="pi pi-search"
              />
            </div>
          </Fieldset>
        </TabPanel>

        <!-- BATCH RUNNING -->
        <TabPanel value="1" class="flex flex-col items-center justify-start ">
          <Fieldset legend="Batch Running" class="min-w-[600px] max-w-[600px]">
            <div class="flex flex-col">
              <div class="p-2 text-xs">
                Schedule of Batch Running
              </div>
              <div class="flex flex-col gap-4">
                <div class="grid grid-cols-9 gap-4">
                  <InputGroup class="col-span-4">
                    <InputGroupAddon>
                      <label for="invoice_date" class="w-24 font-bold text-color">
                        Current
                      </label>
                    </InputGroupAddon>
                    <InputText
                      readonly
                      :value="perBatchRunStore.getCurrentSchedule?.EARLIEST_CWORK_DATE ? utilStore.formatDateNumberToStringYYYYMMDD(perBatchRunStore.getCurrentSchedule.EARLIEST_CWORK_DATE) : ''"
                    />
                  </InputGroup>
                  <InputGroup class="col-span-4">
                    <InputGroupAddon>
                      <label for="invoice_date" class="w-24 font-bold text-color">
                        Next
                      </label>
                    </InputGroupAddon>
                    <InputText
                      readonly
                      :value="perBatchRunStore.getNextSchedule?.EARLIEST_CWORK_DATE ? utilStore.formatDateNumberToStringYYYYMMDD(perBatchRunStore.getNextSchedule.EARLIEST_CWORK_DATE) : ''"
                    />
                  </InputGroup>
                  <Button
                    @click="perBatchRunStore.handleActionViewScheduleOfBatchIssuance"
                    icon="pi pi-info-circle"
                    severity="info"
                  />
                </div>
              </div>

              <Divider />

              <InputGroup>
                <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                  <label for="invoice_date" class="font-bold w-28">
                    Invoice Date
                  </label>
                </InputGroupAddon>
                <DatePicker
                  v-model="perBatchRunStore.perBatchRunForm.invoiceDate"
                  dateFormat="yy/mm/dd"
                  :minDate="new Date()"
                  :maxDate="ALLOW_ADVANCE_BATCH === 'TRUE' ? undefined : new Date()"
                  placeholder="Select..."
                />
              </InputGroup>
              <div class="p-2 text-xs">
                This option can only be executed on the first business day of each month.
              </div>

              <div class="flex justify-between w-full gap-3 mt-5">
                <Button @click="issuanceStore.handleActionReset(2)"
                  raised
                  type="reset"
                  label="Reset"
                />
                <Button v-if="perBatchRunStore.canRunBatchIssuance" @click="issuanceStore.handleActionSearch(2)"
                  raised
                  type="submit"
                  label="Find All"
                  icon="pi pi-search"
                />
                <Button v-else-if="!perBatchRunStore.canRunBatchIssuance"
                  @wheel="perBatchRunStore.handleActionAdminBatchIssuance"
                  raised
                  type="submit"
                  label="Find All"
                  icon="pi pi-search"
                  disabled
                />
              </div>
            </div>
          </Fieldset>
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>