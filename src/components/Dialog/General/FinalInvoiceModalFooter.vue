<script lang="ts" setup>
  import { computed, inject, Ref } from 'vue';
  import Button from 'primevue/button';
  import { FAILED_INVOICE_RECORDS } from '../../../store/types';

  interface DialogRef  {
    data: {
      pdfBlob: Blob
      failedInvoiceRecords: FAILED_INVOICE_RECORDS,
      download: Function
      downloadErrorLogs: Function
      viewSummary: Function
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const getNoFailedInvoices = computed(() => {
    if (dialogRef) {
      return dialogRef.value.data.failedInvoiceRecords.records.length || 0
    }
    return 0
  })
</script>


<template>
  <div v-if="dialogRef" class="flex items-center justify-between w-full">
    <div class="flex items-center gap-2">
      <Button type="button" icon="pi pi-eye" label="View Summary" @click="dialogRef.data.viewSummary()"></Button>
      <Button v-if="getNoFailedInvoices" type="button" icon="pi pi-download" label="Error Logs" @click="dialogRef.data.downloadErrorLogs()"></Button>
      <div class="w-40 text-sm">
        {{ getNoFailedInvoices }} records has failed during issuance.
      </div>
    </div>

    <Button type="button" icon="pi pi-download" label="Download Copy" @click="dialogRef.data.download()"></Button>
  </div>
</template>