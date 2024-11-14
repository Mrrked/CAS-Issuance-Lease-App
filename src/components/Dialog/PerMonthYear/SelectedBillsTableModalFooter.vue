<script lang="ts" setup>
  import Button from 'primevue/button';
  import { inject, Ref } from 'vue';

  interface DialogRef  {
    data: {
      table_data: any[],
      table_column: any[],
      view: Function
      submit: Function
      cancel: Function
    },
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

</script>


<template>
  <div class="flex items-end justify-between w-full">
    <div class="">
      Found
      <span class="font-bold">{{ dialogRef?.data.table_data.length }}</span>
      records for issuance
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Close" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
      <Button type="button" label="GENERATE INVOICE" autofocus @click="dialogRef?.data.submit()"></Button>
    </div>
  </div>
</template>