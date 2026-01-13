<script lang="ts" setup>
  import { usePerBillTypeRunStore } from '../../store/usePerBillTypeRunStore';
  import { usePerBatchRunStore } from '../../store/usePerBatchRunStore';
  import { useIssuanceStore } from '../../store/useIssuanceStore';
  import { useMainStore } from '../../store/useMainStore';
  import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
  import { useUtilitiesStore } from '../../store/useUtilitiesStore';
  import { useSessionStore } from '../../store/useSessionStore';

  const VerificationTableForIssuance = defineAsyncComponent(() => import('../../components/Issuance/Verification/VerificationTableForIssuance.vue'))
  const PartialUnitInquiryBillGroup = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiryBillGroup.vue'))
  const PartialUnitInquiryBatch = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiryBatch.vue'))

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()
  const issuanceStore = useIssuanceStore()
  const perBatchRunStore = usePerBatchRunStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()

  const ALLOW_ADVANCE_BATCH = import.meta.env.VITE_ALLOW_ADVANCE_BATCH || 'FALSE';
  const ALLOW_ADVANCE_SINGLE = import.meta.env.VITE_ALLOW_ADVANCE_SINGLE || 'FALSE';

  const selectedTab = ref<'A'|'B'|'C'|'D'|''>('')

  onMounted(() => {
    mainStore.fetchAllData()
  })

  watch(
    () => sessionStore.authenticatedUser?.username,
    () => {
      if (sessionStore.userHasPermissionForTabA) {
        selectedTab.value = 'A'
        perBatchRunStore.leaseType = 'Long Term Lease'
      } else if (sessionStore.userHasPermissionForTabB) {
        selectedTab.value = 'B'
        perBatchRunStore.leaseType = 'Short Term Lease'
      } else if (sessionStore.userHasPermissionForTabC) {
        selectedTab.value = 'C'
        perBatchRunStore.leaseType = ''
      } else if (sessionStore.userHasPermissionForTabD) {
        selectedTab.value = 'D'
        perBatchRunStore.leaseType = ''
      } else {
        selectedTab.value = ''
        perBatchRunStore.leaseType = ''
      }
    },
    { immediate: true }
  )
</script>

