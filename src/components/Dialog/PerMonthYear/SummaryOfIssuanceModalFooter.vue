<script lang="ts" setup>
  import { inject, Ref } from 'vue';
  import Button from 'primevue/button';

  interface DialogRef  {
    data: {
      pdfBlob: Blob
      exportToXLSX: Function
      download: Function
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

</script>


<template>
  <div class="flex justify-between w-full">
    <Button v-if="dialogRef" type="button" label="Export to XLSX" @click="dialogRef.data.exportToXLSX()"></Button>
    <Button v-if="dialogRef" type="button" label="Save Copy as PDF" @click="dialogRef.data.download()"></Button>
  </div>
</template>