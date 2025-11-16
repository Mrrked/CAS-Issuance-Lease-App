<script lang="ts" setup>
  import { usePrintingStore } from '../../store/usePrintingStore';

  const printStore = usePrintingStore()
</script>

<template>
  <div class="flex items-center w-full gap-10">
    <span class="font-bold">
      Select Inquiry Type:
    </span>
    <SelectButton
      v-model="printStore.selectedInquiryType"
      :options="printStore.INQUIRY_TYPES"
      option-value="value"
      option-label="label"
      aria-labelledby="basic"
    />
  </div>
</template>