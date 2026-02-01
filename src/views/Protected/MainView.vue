<script lang="ts" setup>
  // import { usePerBillTypeRunStore } from '../../store/usePerBillTypeRunStore';
  // import { usePerBatchRunStore } from '../../store/usePerBatchRunStore';
  import { useIssuanceStore } from '../../store/useIssuanceStore';
  import { useMainStore } from '../../store/useMainStore';
  import { defineAsyncComponent, onMounted, ref, watch } from 'vue'
  import { useUtilitiesStore } from '../../store/useUtilitiesStore';
  import { useSessionStore } from '../../store/useSessionStore';
  import { useForBillingGroupStore } from '../../store/useForBillingGroupStore';
  import { useForRecordingGroupStore } from '../../store/useForRecordingGroupStore';

  const BatchReprinting = defineAsyncComponent(() => import('../../components/Reprint/BatchReprinting.vue'))
  const VerificationTableForIssuance = defineAsyncComponent(() => import('../../components/Issuance/Verification/VerificationTableForIssuance.vue'))
  // const PartialUnitInquiryBillGroup = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiryBillGroup.vue'))
  // const PartialUnitInquiryBatch = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiryBatch.vue'))
  const PartialUnitInquiryForBillingGroup = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiryForBillingGroup.vue'))
  const PartialUnitInquiryForRecordingGroup = defineAsyncComponent(() => import('../../components/Issuance/InquiryForm/PartialUnitInquiryForRecordingGroup.vue'))

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const sessionStore = useSessionStore()
  const issuanceStore = useIssuanceStore()
  const forBillingGroupStore = useForBillingGroupStore()
  const forRecordingGroupStore = useForRecordingGroupStore()

  // const ALLOW_ADVANCE_BATCH = import.meta.env.VITE_ALLOW_ADVANCE_BATCH || 'FALSE';
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
      } else if (sessionStore.userHasPermissionForTabB) {
        selectedTab.value = 'B'
      } else if (sessionStore.userHasPermissionForTabC) {
        selectedTab.value = 'C'
      } else if (sessionStore.userHasPermissionForTabD) {
        selectedTab.value = 'D'
      } else {
        selectedTab.value = ''
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
          <Tab :value="'A'" v-if="sessionStore.userHasPermissionForTabA">Billing Group</Tab>
          <Tab :value="'B'" v-if="sessionStore.userHasPermissionForTabB">Recording Group</Tab>
          <Tab :value="'C'" v-if="sessionStore.userHasPermissionForTabC">Run Per Verification</Tab>
          <Tab :value="'D'" v-if="sessionStore.userHasPermissionForTabD">Batch Reprinting</Tab>
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

    <!-- FOR BILLING GROUP -->
    <div v-if="selectedTab === 'A'" class="flex flex-col items-center justify-start">
      <Fieldset legend="For Billing Group" class="min-w-[700px] max-w-[700px]">
        <div class="flex flex-col">
          <div v-focustrap class="flex flex-col gap-2">
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="invoice_date" class="font-bold w-28">
                  Invoice Date
                </label>
              </InputGroupAddon>
              <DatePicker
                v-if="mainStore.currentValueDate"
                v-model="forBillingGroupStore.forBillingGroupForm.invoiceDate"
                dateFormat="yy/mm/dd (DD)"
                placeholder="Select..."
                :minDate="mainStore.currentValueDate"
                :readonly="ALLOW_ADVANCE_SINGLE !== 'TRUE'"
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
                v-model="forBillingGroupStore.forBillingGroupForm.billType"
                :options="forBillingGroupStore.BILL_TYPE_OPTIONS"
                optionLabel="name"
                placeholder="Select..."
              ></Select>
            </InputGroup>
            <PartialUnitInquiryForBillingGroup v-if="forBillingGroupStore.isShowPBLForm" />
            <InputGroup v-else>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="project_code" class="font-bold w-28">
                  Project Code
                </label>
              </InputGroupAddon>
              <Select
                ref="indexRef"
                v-model="forBillingGroupStore.forBillingGroupForm.projectCode"
                :options="mainStore.getProjectCodeOptions"
                optionLabel="option_name"
                placeholder="Select one"
                class="w-full uppercase md:w-56"
                editable
              ></Select>
            </InputGroup>
          </div>

          <div class="flex justify-between w-full gap-3 mt-5">
            <Button @click="issuanceStore.handleActionReset('A')"
              raised
              type="reset"
              label="Reset"
            />
            <Button @click="issuanceStore.handleActionSearch('A')"
              raised
              type="submit"
              label="Search"
              icon="pi pi-search"
              :disabled="!forBillingGroupStore.canRunIssuance"
            />
          </div>
        </div>
      </Fieldset>
    </div>

    <!-- FOR RECORDING GROUP -->
    <div v-if="selectedTab === 'B'" class="flex flex-col items-center justify-start">
      <Fieldset legend="For Recording Group" class="min-w-[700px] max-w-[700px]">
        <div class="flex flex-col">
          <div v-focustrap class="flex flex-col gap-2">
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="invoice_date" class="font-bold w-28">
                  Invoice Date
                </label>
              </InputGroupAddon>
              <DatePicker
                v-if="mainStore.currentValueDate"
                v-model="forRecordingGroupStore.forRecordingGroupForm.invoiceDate"
                dateFormat="yy/mm/dd (DD)"
                placeholder="Select..."
                :minDate="mainStore.currentValueDate"
                :readonly="ALLOW_ADVANCE_SINGLE !== 'TRUE'"
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
                v-model="forRecordingGroupStore.forRecordingGroupForm.billType"
                :options="forRecordingGroupStore.BILL_TYPE_OPTIONS"
                optionLabel="name"
                placeholder="Select..."
              ></Select>
            </InputGroup>
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="project_code" class="font-bold w-28">
                  Company
                </label>
              </InputGroupAddon>
              <Select
                ref="indexRef"
                v-model="forRecordingGroupStore.forRecordingGroupForm.company"
                :options="mainStore.getCompanyCodeOptions"
                optionLabel="option_name"
                placeholder="Select one"
                class="w-full md:w-56"
                :disabled="!!forRecordingGroupStore.forRecordingGroupForm.projectCode"
              ></Select>
            </InputGroup>
            <InputGroup>
              <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                <label for="project_code" class="font-bold w-28">
                  Project Code
                </label>
              </InputGroupAddon>
              <Select
                ref="indexRef"
                v-model="forRecordingGroupStore.forRecordingGroupForm.projectCode"
                :options="
                  mainStore.getProjectCodeOptions
                  .filter((project) => !['CL1', 'CL2', 'CL3'].includes(project.PROJCD))
                "
                optionLabel="option_name"
                placeholder="Select one"
                class="w-full uppercase md:w-56"
                editable
                :disabled="!!forRecordingGroupStore.forRecordingGroupForm.company"
              ></Select>
            </InputGroup>
            <PartialUnitInquiryForRecordingGroup v-if="forRecordingGroupStore.forRecordingGroupForm.projectCode?.PROJCD" />
          </div>

          <div class="flex justify-between w-full gap-3 mt-5">
            <Button @click="issuanceStore.handleActionReset('B')"
              raised
              type="reset"
              label="Reset"
            />
            <Button @click="issuanceStore.handleActionSearch('B')"
              raised
              type="submit"
              label="Search"
              icon="pi pi-search"
              :disabled="!forRecordingGroupStore.canRunIssuance"
            />
          </div>
        </div>
      </Fieldset>
    </div>

    <!-- PER VERIFICATION -->
    <VerificationTableForIssuance v-else-if="selectedTab === 'C'"/>

    <!-- BATCH REPRINTING -->
    <BatchReprinting v-else-if="selectedTab === 'D'"/>
  </div>
</template>