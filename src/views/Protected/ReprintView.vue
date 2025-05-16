<script lang="ts" setup>
  import { useMainStore } from '../../store/useMainStore';
  import { usePrintingStore } from '../../store/usePrintingStore';
  import { defineAsyncComponent, nextTick, onMounted, ref } from 'vue';

  const ClientDataTable = defineAsyncComponent(() => import('../../components/Reprint/ClientDataTable.vue'));
  const UnitDataTable = defineAsyncComponent(() => import('../../components/Reprint/UnitDataTable.vue'));
  const ResetButton = defineAsyncComponent(() => import('../../components/Reprint/ResetButton.vue'));
  const MainScreen = defineAsyncComponent(() => import('../../components/Reprint/MainScreen.vue'));

  const mainStore = useMainStore()
  const printStore = usePrintingStore()

  const blockLength = 2;
  const blockKeys = ['1', '2'] as const
  const blockRefs = ref<(HTMLInputElement | null)[]>([]);

  const lotLength = 4;
  const lotKeys = ['1', '2', '3', '4'] as const
  const lotRefs = ref<(HTMLInputElement | null)[]>([]);

  const unitCodeLength = 2;
  const unitCodeKeys = ['1', '2'] as const
  const unitCodeRefs = ref<(HTMLInputElement | null)[]>([]);

  const onInputBlock = (index: number) => {
    const current = printStore.queryUnitForm.block[blockKeys[index]];
    if (current.length === 1 && index < blockLength - 1) {
      nextTick(() => blockRefs.value[index + 1]?.focus());
    }
  }

  const onBackspaceBlock = (index: number) => {
    if (printStore.queryUnitForm.block[blockKeys[index]] === '' && index > 0) {
      nextTick(() => blockRefs.value[index - 1]?.focus());
    }
  }

  const onInputLot = (index: number) => {
    const current = printStore.queryUnitForm.lot[lotKeys[index]];
    if (current.length === 1 && index < lotLength - 1) {
      nextTick(() => lotRefs.value[index + 1]?.focus());
    }
  }

  const onBackspaceLot = (index: number) => {
    if (printStore.queryUnitForm.lot[lotKeys[index]] === '' && index > 0) {
      nextTick(() => lotRefs.value[index - 1]?.focus());
    }
  }

  const onInputUnitCode = (index: number) => {
    const current = printStore.queryUnitForm.unit_code[unitCodeKeys[index]];
    if (current.length === 1 && index < unitCodeLength - 1) {
      nextTick(() => unitCodeRefs.value[index + 1]?.focus());
    }
  }

  const onBackspaceUnitCode = (index: number) => {
    if (printStore.queryUnitForm.unit_code[unitCodeKeys[index]] === '' && index > 0) {
      nextTick(() => unitCodeRefs.value[index - 1]?.focus());
    }
  }

  onMounted(() => {
    mainStore.fetchAllData()
  })
</script>

