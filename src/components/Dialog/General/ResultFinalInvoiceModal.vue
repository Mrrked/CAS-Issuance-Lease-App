<script lang="ts" setup>
  import { computed, inject, Ref } from 'vue';
  import Button from 'primevue/button';
  import { InvoiceRecord, FAILED_INVOICE_RECORDS } from '../../../store/types';

  interface DialogRef  {
    data: {
      issuedInvoiceRecords: InvoiceRecord[]
      failedInvoiceRecords: FAILED_INVOICE_RECORDS
      downloadFailedInvoices: Function
      viewSummarySuccessInvoices: Function
      viewSuccessInvoices: Function
      cancel: Function
    }
  }

  const hasIssuedInvoices = computed(() => {
    if (dialogRef) {
      return dialogRef?.value.data.issuedInvoiceRecords.length > 0
    }
    return false
  })

  const hasFailedInvoices = computed(() => {
    if (dialogRef) {
      return dialogRef?.value.data.failedInvoiceRecords.FAILED_INVOICES_LENGTH > 0
    }
    return false
  })

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

</script>


<template>
  <div class="pt-4 text-xl font-bold">
    (Per Batch) Issued Invoices Results
  </div>
  <div class="flex flex-col my-4">
    <div class="flex items-end gap-3">
      <div class="w-10 text-xl font-bold text-right">
        {{ dialogRef?.data.issuedInvoiceRecords.length || 0 }}
      </div>
      <div>
        invoices has been issued successfully.
      </div>
    </div>
    <div v-if="hasFailedInvoices" class="flex items-end gap-3">
      <div class="w-10 text-xl font-bold text-right">
        {{ dialogRef?.data.failedInvoiceRecords.FAILED_INVOICES_LENGTH || 0 }}
      </div>
      <div>
        invoices encountered error during the issuance process.
      </div>
    </div>
  </div>
  <div v-if="dialogRef" class="flex justify-between w-full">
    <div class="flex gap-2">
      <Button v-if="hasIssuedInvoices" type="button" icon="pi pi-eye" label="Summary Report" severity="primary" @click="dialogRef.data.viewSummarySuccessInvoices()"></Button>
      <Button v-if="hasFailedInvoices" type="button" icon="pi pi-download" label="Error Logs"  severity="primary" @click="dialogRef.data.downloadFailedInvoices()"></Button>
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Close" severity="secondary" @click="dialogRef.data.cancel()"></Button>
      <Button v-if="hasIssuedInvoices" type="button" label="View All Invoices" severity="primary" @click="dialogRef.data.viewSuccessInvoices()"></Button>
    </div>
  </div>
</template>