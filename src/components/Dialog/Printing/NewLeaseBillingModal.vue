<script lang="ts" setup>
  import { computed, inject, ref, Ref, watch } from 'vue';
  import { useY_LeaseStore } from '../../../store/useY_LeaseStore';
  import { LeaseBillingForm, NewLeaseBillingData } from '../../../store/types';
  import { useMainStore } from '../../../store/useMainStore';
  import { useToast } from 'primevue/usetoast';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';

  interface DialogRef  {
    data: {
      submit: Function
      cancel: Function
    }
  }

  const y_LeaseStore = useY_LeaseStore()
  const utilStore = useUtilitiesStore()
  const mainStore = useMainStore()

  const toast = useToast()
  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const invalidList = ref<string[]>([])

  const BILL_TYPES_OPTION = computed(() => {
    const bill_types = [ 81, 82, 33, 31, 10, 8 ]
    return bill_types
    .map((bill_type) => {
      const bill_type_description = mainStore.bill_types.find((bt) => bt.BTYPE === bill_type)?.BDESC
      return { value: bill_type, name: `${utilStore.addLeadingZeroes(bill_type, 2)} - ${bill_type_description}`}
    })
  })

  const leaseBillingForm = ref<LeaseBillingForm>({
    bill_type: null,
    billing_amount: 0,
    prepaid_tax: 0,
    amount_paid: 0,

    year_month: '',
    billing_period: '',
    balance_amount: 0,

    record_code: '',
    balance_code: '',
    verified_tag: '',
    update_code: '',
  })

  watch(
    () => [leaseBillingForm.value.start_period],
    ([newStartPeriod]) => {
      if (newStartPeriod) {
        leaseBillingForm.value.year_month = `${newStartPeriod.getFullYear()}/${(newStartPeriod.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        leaseBillingForm.value.year_month = ''
        leaseBillingForm.value.end_period = undefined
        leaseBillingForm.value.bill_due_date = undefined
      }
    }
  );

  watch(
    () => [leaseBillingForm.value.start_period, leaseBillingForm.value.end_period],
    ([newStartPeriod, newEndPeriod]) => {
      if(newStartPeriod || newEndPeriod)
        leaseBillingForm.value.billing_period = `${ newStartPeriod ? `${(newStartPeriod.getMonth() + 1).toString().padStart(2, '0')}/${newStartPeriod.getDate().toString().padStart(2, '0')}/${newStartPeriod.getFullYear().toString().slice(-2)}` : '' } - ${newEndPeriod ? `${(newEndPeriod.getMonth() + 1).toString().padStart(2, '0')}/${newEndPeriod.getDate().toString().padStart(2, '0')}/${newEndPeriod.getFullYear().toString().slice(-2)}` : '' }`;
      else
        leaseBillingForm.value.billing_period = ''
    }
  );

  watch(
    () => [leaseBillingForm.value.billing_amount, leaseBillingForm.value.amount_paid, leaseBillingForm.value.prepaid_tax],
    ([newBillingAmount, newAmountPaid, newPrepaidTax]) => {
      leaseBillingForm.value.balance_amount = newBillingAmount - newAmountPaid - newPrepaidTax
    }
  );

  const handleSubmit = () => {
    invalidList.value = []
    let month = 0, year = 0, start = 0, end = 0

    if (!leaseBillingForm.value.bill_type) {
      invalidList.value.push('bill_type')
    }

    if (!leaseBillingForm.value.start_period) {
      invalidList.value.push('start_period')
    } else {
      start = utilStore.convertDateObjToNumberYYYYMMDD(leaseBillingForm.value.start_period)
    }

    if (!leaseBillingForm.value.end_period) {
      invalidList.value.push('end_period')
    } else {
      end = utilStore.convertDateObjToNumberYYYYMMDD(leaseBillingForm.value.end_period)
    }

    if (!leaseBillingForm.value.bill_due_date && leaseBillingForm.value.start_period) {
      leaseBillingForm.value.bill_due_date = leaseBillingForm.value.start_period
    }

    if (!leaseBillingForm.value.year_month) {
      invalidList.value.push('year_month')
    } else {
      try {
        const arr = leaseBillingForm.value.year_month.split('/')
        year = parseInt(arr[0])
        month = parseInt(arr[1])
      } catch (error) {
        invalidList.value.push('year_month')
      }
    }

    if (!leaseBillingForm.value.billing_period) {
      invalidList.value.push('billing_period')
    }

    if (!leaseBillingForm.value.billing_amount) {
      invalidList.value.push('billing_amount')
    }

    if (invalidList.value.length) {
      toast.add({
        severity: 'error',
        summary: 'Invalid or missing fields',
        detail: 'Please accomplish all invalid and missing fields before submission!',
        life: 3000
      });
    } else {

      const data: NewLeaseBillingData = {
        bill_type: leaseBillingForm.value.bill_type?.BTYPE as number,
        yy: year,
        mm: month,

        billing_amount: leaseBillingForm.value.billing_amount,
        balance_amount: leaseBillingForm.value.balance_amount,
        amount_paid: leaseBillingForm.value.amount_paid,
        prepaid_tax: leaseBillingForm.value.prepaid_tax,

        bill_due_date: leaseBillingForm.value.bill_due_date ? utilStore.convertDateObjToNumberYYYYMMDD(leaseBillingForm.value.bill_due_date) : start,
        billing_period: leaseBillingForm.value.billing_period,
        start_period: start,
        end_period: end,

        record_code: leaseBillingForm.value.record_code,
        balance_code: leaseBillingForm.value.balance_code,
        verified_tag: leaseBillingForm.value.verified_tag,
        update_code: leaseBillingForm.value.update_code,
      }

      dialogRef?.value.data.submit(data)
    }

  }

</script>


<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 pr-10">
    <div class="grid grid-cols-5 text-sm gap-x-16">
      <div class="flex flex-col col-span-3 gap-1">
        <div class="flex justify-between ">
          <div class="font-bold shrink-0 w-fit">
            Project/Block/Lot-Unit :
          </div>
          <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
            {{ y_LeaseStore.getClientUnit.pbl }}
          </div>
        </div>
        <div class="flex justify-between">
          <div class="font-bold shrink-0 w-fit">
            Client Key/Temp # :
          </div>
          <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
            {{ y_LeaseStore.getClientUnit.client_key_temp_number }}
          </div>
        </div>
        <div class="flex justify-between gap-10">
          <div class="font-bold shrink-0 w-fit">
            Client Name :
          </div>
          <div class="flex-grow w-full tracking-wider text-right whitespace-pre text-wrap">
            {{ y_LeaseStore.getClientUnit.client_name }}
          </div>
        </div>
      </div>
      <div class="flex flex-col col-span-2 gap-1">
        <div class="flex justify-between col-span-2">
          <div class="font-bold shrink-0 w-fit">
            Company :
          </div>
          <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
            {{ y_LeaseStore.getClientUnit.company_code }}
          </div>
        </div>
        <div class="flex justify-between col-span-2">
          <div class="font-bold shrink-0 w-fit">
            TIN :
          </div>
          <div class="flex-grow w-full tracking-wider text-right whitespace-pre">
            {{ y_LeaseStore.getClientUnit.tin }}
          </div>
        </div>
      </div>
    </div>
    <div class="border-t border-primary-light"></div>
    <div class="grid grid-cols-5 gap-16 text-sm">
      <!-- COL1 -->
      <div class="flex flex-col col-span-3 gap-4">
        <div class="grid grid-cols-3 gap-10">
          <div class="flex flex-col col-span-2 gap-2">
            <label for="bill_type" class="text-sm font-bold">
              Bill Type *
            </label>
            <Select
              v-model="leaseBillingForm.bill_type"
              :options="BILL_TYPES_OPTION"
              filter
              optionLabel="name"
              placeholder="Select one"
              class="w-full col-span-2"
              :invalid="invalidList.includes('bill_type')"
            >
            </Select>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-10">
          <div class="flex flex-col col-span-1 gap-2">
            <label for="start_period" class="text-sm font-bold">
              Start Period *
            </label>
            <DatePicker v-model="leaseBillingForm.start_period" dateFormat="yy/mm/dd" :invalid="invalidList.includes('start_period')"/>
          </div>
          <div class="flex flex-col col-span-1 gap-2">
            <label for="end_period" class="text-sm font-bold">
              End Period *
            </label>
            <DatePicker v-model="leaseBillingForm.end_period" dateFormat="yy/mm/dd" :disabled="!leaseBillingForm.start_period" :min-date="leaseBillingForm.start_period" :invalid="invalidList.includes('end_period')"/>
          </div>
          <div class="flex flex-col col-span-1 gap-2">
            <label for="bill_due_date" class="text-sm font-bold">
              Due Date
            </label>
            <DatePicker v-model="leaseBillingForm.bill_due_date" dateFormat="yy/mm/dd" :disabled="!leaseBillingForm.start_period" :min-date="leaseBillingForm.start_period" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-10">
          <div class="flex flex-col col-span-1 gap-2">
            <label for="year_month" class="font-bold shrink-0 w-fit">
              Year/Month *
            </label>
            <InputText
              v-model="leaseBillingForm.year_month"
              name="year_month"
              class="text-xs h-[2.4rem]"
              aria-autocomplete="none"
              disabled
              :invalid="invalidList.includes('year_month')"
            />
          </div>
          <div class="flex flex-col col-span-2 gap-2">
            <label for="billing_period" class="font-bold shrink-0 w-fit">
              Billing Period *
            </label>
            <InputText
              v-model="leaseBillingForm.billing_period"
              name="billing_period"
              class="text-xs h-[2.4rem]"
              aria-autocomplete="none"
              disabled
              :invalid="invalidList.includes('billing_period')"
            />
          </div>
        </div>
      </div>
      <!-- COL2 -->
      <div class="flex flex-col col-span-2 gap-4">
        <div class="flex flex-col gap-1">
          <div class="grid items-start grid-cols-2">
            <label for="billing_amount" class="text-sm font-bold">
              Billing Amount *
            </label>
            <InputNumber
              v-model="leaseBillingForm.billing_amount"
              :min="0"
              :max="9999999"
              name="billing_amount"
              inputId="billing_amount"
              placeholder="0.00"
              fluid
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              class="text-xs h-[1.7rem]"
              aria-autocomplete="none"
              :invalid="invalidList.includes('billing_amount')"
            />
          </div>
          <div class="grid items-start grid-cols-2">
            <label for="amount_paid" class="text-sm font-bold">
              Amount Paid
            </label>
            <InputNumber
              v-model="leaseBillingForm.amount_paid"
              :min="0"
              :max="leaseBillingForm.billing_amount - leaseBillingForm.prepaid_tax"
              name="amount_paid"
              inputId="amount_paid"
              placeholder="0.00"
              fluid
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              class="text-xs h-[1.7rem]"
              aria-autocomplete="none"
            />
          </div>
          <div class="grid items-start grid-cols-2">
            <label for="prepaid_tax" class="text-sm font-bold">
              Prepaid Tax
            </label>
            <InputNumber
              v-model="leaseBillingForm.prepaid_tax"
              :min="0"
              :max="leaseBillingForm.billing_amount - leaseBillingForm.amount_paid"
              name="prepaid_tax"
              inputId="prepaid_tax"
              placeholder="0.00"
              fluid
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              class="text-xs h-[1.7rem]"
              aria-autocomplete="none"
            />
          </div>
          <div class="grid items-start grid-cols-2">
            <label for="balance_amount" class="text-sm font-bold">
              Balance Amount
            </label>
            <InputNumber
              v-model="leaseBillingForm.balance_amount"
              :min="0"
              :max="9999999"
              name="balance_amount"
              inputId="balance_amount"
              placeholder="0.00"
              fluid
              :min-fraction-digits="2"
              :max-fraction-digits="2"
              class="text-xs h-[1.7rem]"
              aria-autocomplete="none"
              disabled
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-y-1">
          <div class="flex flex-col gap-2">
            <label for="record_code" class="font-bold shrink-0 w-fit">
              Record Code
            </label>
            <InputText
              v-model="leaseBillingForm.record_code"
              name="record_code"
              class="text-xs h-[1.7rem] w-10"
              aria-autocomplete="none"
              maxlength="1"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="record_code" class="font-bold shrink-0 w-fit">
              Balance Code
            </label>
            <InputText
              v-model="leaseBillingForm.balance_code"
              name="balance_code"
              class="text-xs h-[1.7rem] w-10"
              aria-autocomplete="none"
              maxlength="1"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="verified_tag" class="font-bold shrink-0 w-fit">
              Verified Tag
            </label>
            <InputText
              v-model="leaseBillingForm.verified_tag"
              name="verified_tag"
              class="text-xs h-[1.7rem] w-10"
              aria-autocomplete="none"
              maxlength="1"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="update_code" class="font-bold shrink-0 w-fit">
              Update Code
            </label>
            <InputText
              v-model="leaseBillingForm.update_code"
              name="update_code"
              class="text-xs h-[1.7rem] w-10"
              aria-autocomplete="none"
              maxlength="1"
            />
          </div>
        </div>
      </div>
    </div>
    <button type="submit" class="hidden" />
  </form>
  <div class="flex justify-end gap-2 mt-6">
    <Button type="button" label="Cancel" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
    <Button type="button" label="Submit" @click="handleSubmit"></Button>
  </div>
</template>