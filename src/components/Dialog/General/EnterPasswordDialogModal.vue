<script lang="ts" setup>
  import { inject, onMounted, ref, Ref } from 'vue';
  import { useToast } from 'primevue/usetoast';

  interface DialogRef  {
    data: {
      password: string
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const toast = useToast()

  const password = ref<string>('')

  const submitForm = () => {
    if (dialogRef) {
      if (password.value !== dialogRef.value.data.password) {
        toast.add({
          summary: 'Unauthorized!',
          detail: 'Invalid password.',
          severity: 'warn',
          life: 3000
        })
      }

      else {
        dialogRef.value.data.submit()
      }

    } else {
      toast.add({
        summary: 'Error!',
        detail: 'Unable to create user right now. Please, try again later!',
        severity: 'warn',
        life: 3000
      })
    }

  }

  onMounted(() => {
    password.value = ''
  })
</script>


<template>
  <form @submit.prevent="submitForm" class="flex flex-col gap-2">
    <InputText
      v-model="password"
      type="password"
      size="small"
      class="w-full"
      autofocus
    />
    <button type="submit" class="hidden"/>
  </form>
  <div class="flex justify-between gap-2 mt-6">
    <div>
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
      <Button type="button" label="Submit" @click="submitForm"></Button>
    </div>
  </div>
</template>