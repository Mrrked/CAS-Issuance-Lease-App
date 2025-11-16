<script setup lang="ts">
  import { usePrintingStore } from '../../../store/usePrintingStore';

  const printStore = usePrintingStore()
</script>


<template>
  <form v-focustrap v-if="printStore.selectedInquiryType" @submit.prevent="printStore.handleActionSearch" class="flex flex-col w-full">
    <Fieldset legend="CLIENT QUERY">
      <div class="flex flex-col gap-3">
        <div class="grid grid-cols-4 gap-3 ">
          <InputGroup class="col-span-4">
            <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
              <label for="name" class="font-bold">
                Name
              </label>
            </InputGroupAddon>
            <InputText
              v-model="printStore.queryClientForm.name"
              class="w-full uppercase"
              autofocus
              autocomplete="off"
              aria-autocomplete="none"
              placeholder="ex. John F. Smith"
            />
          </InputGroup>
        </div>
      </div>
    </Fieldset>
  </form>
</template>