<script setup lang="ts">
  import { ref, nextTick, Ref } from "vue";
  import { useMainStore } from "../../../store/useMainStore";
  import { usePerBillTypeRunStore } from "../../../store/usePerBillTypeRunStore";
  import { useIssuanceStore } from "../../../store/useIssuanceStore";

  const mainStore = useMainStore()
  const issuanceStore = useIssuanceStore()
  const perBillTypeRunStore = usePerBillTypeRunStore()

  function useInputNavigation<T extends string>(
    keys: readonly T[],
    refs: Ref<(HTMLInputElement | null)[]>,
    nextRefs?: Ref<(HTMLInputElement | null)[]>,
    prevRefs?: Ref<(HTMLInputElement | null)[]>
  ) {
    const onKeydown = (e: KeyboardEvent, formSection: Record<T, string>, index: number) => {
      const key = e.key

      // Only allow single character keys (letters/numbers)
      if (key.length === 1) {

        // Overwrite the value BEFORE Vue updates the model
        formSection[keys[index]] = key.toUpperCase()

        nextTick(() => {
          if (index < keys.length - 1) {
            refs.value[index + 1]?.focus()
          } else {
            nextRefs?.value[0]?.focus()
          }
        })

        // Prevent the browser from appending characters
        e.preventDefault()
      }
    }

    const onBackspace = (formSection: Record<T, string>, index: number) => {
      const current = formSection[keys[index]]
      nextTick(() => {
        if (current === '' && index > 0) {
          refs.value[index - 1]?.focus()
        } else if (current === '' && index === 0 && prevRefs) {
          const last = prevRefs.value.length - 1
          prevRefs.value[last]?.focus()
        }
      })
    }

    return { onKeydown, onBackspace }
  }

  // === Refs and keys per group ===
  const pcsCodeKeys = ['1'] as const
  const pcsCodeRefs = ref<(HTMLInputElement | null)[]>([])

  const phaseKeys = ['1'] as const
  const phaseRefs = ref<(HTMLInputElement | null)[]>([])

  const blockKeys = ['1', '2'] as const
  const blockRefs = ref<(HTMLInputElement | null)[]>([])

  const lotKeys = ['1', '2', '3', '4'] as const
  const lotRefs = ref<(HTMLInputElement | null)[]>([])

  const unitCodeKeys = ['1', '2'] as const
  const unitCodeRefs = ref<(HTMLInputElement | null)[]>([])


  // === Input navigation setup ===
  const { onKeydown: onKeydownPcs, onBackspace: onBackspacePcs } = useInputNavigation(
    pcsCodeKeys,
    pcsCodeRefs,
    phaseRefs,   // next
    undefined    // no previous
  )

  const { onKeydown: onKeydownPhase, onBackspace: onBackspacePhase } = useInputNavigation(
    phaseKeys,
    phaseRefs,
    blockRefs,   // next
    pcsCodeRefs  // prev 👈
  )

  const { onKeydown: onKeydownBlock, onBackspace: onBackspaceBlock } = useInputNavigation(
    blockKeys,
    blockRefs,
    lotRefs,     // next
    phaseRefs    // prev 👈
  )

  const { onKeydown: onKeydownLot, onBackspace: onBackspaceLot } = useInputNavigation(
    lotKeys,
    lotRefs,
    unitCodeRefs,// next
    blockRefs    // prev 👈
  )

  const { onKeydown: onKeydownUnitCode, onBackspace: onBackspaceUnitCode } = useInputNavigation(
    unitCodeKeys,
    unitCodeRefs,
    undefined,   // no next
    lotRefs      // prev 👈
  )
</script>


