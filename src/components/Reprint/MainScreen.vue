<script setup lang="ts">
  import { defineAsyncComponent } from 'vue';
  import { usePrintingStore } from '../../store/usePrintingStore';

  const ScreenYLease = defineAsyncComponent(() => import('./ScreenYLease.vue'));

  defineProps<{
    activateCallback: Function
  }>()

  const printStore = usePrintingStore()
</script>

<template>
  <!-- HEADER -->
  <ScreenYLease :activateCallback="activateCallback" />
  <!-- ACTION -->
  <div v-if="printStore.config.selectedOption === 'By Project | Block | Lot'"
    class="flex justify-start w-full gap-3"
  >
    <Button @click="printStore.handleActionReturnInquiryForm(activateCallback)"
      raised
      type="button"
      label="BACK"
      icon="pi pi-arrow-left"
    />
  </div>
  <div v-else-if="printStore.config.selectedOption === 'By Client\'s Name'"
    class="flex justify-start w-full gap-3"
  >
    <Button @click="printStore.handleActionReturnUnitSelection(activateCallback)"
      raised
      type="button"
      label="BACK"
      icon="pi pi-arrow-left"
    />
  </div>
</template>