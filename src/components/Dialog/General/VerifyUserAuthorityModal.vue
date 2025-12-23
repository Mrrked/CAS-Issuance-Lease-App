<script lang="ts" setup>
  import { inject, onMounted, ref, Ref } from 'vue';
  import { useToast } from 'primevue/usetoast';
  import { useSessionStore } from '../../../store/useSessionStore';

  interface DialogRef  {
    data: {
      submit: Function
      cancel: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const toast = useToast()

  const sessionStore = useSessionStore()

  const username = ref<string>('')
  const password = ref<string>('')

  const submitForm = () => {
    if (dialogRef) {
      if (!username.value) {
        toast.add({
          summary: 'Invalid Action!',
          detail: 'Missing username.',
          severity: 'warn',
          life: 3000
        })
      }

      else if (!password.value) {
        toast.add({
          summary: 'Invalid Action!',
          detail: 'Missing password.',
          severity: 'warn',
          life: 3000
        })
      }

      else {
        dialogRef.value.data.submit(username.value, password.value)
      }

    } else {
      toast.add({
        summary: 'Error!',
        detail: 'Unable to verify user authority right now. Please, try again later!',
        severity: 'warn',
        life: 3000
      })
    }

  }

  const resetForm = () => {
    username.value = sessionStore.authenticatedUser?.username || ''
    password.value = ''
  }

  onMounted(() => {
    resetForm()
  })
</script>


<template>
  <form @submit.prevent="submitForm" class="flex flex-col items-center gap-2">
    <div class="flex items-center gap-5">
      <label name="username" class="font-semibold min-w-24 text-primary">
        Username
      </label>
      <InputText
        v-model="username"
        type="username"
        size="small"
        class="w-full uppercase"
        required
      />
    </div>
    <div class="flex items-center gap-5">
      <label name="password" class="font-semibold min-w-24 text-primary">
        Password
      </label>
      <InputText
        v-model="password"
        type="password"
        size="small"
        class="w-full uppercase"
        autofocus
        required
      />
    </div>
    <button type="submit" class="hidden"/>
  </form>
  <div class="flex justify-between gap-2 mt-6">
    <div>
      <Button type="button" label="Reset Form"  @click="resetForm"></Button>
    </div>
    <div class="flex gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="dialogRef?.data.cancel()"></Button>
      <Button type="button" label="Submit" @click="submitForm"></Button>
    </div>
  </div>
</template>