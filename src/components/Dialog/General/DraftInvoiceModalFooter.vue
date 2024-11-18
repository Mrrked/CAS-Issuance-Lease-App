<script lang="ts" setup>
  import { inject, Ref } from 'vue';
  import Button from 'primevue/button';

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
    <Button v-if="dialogRef" type="button" label="Download Copy" @click="dialogRef.data.download()"></Button>
  </div>
</template>