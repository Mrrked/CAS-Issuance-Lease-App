<script setup lang="ts">
  import { defineAsyncComponent } from "vue";
  import { usePrintingStore } from "../../store/usePrintingStore";

  const ResetButton = defineAsyncComponent(() => import('./ResetButton.vue'));
  const HistoryOfIssuedDocumentsDataTable = defineAsyncComponent(() => import('./HistoryOfIssuedDocumentsDataTable.vue'));

  defineProps<{
    activateCallback: Function
  }>()

  const printStore = usePrintingStore();

  const {
    handleActionRefresh,

    handleActionViewBillTypes,
    handleActionViewLedgerRemarks,
  } = printStore;

</script>


<template>
  <!-- HEADER -->
  <div class="grid w-full grid-cols-8 gap-3">
    <div class="flex items-start justify-start col-span-2 gap-3">
      <Button
        v-if="printStore.config.selectedOption === 'By Project | Block | Lot'"
        @click="printStore.handleActionReturnInquiryForm(activateCallback)"
        raised
        type="button"
        label="BACK"
        icon="pi pi-arrow-left"
      />
      <Button
        v-if="printStore.config.selectedOption === 'By Client\'s Name'"
        @click="printStore.handleActionReturnUnitSelection(activateCallback)"
        raised
        type="button"
        label="BACK"
        icon="pi pi-arrow-left"
      />
      <ResetButton v-if="printStore.config.selectedOption === 'By Client\'s Name'" :activateCallback="activateCallback"/>
      <Button
        @click="handleActionRefresh"
        raised
        type="button"
        icon="pi pi-refresh"
      />
    </div>
    <div class="flex flex-col items-center justify-center col-span-4">
      <div class="text-lg font-bold text-center">
        {{ printStore.getSelectedClientUnit.client_name }}
      </div>
    </div>
    <div class="flex items-center justify-end col-span-2">
    </div>
  </div>
  <!-- CONTENT -->
  <div class="flex flex-col w-full gap-5">
    <!-- INFORMATION -->
    <div class="flex flex-col gap-1">
      <div class="grid w-full px-2 pb-1 text-sm rounded-sm grid-cols-24 gap-x-10 ">

        <div class="flex flex-col col-span-8">
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              Project/Block/Lot :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.pbl }}
            </div>
          </div>
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              Client Key :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.client_key }}
            </div>
          </div>
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              Temporary Client Number :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.tcltno }}
            </div>
          </div>
        </div>

        <div class="flex flex-col col-span-8">
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              Company :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.company_code }}
            </div>
          </div>
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              TIN :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.tin }}
            </div>
          </div>
        </div>

        <div class="flex flex-col col-span-8">
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              Sale Type :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.sale_type }}
            </div>
          </div>
          <div class="flex items-center justify-between col-span-1 gap-2 py-1 pr-2">
            <div class="font-bold shrink-0 w-fit">
              Lease Type :
            </div>
            <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
              {{ printStore.getSelectedClientUnit.lease_type }}
            </div>
          </div>
        </div>

      </div>
      <div class="flex justify-between px-2 text-sm">
        <div class="flex gap-2">
          <Button @click="printStore.handleActionViewHistoryOfPayments(printStore.history_of_payments_data)"
            size="small"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
            </svg>
            History of Payments
          </Button>
        </div>
        <div class="flex gap-2">
          <Button @click="handleActionViewLedgerRemarks"
            size="small"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
            </svg>
            Remarks
          </Button>
          <Button @click="handleActionViewBillTypes"
            size="small"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
            </svg>
            Bill Types
          </Button>
        </div>
      </div>
    </div>
    <!-- TABLES -->
    <div class="flex flex-col gap-5">
      <HistoryOfIssuedDocumentsDataTable />
    </div>
  </div>
</template>