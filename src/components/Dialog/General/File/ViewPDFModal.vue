<script lang="ts" setup>
  import { inject, ref, Ref, watch } from 'vue';
  import { VuePDF, usePDF } from '@tato30/vue-pdf'
  import { useConfirm } from 'primevue/useconfirm';
  import { useToast } from 'primevue/usetoast';
  import { useUtilitiesStore } from '../../../../store/useUtilitiesStore';

  interface DialogRef  {
    data: {
      filename: string
      pdfURL: string | null
      printCallback: Function | null
      downloadCallback: Function | null
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const toast = useToast()
  const confirm = useConfirm()
  const utilStore = useUtilitiesStore()

  const currentPage = ref<number>(1)

  let result = usePDF(dialogRef?.value.data.pdfURL)

  const handleActionDownload = () => {
    confirm.require({
      message: 'Are you sure you want to download this file?',
      header: 'Confirm Download File',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Confirm'
      },
      accept: () => {
        const loading = utilStore.startLoadingModal('Preparing to download the file...')
        result.download(dialogRef?.value.data.filename ? dialogRef?.value.data.filename : 'file.pdf')
          .then(() => {
            if (dialogRef?.value.data.downloadCallback) {
              dialogRef?.value.data.downloadCallback()
            }
            loading.close()
          })
          .catch(() => {
            toast.add({
              summary: 'Error',
              detail: 'Failed to download the file!',
              severity: 'error',
              life: 5000
            })
          })
          .finally(() => {
            // toast.add({
            //   summary: 'Success',
            //   detail: 'File has been downloaded successfully!',
            //   severity: 'success',
            //   life: 5000
            // })
          })
      },
      reject: () => {
      }
    });
  }

  const handleActionPrint = () => {
    confirm.require({
      message: 'Are you sure you want to print this file?',
      header: 'Confirm Print File',
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: 'Confirm'
      },
      accept: () => {
        const loading = utilStore.startLoadingModal('Preparing to print the file...')
        result.print()
          .then(() => {
            if (dialogRef?.value.data.printCallback) {
              dialogRef?.value.data.printCallback()
            }
            loading.close()
          })
          .catch(() => {
            toast.add({
              summary: 'Error',
              detail: 'Failed to print the file!',
              severity: 'error',
              life: 5000
            })
          })
          .finally(() => {
            // toast.add({
            //   summary: 'Success',
            //   detail: 'File has been printed successfully!',
            //   severity: 'success',
            //   life: 5000
            // })
          })
      },
      reject: () => {
      }
    });
  }


  const handleGoFirstPage = () => {
    currentPage.value = 1
  }

  const handleGoLastPage = () => {
    currentPage.value = result.pages.value
  }

  const handleGoPrevPage = () => {
    currentPage.value = currentPage.value > 1 ? currentPage.value - 1 : currentPage.value
  }

  const handleGoNextPage = () => {
    currentPage.value = currentPage.value < result.pages.value ? currentPage.value + 1 : currentPage.value
  }

  watch(
    () => currentPage.value,
    (newVal) => {
      if (newVal < 1) {
        currentPage.value = 1
      } else if (newVal > result.pages.value) {
        currentPage.value = result.pages.value
      }
    }
  )

</script>


<template>
  <div v-if="result.pdf" class="max-w-[280px] sm:max-w-full flex flex-col gap-2">
    <!-- CONTROLS -->
    <div class="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
      <div>
        <Button
          v-if="dialogRef?.data.printCallback"
          @click="handleActionPrint"
          size="small"
          icon="pi pi-print"
          label="PRINT"
          severity="primary"
          class="w-full xs:w-fit"
        />
      </div>
      <div class="flex items-center justify-center gap-4">
        <button
          @click="handleGoFirstPage"
          :disabled="currentPage === 1"
          class="hover:scale-125 disabled:text-current pi pi-angle-double-left text-primary"
          style="font-size: 1.5rem"
        />
        <button
          @click="handleGoPrevPage"
          :disabled="currentPage === 1"
          class="hover:scale-125 disabled:text-current pi pi-angle-left text-primary"
          style="font-size: 1.5rem"
        />
        <span class="text-sm font-medium select-none w-fit shrink-0">
          Page
          <input
            type="number"
            :min="1"
            :max="result.pages.value"
            v-model="currentPage"
            class="w-10 text-lg text-center border-b-2 outline-none text-primary border-primary"
          />
          / {{ result.pages.value }}
        </span>
        <button
          @click="handleGoNextPage"
          :disabled="currentPage === result.pages.value"
          class="hover:scale-125 disabled:text-current pi pi-angle-right text-primary"
          style="font-size: 1.5rem"
        />
        <button
          @click="handleGoLastPage"
          :disabled="currentPage === result.pages.value"
          class="hover:scale-125 disabled:text-current pi pi-angle-double-right text-primary"
          style="font-size: 1.5rem"
        />
      </div>
      <div class="text-right">
        <Button
          v-if="dialogRef?.data.downloadCallback"
          @click="handleActionDownload"
          size="small"
          icon="pi pi-download"
          label="DOWNLOAD"
          severity="primary"
          class="w-full xs:w-fit"
        />
      </div>
    </div>
    <!-- PREVIEW -->
    <div class="flex justify-center w-full py-5 overflow-auto bg-gray-600 resize-none shrink-0 border-rounded">
      <div class="bg-white max-w-[95%] min-w-[95%] h-full">
        <VuePDF :pdf="result.pdf.value" :page="currentPage" fit-parent :scale="1"/>
      </div>
    </div>
  </div>
  <div v-else>
    Can't find pdf.
  </div>
</template>