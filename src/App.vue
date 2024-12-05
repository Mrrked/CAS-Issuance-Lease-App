<script lang="ts" setup>
  import AppFooter from './components/Core/AppFooter.vue'
  import NavBar from './components/Core/NavBar.vue';

  import './main.css'
  import 'primeicons/primeicons.css'
  import { useRoute } from 'vue-router';
  import { useThemeStore } from './store/useThemeStore';

  const route = useRoute()
  const themeStore = useThemeStore()
</script>

<template>
  <!-- CONFIRM DIALOG -->
  <ConfirmDialog></ConfirmDialog>
  <!-- TOAST -->
  <Toast />
  <!-- DYNAMIC MODAL -->
  <DynamicDialog/>
  <!-- MAIN -->
  <main v-focustrap class="flex max-h-screen min-h-screen overflow-hidden ">
    <section v-if="route.meta.requiresAuth" class="flex flex-col w-full">
      <NavBar />
      <main class="flex flex-col flex-grow w-full overflow-auto">
        <section class="flex flex-col items-start justify-start flex-grow px-5 pb-5">
          <router-view/>
        </section>
        <AppFooter />
      </main>
    </section>
    <section v-else class="w-full">
      <router-view/>
    </section>
  </main>
</template>