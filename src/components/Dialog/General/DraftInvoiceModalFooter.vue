<script lang="ts" setup>
  import { inject, Ref } from 'vue';

  interface DialogRef  {
    data: {
      pdfBlob: Blob
      download: Function
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

</script>


<template>
  <div>
    <Button v-if="dialogRef" type="button" icon="pi pi-download" label="Download Copy" @click="dialogRef.data.download()"></Button>
  </div>
</template>