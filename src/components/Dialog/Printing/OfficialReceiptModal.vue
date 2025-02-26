<script lang="ts" setup>
  import { computed, inject, Ref } from 'vue';
  import { HistoryOfPayment } from '../../../store/types';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';

  interface DialogRef  {
    data: {
      or_record: HistoryOfPayment
      submit: Function
      cancel: Function
    },
  }

  const utilStore = useUtilitiesStore()

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const data = computed(() => {
    return dialogRef?.value.data.or_record
  })

</script>


<template>
  <div v-if="data" class="grid grid-cols-6 text-sm gap-x-12 gap-y-8" >
    <!-- ROW 1 -->
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          O.R. Key :
        </div>
        <div class="text-right whitespace-pre">
          {{ data.OR_KEY || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Proj/Blk/Lot :
        </div>
        <div class="text-right whitespace-pre">
          {{ data.PBL_KEY || '-' }}
        </div>
      </div>
    </div>
    <div class="col-span-3">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Payee Name :
        </div>
        <div class="text-right">
          {{ data.PAYEE || '-' }}
        </div>
      </div>
    </div>

    <!-- ROW 2 -->
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          O.R. Amount :
        </div>
        <div class="text-right ">
          {{ data.ORAMT ? utilStore.formatNumberToString2DecimalNumber(data.ORAMT) : '0.00' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Pay Type :
        </div>
        <div class="text-right ">
          {{ data.PAYTYP || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-3">
        <div class="col-span-2 font-bold">
          No. of Months :
        </div>
        <div class="text-right ">
          {{ data.NOMOS || '0' }}
        </div>
      </div>
    </div>
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          O.R. Date :
        </div>
        <div class="text-right ">
          {{ data.DATOR ? utilStore.formatDateNumberToStringYYYYMMDD(data.DATOR) : '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Value Date :
        </div>
        <div class="text-right ">
          {{ data.DATVAL ? utilStore.formatDateNumberToStringYYYYMMDD(data.DATVAL) : '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Cancel Date :
        </div>
        <div class="text-right ">
          {{ data.DATCAN ? utilStore.formatDateNumberToStringYYYYMMDD(data.DATCAN) : '-' }}
        </div>
      </div>
    </div>

    <!-- ROW 3 -->
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Cash Amount :
        </div>
        <div class="text-right ">
          {{ data.CSHAMT ? utilStore.formatNumberToString2DecimalNumber(data.CSHAMT) : '0.00' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Check Amount :
        </div>
        <div class="text-right ">
          {{ data.TCHKAM ? utilStore.formatNumberToString2DecimalNumber(data.TCHKAM) : '0.00' }}
        </div>
      </div>
      <div v-if="data.recordCheck.length > 0" class="flex flex-col w-full gap-1">
        <button @click="dialogRef?.data.submit(check)"
          type="button"
          v-for="(check, index) in data.recordCheck"
          :key="index"
          class="grid w-full px-2 py-[2px] border border-gray-400 rounded cursor-pointer grid-cols-20 hover:bg-rose-50 hover:border-primary-light hover:text-black"
        >
          <div class="col-span-3 text-left">
            #{{ index + 1 }}
          </div>
          <div class="col-span-5 text-left">
            {{ check.BNCODE }}
          </div>
          <div class="col-span-4 text-left">
            {{ check.BNKBR }}
          </div>
          <div class="col-span-8 text-right">
            {{ check.CHKNUM }}
          </div>
        </button>
      </div>
    </div>
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Collection Staff :
        </div>
        <div class="text-right ">
          {{ data.COLSTF || '-' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Cashier :
        </div>
        <div class="text-right ">
          {{ data.CASHCD || '-' }}
        </div>
      </div>
    </div>

    <!-- ROW 4 -->
    <div class="flex flex-col col-span-3 gap-1">
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Interest Amount :
        </div>
        <div class="text-right">
          {{ data.INTRST ? utilStore.formatNumberToString2DecimalNumber(data.INTRST) : '0.00' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Penalty Amount :
        </div>
        <div class="text-right">
          {{ data.PNALTY ? utilStore.formatNumberToString2DecimalNumber(data.PNALTY) : '0.00' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Other Amount :
        </div>
        <div class="text-right">
          {{ data.OTHERS ? utilStore.formatNumberToString2DecimalNumber(data.OTHERS) : '0.00' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Over Payment :
        </div>
        <div class="text-right">
          {{ data.OVRPAY ? utilStore.formatNumberToString2DecimalNumber(data.OVRPAY) : '0.00' }}
        </div>
      </div>
      <div class="grid grid-cols-2">
        <div class="font-bold">
          Under Payment :
        </div>
        <div class="text-right">
          {{ data.UNDPAY ? utilStore.formatNumberToString2DecimalNumber(data.UNDPAY) : '0.00' }}
        </div>
      </div>
    </div>
    <div class="flex flex-col col-span-3 gap-2">
      <div class="font-bold">
        Remarks
      </div>
      <div class="flex flex-col gap-1 p-1 whitespace-pre border border-gray-500 rounded">
        <div> {{ data.recordRemarks ? data.recordRemarks.RMARK1 : '' }} </div>
        <div> {{ data.recordRemarks ? data.recordRemarks.RMARK2 : '' }} </div>
        <div> {{ data.recordRemarks ? data.recordRemarks.RMARK3 : '' }} </div>
        <div> {{ data.recordRemarks ? data.recordRemarks.RMARK4 : '' }} </div>
      </div>
    </div>
  </div>
</template>