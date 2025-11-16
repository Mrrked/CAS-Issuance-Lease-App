<script setup lang="ts">
  import { defineAsyncComponent } from 'vue';
  import { usePrintingStore } from '../../store/usePrintingStore';

  const ScreenYLease = defineAsyncComponent(() => import('./ScreenYLease.vue'));

  const printStore = usePrintingStore()
</script>

<template>
  <!-- HEADER -->
  <ScreenYLease />
  <!-- ACTION -->
  <div v-if="printStore.selectedInquiryType === 'Unit'"
    class="flex justify-start w-full gap-3"
  >
    <Button @click="printStore.handleActionReturnInquiryForm()"
      raised
      type="button"
      label="BACK"
      icon="pi pi-arrow-left"
    />
  </div>
  <div v-else-if="printStore.selectedInquiryType === 'Client Name'"
    class="flex justify-start w-full gap-3"
  >
    <Button @click="printStore.handleActionReturnUnitSelection()"
      raised
      type="button"
      label="BACK"
      icon="pi pi-arrow-left"
    />
  </div>
</template>