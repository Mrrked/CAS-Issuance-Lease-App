<script lang="ts" setup>
  import { useMainStore } from '../../store/useMainStore';
  import { usePrintingStore } from '../../store/usePrintingStore';
  import { defineAsyncComponent, onMounted } from 'vue';

  const ClientDataTable = defineAsyncComponent(() => import('../../components/Reprint/ClientDataTable.vue'));
  const UnitDataTable = defineAsyncComponent(() => import('../../components/Reprint/UnitDataTable.vue'));
  const ResetButton = defineAsyncComponent(() => import('../../components/Reprint/ResetButton.vue'));
  const MainScreen = defineAsyncComponent(() => import('../../components/Reprint/MainScreen.vue'));
  const SelectInquiryType = defineAsyncComponent(() => import('../../components/Reprint/SelectInquiryType.vue'));

  const ClientInquiry1 = defineAsyncComponent(() => import('../../components/Reprint/InquiryForm/ClientInquiry1.vue'));
  const UnitInquiry1 = defineAsyncComponent(() => import('../../components/Reprint/InquiryForm/UnitInquiry1.vue'));

  const mainStore = useMainStore()
  const printStore = usePrintingStore()

  onMounted(() => {
    mainStore.fetchAllData()
  })
</script>

<template>
  <div class="flex flex-col w-full gap-3 pt-4">
    <Stepper :value="printStore.stepperPage" linear class="h-fit">
      <!-- LIST -->
      <StepList v-if="printStore.showStepper">
        <Step :value="1">Inquiry Form</Step>
        <Step :value="2">Client Account Selection</Step>
        <Step :value="3">Unit Selection</Step>
        <Step :value="4">Main Screen</Step>
      </StepList>

      <!-- PANELS -->
      <!-- QUERY CLIENT PANEL -->
      <StepPanels v-if="printStore.selectedInquiryType === 'Client Name' || printStore.selectedInquiryType === null" class="flex flex-col items-center">
        <!-- 1 -->
        <StepPanel :value="1" class="flex flex-col items-center gap-3 p-5 rounded-sm shadow-sm w-fit shadow-gray-800 ">
          <!-- SELECTOR -->
          <SelectInquiryType />
          <!-- FORM -->
          <ClientInquiry1 />
          <!-- ACTION -->
          <div class="flex justify-between w-full gap-3" v-if="printStore.selectedInquiryType !== null">
            <Button @click="printStore.handleActionReset"
              raised
              type="button"
              label="Reset"
            />
            <Button @click="printStore.handleActionSearch"
              raised
              type="button"
              label="Search"
              icon="pi pi-search"
            />
          </div>
        </StepPanel>

        <!-- 2 -->
        <StepPanel :value="2" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <!-- HEADER -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnInquiryForm"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
            <ResetButton />
          </div>
          <!-- CONTENT -->
          <div class="flex flex-col w-full">
            <ClientDataTable  />
          </div>
          <!-- ACTION -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnInquiryForm"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
          </div>
        </StepPanel>

        <!-- 3 -->
        <StepPanel :value="3" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <!-- HEADER -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnClientSelection"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
            <ResetButton />
          </div>
          <!-- CONTENT -->
          <div class="flex flex-col w-full">
            <UnitDataTable  />
          </div>
          <!-- ACTION -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnClientSelection"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
          </div>
        </StepPanel>

        <!-- 4 -->
        <StepPanel :value="4" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <MainScreen />
        </StepPanel>
      </StepPanels>

      <!-- QUERY UNIT PANEL -->
      <StepPanels v-else-if="printStore.selectedInquiryType === 'Unit'" class="flex flex-col items-center">
        <!-- 1 -->
        <StepPanel :value="1" class="flex flex-col items-center gap-3 p-5 rounded-sm shadow-sm w-fit shadow-gray-800 ">
          <!-- SELECTOR -->
          <SelectInquiryType />
          <!-- FORM -->
          <UnitInquiry1 />
          <!-- ACTION -->
          <div class="flex justify-between w-full gap-3" v-if="printStore.selectedInquiryType !== null">
            <Button @click="printStore.handleActionReset"
              raised
              type="button"
              label="Reset"
            />
            <Button @click="printStore.handleActionSearch"
              raised
              type="button"
              label="Search"
              icon="pi pi-search"
            />
          </div>
        </StepPanel>

        <!-- 2 -->
        <StepPanel :value="2" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <MainScreen />
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>