<script lang="ts" setup>
  import { computed, inject, Ref } from 'vue';
  import { CheckDetails } from '../../../store/types';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';

  interface DialogRef  {
    data: {
      check_details: CheckDetails
      submit: Function
      cancel: Function
    },
  }

  const utilStore = useUtilitiesStore()

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const data = computed(() => {
    return dialogRef?.value.data.check_details
  })

</script>


<template>
  <div v-if="data" class="flex flex-col gap-5 text-sm" >
    <!-- ROW 1 -->
    <div class="flex flex-col gap-1">
      <div class="grid grid-cols-3">
        <div class="col-span-2 font-bold">
          Check Number :
        </div>
        <div class="text-right ">
          {{ data.CHKNUM || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Bank Code :
        </div>
        <div class="text-right ">
          {{ data.BNCODE || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Bank Branch :
        </div>
        <div class="text-right ">
          {{ data.BNKBR || '-' }}
        </div>
      </div>
    </div>
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Check Date :
        </div>
        <div class="text-right ">
          {{ data.DATCHK ? utilStore.formatDateNumberToStringYYYYMMDD(data.DATCHK) : '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Check Amount :
        </div>
        <div class="text-right ">
          {{ data.CHKAMT ? utilStore.formatNumberToString2DecimalNumber(data.CHKAMT) : '0.00' }}
        </div>
      </div>
    </div>
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Bank Code :
        </div>
        <div class="text-right ">
          {{ data.BANKCD || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Bank Account :
        </div>
        <div class="text-right ">
          {{ data.BNKACT || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Return Check Code :
        </div>
        <div class="text-right ">
          {{ data.RETCOD || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Remarks Code :
        </div>
        <div class="text-right ">
          {{ data.REMCOD || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Action :
        </div>
        <div class="text-right ">
          {{ data.ACTION || '-' }}
        </div>
      </div>
    </div>
  </div>
</template>