<template>
  <div class="flex flex-col w-full gap-3 pt-4">
    <!-- HEADER -->

    <Stepper value="1" linear class="h-fit">
      <!-- LIST -->
      <StepList v-if="printStore.showStepper">
        <Step value="1">Inquiry Form</Step>
        <Step value="2">Client Account Selection</Step>
        <Step value="3">Unit Selection</Step>
        <Step value="4">Main Screen</Step>
      </StepList>

      <!-- PANELS -->
      <!-- QUERY CLIENT PANEL -->
      <StepPanels v-if="printStore.config.selectedOption === 'By Client\'s Name' || printStore.config.selectedOption === null" class="flex flex-col items-center">
        <!-- 1 -->
        <StepPanel v-slot="{ activateCallback }" value="1" class="flex flex-col items-center gap-3 p-5 rounded-sm shadow-sm w-fit shadow-gray-800 ">
          <!-- SELECTOR -->
          <div class="flex items-center w-full gap-10">
            <span class="font-bold">
              Select Inquiry Type:
            </span>
            <SelectButton
              v-model="printStore.config.selectedOption"
              :options="printStore.config.options"
              aria-labelledby="basic"
            />
          </div>
          <!-- FORM -->
          <form v-if="printStore.config.selectedOption" @submit.prevent="printStore.handleActionSearch(activateCallback)" class="flex flex-col w-full gap-3">
            <!-- FIELD -->
            <Fieldset legend="CLIENT QUERY">
              <div class="flex flex-col gap-3">
                <div class="grid grid-cols-4 gap-3 ">
                  <InputGroup class="col-span-4">
                    <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                      <label for="name" class="font-bold">
                        Name
                      </label>
                    </InputGroupAddon>
                    <InputText
                      v-model="printStore.queryClientForm.name"
                      class="w-full uppercase"
                      autofocus
                      autocomplete="off"
                      aria-autocomplete="none"
                      placeholder="ex. John F. Smith"
                    />
                  </InputGroup>
                </div>
              </div>
            </Fieldset>
            <!-- ACTION -->
            <div class="flex justify-between w-full gap-3" v-if="printStore.config.selectedOption !== null">
              <Button @click="printStore.handleActionReset(activateCallback)"
                raised
                type="reset"
                label="Reset"
              />
              <Button
                raised
                type="submit"
                label="Search"
                icon="pi pi-search"
              />
            </div>
          </form>
        </StepPanel>

        <!-- 2 -->
        <StepPanel v-slot="{ activateCallback }" value="2" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <!-- HEADER -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnInquiryForm(activateCallback)"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
            <ResetButton :activateCallback="activateCallback"/>
          </div>
          <!-- CONTENT -->
          <div class="flex flex-col w-full">
            <ClientDataTable :activateCallback="activateCallback" />
          </div>
          <!-- ACTION -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnInquiryForm(activateCallback)"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
          </div>
        </StepPanel>

        <!-- 3 -->
        <StepPanel v-slot="{ activateCallback }" value="3" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <!-- HEADER -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnClientSelection(activateCallback)"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
            <ResetButton :activateCallback="activateCallback"/>
          </div>
          <!-- CONTENT -->
          <div class="flex flex-col w-full">
            <UnitDataTable :activateCallback="activateCallback" />
          </div>
          <!-- ACTION -->
          <div class="flex justify-start w-full gap-3">
            <Button @click="printStore.handleActionReturnClientSelection(activateCallback)"
              raised
              type="button"
              label="BACK"
              icon="pi pi-arrow-left"
            />
          </div>
        </StepPanel>

        <!-- 4 -->
        <StepPanel v-slot="{ activateCallback }" value="4" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <MainScreen :activateCallback="activateCallback" />
        </StepPanel>
      </StepPanels>

      <!-- QUERY UNIT PANEL -->
      <StepPanels v-else-if="printStore.config.selectedOption === 'By Project | Block | Lot'" class="flex flex-col items-center">
        <!-- 1 -->
        <StepPanel v-slot="{ activateCallback }" value="1" class="flex flex-col items-center gap-3 p-5 rounded-sm shadow-sm w-fit shadow-gray-800 ">
          <!-- SELECTOR -->
          <div class="flex items-center w-full gap-10">
            <span class="font-bold">
              Select Inquiry Type:
            </span>
            <SelectButton
              v-model="printStore.config.selectedOption"
              :options="printStore.config.options"
              aria-labelledby="basic"
            />
          </div>
          <!-- FORM -->
          <form @submit.prevent="printStore.handleActionSearch(activateCallback)" class="flex flex-col gap-3">
            <!-- FIELD -->
            <Fieldset legend="UNIT QUERY">
              <div class="flex flex-col gap-5">
                <InputGroup>
                  <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
                    <label for="project_code" class="font-bold">
                      Project Code
                    </label>
                  </InputGroupAddon>
                  <Select
                    v-model="printStore.queryUnitForm.project_code"
                    :options="mainStore.getProjectCodeOptions"
                    filter
                    filter-placeholder="Search Project"
                    optionLabel="option_name"
                    placeholder="Select one"
                    class="w-full md:w-56"
                    autofocus
                  ></Select>
                </InputGroup>
                <div class="grid grid-cols-23 gap-4 max-w-[50rem] h-20">
                  <div class="flex flex-col items-center justify-center col-span-3 gap-2">
                    <label name="pcs_code" class="font-bold text-center">
                      PCS Code
                    </label>
                    <input
                      v-model="printStore.queryUnitForm.pcs_code"
                      maxlength="1"
                      class="h-full text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
                    />
                  </div>
                  <div class="flex flex-col items-center justify-center col-span-3 gap-2">
                    <label name="phase" class="font-bold text-center">
                      Phase
                    </label>
                    <input
                      v-model="printStore.queryUnitForm.phase"
                      maxlength="1"
                      class="h-full text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
                    />
                  </div>
                  <div class="flex flex-col items-center justify-center col-span-4 gap-2">
                    <label name="block" class="font-bold text-center">
                      Block
                    </label>
                    <div class="flex h-full gap-1">
                      <input
                        v-for="(value, index) in blockKeys"
                        :key="index"
                        v-model="printStore.queryUnitForm.block[value]"
                        ref="blockRefs"
                        maxlength="1"
                        @input="onInputBlock(index)"
                        @keydown.backspace="onBackspaceBlock(index)"
                        class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
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
                    <div class="flex h-full gap-1">
                      <input
                        v-for="(value, index) in lotKeys"
                        :key="index"
                        v-model="printStore.queryUnitForm.lot[value]"
                        ref="lotRefs"
                        maxlength="1"
                        @input="onInputLot(index)"
                        @keydown.backspace="onBackspaceLot(index)"
                        class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
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
                    <div class="flex h-full gap-1">
                      <input
                        v-for="(value, index) in unitCodeKeys"
                        :key="index"
                        v-model="printStore.queryUnitForm.unit_code[value]"
                        ref="unitCodeRefs"
                        maxlength="1"
                        @input="onInputUnitCode(index)"
                        @keydown.backspace="onBackspaceUnitCode(index)"
                        class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Fieldset>
            <!-- ACTION -->
            <div class="flex justify-between w-full gap-3" v-if="printStore.config.selectedOption !== null">
              <Button @click="printStore.handleActionReset(activateCallback)"
                raised
                type="reset"
                label="Reset"
              />
              <Button
                raised
                type="submit"
                label="Search"
                icon="pi pi-search"
              />
            </div>
          </form>
        </StepPanel>

        <!-- 2 -->
        <StepPanel v-slot="{ activateCallback }" value="2" class="flex flex-col items-center w-full gap-3 p-5 rounded-sm shadow-sm shadow-gray-800 ">
          <MainScreen :activateCallback="activateCallback" />
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>