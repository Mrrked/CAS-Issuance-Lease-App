<script lang="ts" setup>
  import { inject, onMounted, Ref } from 'vue';

  interface DialogRef  {
    data: {
      pdfBlob: Blob
      download: Function
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  onMounted(async () => {
    if (dialogRef?.value ) {

      const previewElement = document.getElementById('pdf-preview') as HTMLIFrameElement;
      const pdfUrl = URL.createObjectURL(dialogRef.value.data.pdfBlob);

      if (previewElement) {
        previewElement.src = pdfUrl;
      }
    }
  })

</script>


<template>
  <div>
    <iframe id="pdf-preview" style="width: 100%; height: 450px;" class="border border-black"></iframe>
  </div>
</template>