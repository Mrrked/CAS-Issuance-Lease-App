<script lang="ts" setup>
  import Footer from './components/Core/Footer.vue'
  import NavBar from './components/Core/NavBar.vue';
  import 'primeicons/primeicons.css'
  import './main.css'
  import { useRoute } from 'vue-router';
  import { useThemeStore } from './store/useThemeStore';

  useThemeStore()
  const route = useRoute()
</script>

<template>
  <!-- Confirm Dialog -->
  <ConfirmDialog></ConfirmDialog>
  <!-- TOAST -->
  <Toast />
  <!-- DynamicModal -->
  <DynamicDialog/>
  <!-- MAIN -->
  <main v-focustrap class="w-full overflow-hidden">
    <section v-if="route.meta.requiresAuth" class="flex flex-col w-full max-h-screen min-h-screen">
      <NavBar />
      <main class="flex flex-col flex-grow w-full overflow-auto">
        <section class="flex flex-col items-start justify-start flex-grow px-5 pb-5">
          <router-view/>
        </section>
        <Footer />
      </main>
    </section>
    <RouterView v-else class="min-h-screen"/>
  </main>
</template>