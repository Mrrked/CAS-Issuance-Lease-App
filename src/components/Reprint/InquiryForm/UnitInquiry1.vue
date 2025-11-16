<script setup lang="ts">
  import { ref, nextTick, Ref } from "vue";
  import { useMainStore } from "../../../store/useMainStore";
  import { usePrintingStore } from '../../../store/usePrintingStore';

  const mainStore = useMainStore()
  const printStore = usePrintingStore()

  function useInputNavigation<T extends string>(
    keys: readonly T[],
    refs: Ref<(HTMLInputElement | null)[]>,
    nextRefs?: Ref<(HTMLInputElement | null)[]>,
    prevRefs?: Ref<(HTMLInputElement | null)[]>
  ) {
    const onInput = (formSection: Record<T, string>, index: number) => {
      const current = formSection[keys[index]]
      if (current.length === 1) {
        nextTick(() => {
          if (index < keys.length - 1) {
            refs.value[index + 1]?.focus()
          } else {
            nextRefs?.value[0]?.focus()
          }
        })
      }
    }

    const onBackspace = (formSection: Record<T, string>, index: number) => {
      const current = formSection[keys[index]]
      nextTick(() => {
        if (current === '' && index > 0) {
          // Move back within same group
          refs.value[index - 1]?.focus()
        } else if (current === '' && index === 0 && prevRefs) {
          // Move to previous group's last input
          const last = prevRefs.value.length - 1
          prevRefs.value[last]?.focus()
        }
      })
    }

    return { onInput, onBackspace }
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
  const { onInput: onInputPcs, onBackspace: onBackspacePcs } = useInputNavigation(
    pcsCodeKeys,
    pcsCodeRefs,
    phaseRefs,   // next
    undefined    // no previous
  )

  const { onInput: onInputPhase, onBackspace: onBackspacePhase } = useInputNavigation(
    phaseKeys,
    phaseRefs,
    blockRefs,   // next
    pcsCodeRefs  // prev 👈
  )

  const { onInput: onInputBlock, onBackspace: onBackspaceBlock } = useInputNavigation(
    blockKeys,
    blockRefs,
    lotRefs,     // next
    phaseRefs    // prev 👈
  )

  const { onInput: onInputLot, onBackspace: onBackspaceLot } = useInputNavigation(
    lotKeys,
    lotRefs,
    unitCodeRefs,// next
    blockRefs    // prev 👈
  )

  const { onInput: onInputUnitCode, onBackspace: onBackspaceUnitCode } = useInputNavigation(
    unitCodeKeys,
    unitCodeRefs,
    undefined,   // no next
    lotRefs      // prev 👈
  )
</script>


<template>
  <form v-focustrap @submit.prevent="printStore.handleActionSearch" class="flex flex-col gap-3">
    <Fieldset
      :legend="'UNIT QUERY'"
    >
      <div class="flex flex-col gap-5">
        <InputGroup>
          <InputGroupAddon class="!bg-primary !text-primary-contrast !border-0">
            <label for="project_code" class="font-bold">
              Project Code
            </label>
          </InputGroupAddon>
          <Select
            ref="indexRef"
            v-model="printStore.queryUnitForm.project_code"
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
                v-model="printStore.queryUnitForm.pcs_code[value]"
                ref="pcsCodeRefs"
                maxlength="1"
                @input="onInputPcs(printStore.queryUnitForm.pcs_code, index)"
                @keydown.backspace="onBackspacePcs(printStore.queryUnitForm.pcs_code, index)"
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
                v-model="printStore.queryUnitForm.phase[value]"
                ref="phaseRefs"
                maxlength="1"
                @input="onInputPhase(printStore.queryUnitForm.phase, index)"
                @keydown.backspace="onBackspacePhase(printStore.queryUnitForm.phase, index)"
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
                v-model="printStore.queryUnitForm.block[value]"
                ref="blockRefs"
                maxlength="1"
                @input="onInputBlock(printStore.queryUnitForm.block, index)"
                @keydown.backspace="onBackspaceBlock(printStore.queryUnitForm.block, index)"
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
                v-model="printStore.queryUnitForm.lot[value]"
                ref="lotRefs"
                maxlength="1"
                @input="onInputLot(printStore.queryUnitForm.lot, index)"
                @keydown.backspace="onBackspaceLot(printStore.queryUnitForm.lot, index)"
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
                v-model="printStore.queryUnitForm.unit_code[value]"
                ref="unitCodeRefs"
                maxlength="1"
                @input="onInputUnitCode(printStore.queryUnitForm.unit_code, index)"
                @keydown.backspace="onBackspaceUnitCode(printStore.queryUnitForm.unit_code, index)"
                class="text-xl font-semibold text-center uppercase border rounded outline-none border-neutral-500 dark:bg-black dark:border-neutral-700 w-11 focus:dark:border-primary focus:border-primary hover:dark:border-primary hover:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    </Fieldset>
    <button type="submit" class="hidden" />
  </form>
</template>