<template>
  <form @submit.prevent="issuanceStore.handleActionSearch('A')" class="flex flex-col gap-5">
    <InputGroup>
      <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
        <label for="project_code" class="font-bold">
          Project Code
        </label>
      </InputGroupAddon>
      <Select
        ref="indexRef"
        v-model="perBillTypeRunStore.perBillTypeRunForm.projectCode"
        :options="mainStore.getProjectCodeOptions"
        optionLabel="option_name"
        placeholder="Select one"
        class="w-full uppercase md:w-56"
        editable
      ></Select>
    </InputGroup>
    <div class="grid grid-cols-23 gap-4 max-w-[50rem] h-20">
      <div class="flex flex-col items-center justify-center col-span-3 gap-2">
        <label class="font-bold text-center">PCS Code</label>
        <div class="flex h-full gap-1">
          <input
            v-for="(value, index) in pcsCodeKeys"
            :key="index"
            v-model="perBillTypeRunStore.perBillTypeRunForm.PBL.pcs_code[value]"
            ref="pcsCodeRefs"
            maxlength="1"
            @keydown="onKeydownPcs($event, perBillTypeRunStore.perBillTypeRunForm.PBL.pcs_code, index)"
            @keydown.backspace="onBackspacePcs(perBillTypeRunStore.perBillTypeRunForm.PBL.pcs_code, index)"
            class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
            autofocus
          />
        </div>
      </div>
      <div class="flex flex-col items-center justify-center col-span-3 gap-2">
        <label class="font-bold text-center">Phase</label>
        <div class="flex h-full gap-1">
          <input
            v-for="(value, index) in phaseKeys"
            :key="index"
            v-model="perBillTypeRunStore.perBillTypeRunForm.PBL.phase[value]"
            ref="phaseRefs"
            maxlength="1"
            @keydown="onKeydownPhase($event, perBillTypeRunStore.perBillTypeRunForm.PBL.phase, index)"
            @keydown.backspace="onBackspacePhase(perBillTypeRunStore.perBillTypeRunForm.PBL.phase, index)"
            class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
          />
        </div>
      </div>
      <div class="flex flex-col items-center justify-center col-span-4 gap-2">
        <label class="font-bold text-center">Block</label>
        <div class="flex h-full gap-1">
          <input
            v-for="(value, index) in blockKeys"
            :key="index"
            v-model="perBillTypeRunStore.perBillTypeRunForm.PBL.block[value]"
            ref="blockRefs"
            maxlength="1"
            @keydown="onKeydownBlock($event, perBillTypeRunStore.perBillTypeRunForm.PBL.block, index)"
            @keydown.backspace="onBackspaceBlock(perBillTypeRunStore.perBillTypeRunForm.PBL.block, index)"
            class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
          />
        </div>
      </div>
      <div class="flex flex-col items-center justify-center col-span-1 gap-2 font-bold">
        <div>
          /
        </div>
        <div class="flex items-center h-full">
          /
        </div>
      </div>
      <div class="flex flex-col items-center justify-center col-span-7 gap-2">
        <label class="font-bold text-center">Lot</label>
        <div class="flex h-full gap-1">
          <input
            v-for="(value, index) in lotKeys"
            :key="index"
            v-model="perBillTypeRunStore.perBillTypeRunForm.PBL.lot[value]"
            ref="lotRefs"
            maxlength="1"
            @keydown="onKeydownLot($event, perBillTypeRunStore.perBillTypeRunForm.PBL.lot, index)"
            @keydown.backspace="onBackspaceLot(perBillTypeRunStore.perBillTypeRunForm.PBL.lot, index)"
            class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
          />
        </div>
      </div>
      <div class="flex flex-col items-center justify-center col-span-1 gap-2 font-bold">
        <div>
          /
        </div>
        <div class="flex items-center h-full">
          /
        </div>
      </div>
      <div class="flex flex-col items-center justify-center col-span-4 gap-2">
        <label class="font-bold text-center">Unit Code</label>
        <div class="flex h-full gap-1">
          <input
            v-for="(value, index) in unitCodeKeys"
            :key="index"
            v-model="perBillTypeRunStore.perBillTypeRunForm.PBL.unit_code[value]"
            ref="unitCodeRefs"
            maxlength="1"
            @keydown="onKeydownUnitCode($event, perBillTypeRunStore.perBillTypeRunForm.PBL.unit_code, index)"
            @keydown.backspace="onBackspaceUnitCode(perBillTypeRunStore.perBillTypeRunForm.PBL.unit_code, index)"
            class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
          />
        </div>
      </div>
    </div>
    <button type="submit" class="hidden" />
  </form>
</template>