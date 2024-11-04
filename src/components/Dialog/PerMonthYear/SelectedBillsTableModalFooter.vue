<script lang="ts" setup>
  import Button from 'primevue/button';
  import { inject, Ref } from 'vue';

  interface DialogRef  {
    data: {
      table_data: any[],
      table_column: any[],
      view: Function
      view1: Function
      submit: Function
      cancel: Function
    },
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

</script>


<template>
  <div class="flex justify-between w-full">
    <div class="flex gap-2">
      <Button type="button" label="PRINT DRAFT" @click="dialogRef?.data.view1()"></Button>
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Close" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
      <Button type="button" label="PRINT FINAL" autofocus @click="dialogRef?.data.submit()"></Button>
    </div>
  </div>
</template>