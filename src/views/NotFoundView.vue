<template>
  <div class="flex flex-col items-center justify-center w-full h-full gap-3 my-auto text-center">
    <h1 class="font-semibold text-9xl">
      404
    </h1>
    <h2 class="text-5xl font-semibold">
      Page Not Found
    </h2>
    <p class="my-5 text-xl">
      Sorry, the page you are looking for does not exist.
    </p>
    <router-link
      to="/"
      class="px-5 py-2 tracking-wider font-semibold border-[2px] border-primary text-primary rounded-sm hover:scale-105 focus:scale-105"
    >
      BACK TO MAIN PAGE
    </router-link>
  </div>
</template>