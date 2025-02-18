<script lang="ts" setup>
  import { inject, Ref } from 'vue';
  import { InvoiceRecord } from '../../../store/types';

  interface DialogRef  {
    data: {
      table_data: InvoiceRecord[],
      view: Function
      view1: Function
      submit: Function
      cancel: Function
    },
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

</script>


<template>
  <div class="flex items-end justify-between w-full">
    <Button type="button" label="PREVIEW DRAFTS" autofocus @click="dialogRef?.data.view1()"></Button>
    <div class="">
      Found
      <span class="font-bold">{{ dialogRef?.data.table_data.length }}</span>
      records
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Close" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
      <Button type="button" label="GENERATE INVOICE" autofocus @click="dialogRef?.data.submit()"></Button>
    </div>
  </div>
</template>