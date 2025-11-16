<script setup lang="ts">
  import { useConfirm } from "primevue/useconfirm";
  import { usePrintingStore } from "../../store/usePrintingStore";

  const confirm = useConfirm();
  const printStore = usePrintingStore();

  const reset_action = (event: MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    confirm.require({
      target: target,
      message: 'Are you sure you want to reset the whole form?',
      header: 'Confirm Reset Form',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
      },
      acceptProps: {
        label: 'Confirm'
      },
      accept: () => {
        printStore.handleActionReset()
      },
      reject: () => {
      }
    });
  };
</script>


<template>
  <Button @click="reset_action($event)"
    raised
    type="button"
    label="RESET"
  />
</template>