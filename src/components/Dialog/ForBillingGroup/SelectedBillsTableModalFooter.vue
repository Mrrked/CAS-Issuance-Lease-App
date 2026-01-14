<script lang="ts" setup>
  import { inject, Ref } from 'vue';
  import { InvoiceRecord } from '../../../store/types';
  import { useIssuanceStore } from '../../../store/useIssuanceStore';

  interface DialogRef  {
    data: {
      invoice_date: Date
      table_data: InvoiceRecord[]
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const issuanceStore = useIssuanceStore();
</script>


<template>
  <div v-if="dialogRef" class="flex items-end justify-between w-full">
    <Button type="button" label="PREVIEW DRAFTS" autofocus @click="issuanceStore.handleActionPreviewDraftInvoice(dialogRef.data.table_data, dialogRef.data.invoice_date)"></Button>
    <div class="">
      Found
      <span class="font-bold">{{ dialogRef.data.table_data.length }}</span>
      records
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Close" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
      <Button type="button" :label="`ISSUE ${dialogRef.data.table_data.length} INVOICES`" autofocus @click="dialogRef?.data.submit()"></Button>
    </div>
  </div>
</template>