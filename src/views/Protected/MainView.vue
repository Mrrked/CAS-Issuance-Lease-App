<script lang="ts" setup>
  import { useCoreDataStore } from '../../store/useCoreDataStore';
  import { onMounted } from 'vue'
  import Button from 'primevue/button';
  import InputGroup from 'primevue/inputgroup';
  import InputGroupAddon from 'primevue/inputgroupaddon';
  import Fieldset from 'primevue/fieldset';
  import InputText from 'primevue/inputtext';
  import Select from 'primevue/select';
  import { useMainStore } from '../../store/useMainStore';

  import Tabs from 'primevue/tabs';
  import TabList from 'primevue/tablist';
  import Tab from 'primevue/tab';
  import TabPanels from 'primevue/tabpanels';
  import TabPanel from 'primevue/tabpanel';
  import { usePerBatchRunStore } from '../../store/usePerBatchRunStore';
  import DatePicker from 'primevue/datepicker';
  import { usePerBillTypeRunStore } from '../../store/usePerBillTypeRunStore';


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
    mainStore.handleExecuteSearch(2)
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
                  autofocus
                ></Select>
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
                  autofocus
                ></Select>
              </InputGroup>
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


    <!-- Hide -->
    <div class="flex-col items-center hidden gap-3 p-5 rounded-sm shadow-sm w-fit shadow-gray-800 ">
      <!-- FORM -->
      <!-- handleExecuteSearch(activateCallback) -->
      <form @submit.prevent="()=>{}" class="flex flex-col gap-3">

        <Fieldset legend="UNIT QUERY">
          <div class="flex flex-col gap-5">
            <InputGroup>
              <InputGroupAddon>
                <label for="project_code" class="font-bold text-content-background">
                  Project Code
                </label>
              </InputGroupAddon>
              <Select
                filter
                optionLabel="name"
                placeholder="Select one"
                class="w-full md:w-56"
                autofocus
              ></Select>
            </InputGroup>
            <InputGroup>
              <InputGroupAddon>
                <label for="payment_type" class="font-bold text-content-background">
                  Payment Type
                </label>
              </InputGroupAddon>
              <Select
                filter
                optionLabel="name"
                placeholder="Select one"
                class="w-full md:w-56"
              >
              </Select>
            </InputGroup>
            <div class="grid grid-cols-23 gap-4 max-w-[50rem]">
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
          </div>
        </Fieldset>
        <!-- ACTION -->
        <div class="flex justify-between w-full gap-3">
          <!-- handleExecuteReset(activateCallback) -->
          <Button @click="()=>{}"
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
    </div>
  </div>
</template>