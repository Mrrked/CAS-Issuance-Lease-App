<script lang="ts" setup>
  import { inject, Ref } from 'vue';

  interface DialogRef  {
    data: {
      url: string
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);
</script>


<template>
  <div class="h-full">
    <img v-if="dialogRef" :src="dialogRef.data.url" style="width: 100%; min-height: 450px; height: auto; max-height: 100%; object-fit: contain;" ></img>
    <div v-else>
      Can't find image.
    </div>
  </div>
</template>