<template>
  <div class="flex flex-col w-full h-full gap-3 pt-4">
    <div class="flex justify-between">
      <Tabs v-model:value="selectedTab">
        <TabList>
          <Tab :value="'A'" v-if="sessionStore.userHasPermissionForTabA">Run Per Batch (Long Term Lease)</Tab>
          <Tab :value="'B'" v-if="sessionStore.userHasPermissionForTabB">Run Per Batch (Short Term Lease)</Tab>
          <Tab :value="'C'" v-if="sessionStore.userHasPermissionForTabC">Run Per Bill Type (Utilities)</Tab>
          <Tab :value="'D'" v-if="sessionStore.userHasPermissionForTabD">Run Per Verification</Tab>
        </TabList>
      </Tabs>
      <div class="flex flex-col items-center w-48 p-1 border rounded bg-opacity-5 border-primary bg-primary">
        <div v-if="mainStore.currentValueDate" class="font-bold text-primary">
          VALUE DATE
        </div>
        <div v-if="mainStore.currentValueDate" class="py-1 text-primary">
          {{ utilStore.convertDateObjToStringMONDDYYYY(mainStore.currentValueDate.toString()) }}
        </div>
      </div>
    </div>

    <!-- BATCH RUNNING - LONG TERM RENTAL CUSA / VIP-->
    <div v-if="selectedTab === 'A'" class="flex flex-col items-center justify-start">
      <Fieldset legend="Batch Running" class="min-w-[700px] max-w-[700px]">
        <div class="flex flex-col">
          <template v-if="perBatchRunStore.isBatchBillType">
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
          </template>

          <div v-focustrap class="flex flex-col gap-2">
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="invoice_date" class="font-bold w-28">
                  Invoice Date
                </label>
              </InputGroupAddon>
              <DatePicker
                v-if="mainStore.currentValueDate"
                v-model="perBatchRunStore.perBatchRunForm.invoiceDate"
                dateFormat="yy/mm/dd (DD)"
                placeholder="Select..."
                :minDate="mainStore.currentValueDate"
                :maxDate="ALLOW_ADVANCE_BATCH === 'TRUE' ? undefined : new Date()"
                :readonly="ALLOW_ADVANCE_BATCH !== 'TRUE'"
                :disabledDays="[0, 6]"
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="batch_short" class="font-bold w-28">
                  Bill Type
                </label>
              </InputGroupAddon>
              <Select
                v-model="perBatchRunStore.perBatchRunForm.billType"
                :options="perBatchRunStore.BILL_TYPE_OPTIONS"
                optionLabel="name"
                option-value="value"
                placeholder="Select..."
              ></Select>
            </InputGroup>
            <PartialUnitInquiryBatch v-if="perBatchRunStore.isShowPBLForm" type="A"/>
            <InputGroup v-else>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="project_code" class="font-bold w-28">
                  Project Code
                </label>
              </InputGroupAddon>
              <Select
                ref="indexRef"
                v-model="perBatchRunStore.perBatchRunForm.projectCode"
                :options="mainStore.getProjectCodeOptions"
                optionLabel="option_name"
                placeholder="Select one"
                class="w-full uppercase md:w-56"
                editable
              ></Select>
            </InputGroup>
          </div>
          <div class="p-2 text-xs" v-if="perBatchRunStore.isBatchBillType">
            This option can only be executed on the first business day of each month.
          </div>

          <div class="flex justify-between w-full gap-3 mt-5">
            <Button @click="issuanceStore.handleActionReset('A')"
              raised
              type="reset"
              label="Reset"
            />
            <template v-if="perBatchRunStore.isBatchBillType">
              <Button v-if="perBatchRunStore.canRunBatchIssuance" @click="issuanceStore.handleActionSearch('A')"
                raised
                type="submit"
                label="Run Batch"
                icon="pi pi-search"
              />
              <Button v-else-if="!perBatchRunStore.canRunBatchIssuance"
                @wheel="perBatchRunStore.handleActionAdminBatchIssuance('A')"
                raised
                type="submit"
                label="Run Batch"
                icon="pi pi-search"
                disabled
              />
            </template>
            <Button v-else @click="issuanceStore.handleActionSearch('A')"
              raised
              type="submit"
              label="Search"
              icon="pi pi-search"
              :disabled="!perBatchRunStore.canRunSingleIssuance"
            />
          </div>
        </div>
      </Fieldset>
    </div>

    <!-- BATCH RUNNING - SHORT TERM RENTAL CUSA -->
    <div v-else-if="selectedTab === 'B'" class="flex flex-col items-center justify-start">
      <Fieldset legend="Batch Running" class="min-w-[700px] max-w-[700px]">
        <div class="flex flex-col">
          <template v-if="perBatchRunStore.isBatchBillType">
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
          </template>

          <div v-focustrap class="flex flex-col gap-2">
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="invoice_date" class="font-bold w-28">
                  Invoice Date
                </label>
              </InputGroupAddon>
              <DatePicker
                v-if="mainStore.currentValueDate"
                v-model="perBatchRunStore.perBatchRunForm.invoiceDate"
                dateFormat="yy/mm/dd (DD)"
                placeholder="Select..."
                :minDate="mainStore.currentValueDate"
                :readonly="ALLOW_ADVANCE_BATCH !== 'TRUE'"
                :disabledDays="[0, 6]"
              />
            </InputGroup>
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="batch_short" class="font-bold w-28">
                  Bill Type
                </label>
              </InputGroupAddon>
              <Select
                v-model="perBatchRunStore.perBatchRunForm.billType"
                :options="perBatchRunStore.BILL_TYPE_OPTIONS"
                optionLabel="name"
                option-value="value"
                placeholder="Select..."
              ></Select>
            </InputGroup>
            <PartialUnitInquiryBatch v-if="perBatchRunStore.isShowPBLForm" type="B" />
            <InputGroup v-else>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="project_code" class="font-bold w-28">
                  Project Code
                </label>
              </InputGroupAddon>
              <Select
                ref="indexRef"
                v-model="perBatchRunStore.perBatchRunForm.projectCode"
                :options="mainStore.getProjectCodeOptions"
                optionLabel="option_name"
                placeholder="Select one"
                class="w-full uppercase md:w-56"
                editable
              ></Select>
            </InputGroup>
          </div>
          <div class="p-2 text-xs" v-if="perBatchRunStore.isBatchBillType">
            This option can only be executed on the first business day of each month.
          </div>

          <div class="flex justify-between w-full gap-3 mt-5">
            <Button @click="issuanceStore.handleActionReset('B')"
              raised
              type="reset"
              label="Reset"
            />
            <template v-if="perBatchRunStore.isBatchBillType">
              <Button v-if="perBatchRunStore.canRunBatchIssuance" @click="issuanceStore.handleActionSearch('B')"
                raised
                type="submit"
                label="Run Batch"
                icon="pi pi-search"
              />
              <Button v-else-if="!perBatchRunStore.canRunBatchIssuance"
                @wheel="perBatchRunStore.handleActionAdminBatchIssuance('B')"
                raised
                type="submit"
                label="Run Batch"
                icon="pi pi-search"
                disabled
              />
            </template>
            <Button v-else @click="issuanceStore.handleActionSearch('B')"
              raised
              type="submit"
              label="Search"
              icon="pi pi-search"
              :disabled="!perBatchRunStore.canRunSingleIssuance"
            />
          </div>
        </div>
      </Fieldset>
    </div>

    <!-- PER BILL TYPE RUNNING - UTILITIES -->
    <div v-else-if="selectedTab === 'C'" class="flex flex-col items-center justify-start">
      <Fieldset legend="Bill Type Group Running" class="min-w-[700px] max-w-[700px]">
        <div v-focustrap class="flex flex-col gap-2">
          <InputGroup>
            <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
              <label for="invoice_date" class="font-bold w-28">
                Invoice Date
              </label>
            </InputGroupAddon>
            <DatePicker
              v-if="mainStore.currentValueDate"
              v-model="perBillTypeRunStore.perBillTypeRunForm.invoiceDate"
              dateFormat="yy/mm/dd (DD)"
              placeholder="Select..."
              :minDate="mainStore.currentValueDate"
              :readonly="ALLOW_ADVANCE_SINGLE !== 'TRUE'"
              :disabledDays="[0, 6]"
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
          <PartialUnitInquiryBillGroup v-if="perBillTypeRunStore.isShowPBLForm" />
          <InputGroup v-else>
            <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
              <label for="project_code" class="font-bold w-28">
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
          <Button @click="issuanceStore.handleActionReset('C')"
            raised
            type="reset"
            label="Reset"
          />
          <Button @click="issuanceStore.handleActionSearch('C')"
            raised
            type="submit"
            label="Search"
            icon="pi pi-search"
            :disabled="!perBillTypeRunStore.canRunSingleIssuance"
          />
        </div>
      </Fieldset>
    </div>

    <!-- PER VERIFICATION -->
    <VerificationTableForIssuance v-else-if="selectedTab === 'D'"/>
  </div>
</template>