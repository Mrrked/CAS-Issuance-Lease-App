<script lang="ts" setup>
  import { computed, inject, onMounted, onUnmounted, Ref, ref } from 'vue';
  import { jwtDecode } from 'jwt-decode';

  interface DialogRef  {
    data: {
      refresh: Function
      close: Function
    }
  }

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const interval = ref()
  const expiresIn = ref<number | false>(false)

  const expirationPercentage = computed(() => {
    if (expiresIn.value !== false) {
      return ((expiresIn.value ?? 0) / 60) * 100;
    }
  })

  onMounted(() => {
    const refreshToken = localStorage.getItem('refresh') || '';

    if (refreshToken) {
      try {
        const { exp } = jwtDecode<{ exp: number }>(refreshToken);

        interval.value = setInterval(() => {
          const currentTime = Math.floor(Date.now() / 1000);
          const timeRemaining = exp - currentTime;

          if (timeRemaining >= 0) {
            expiresIn.value = timeRemaining;
          } else {
            clearInterval(interval.value!);
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
          }
        }, 1000);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('refresh');
      }
    }
  });

  onUnmounted(() => {
    if (interval.value) {
      clearInterval(interval.value);
    }
  });
</script>


<template>
  <div v-if="expiresIn && expiresIn > 0" class="flex flex-col items-center justify-center gap-3 text-center">
    <div class="flex flex-col items-center justify-center">
      <div class="text-xl">
        Session will expire in
      </div>
      <div class="text-6xl">
        {{ expiresIn }}
      </div>
      <div>
        seconds
      </div>
    </div>
    <ProgressBar :value="expirationPercentage" class="w-full"> {{ '' }} </ProgressBar>
    <div>
      You will be logged out when the session expires.
    </div>
    <Button
      v-if="dialogRef"
      @click="dialogRef.data.refresh()"
      severity="primary"
      label="Continue session"
    />
  </div>
  <div v-else-if="expiresIn !== false && expiresIn <= 0" class="flex flex-col items-center justify-center gap-3 text-center">
    <div class="text-xl">
      Session has expired due to long inactivity.
    </div>
    <div>
      You have been logged out automatically.
    </div>
    <Button
      v-if="dialogRef"
      @click="dialogRef.data.close()"
      severity="primary"
      label="CLOSE"
    />
  </div>
  <div v-else>
    Loading ...
  </div>
</template>