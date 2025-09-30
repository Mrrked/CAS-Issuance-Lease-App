<script lang="ts" setup>
  import { storeToRefs } from 'pinia';
  import { useLoginStore } from '../store/useLoginStore';
  import { useThemeStore } from '../store/useThemeStore';

  const loginStore = useLoginStore();
  const themeStore = useThemeStore();

  const { username, password } = storeToRefs(loginStore);
  const { handleActionLogin } = loginStore;
</script>

<template>
  <section class="flex p-6 sm:p-4">
    <div class="grid w-full mx-auto my-auto overflow-hidden grid-cols-1 h-fit sm:w-fit sm:grid-cols-2 rounded-2xl big-shadow max-w-[25rem] md:max-w-[50rem] ">
      <div class="sm:relative hidden md:flex items-center justify-center md:max-w-[25rem]" style="background: linear-gradient(to top right, #330a0d, #521014, #6e151b, #812429, #a52e34, #a52e34);">
        <div class="absolute flex flex-col justify-between w-full h-full p-12">
          <div class="flex items-center font-medium tracking-wider">
            <svg class="w-[4rem] h-[4rem] shrink-0" preserveAspectRatio="xMidYMid meet" viewBox="0 30.492 338.31600000000003 333.23400000000004" xmlns="http://www.w3.org/2000/svg" version="1.0" style="max-height: 500px" width="338.31600000000003" height="333.23400000000004">
              <g stroke="none" :fill="'white'" transform="translate(0.000000,403.000000) scale(0.100000,-0.100000)">
              <path d="M1568 3430 c-248 -61 -450 -265 -592 -598 -38 -89 -91 -259 -102&#10;-329 l-7 -43 266 0 266 0 5 43 c48 399 102 621 179 733 78 114 151 94 222 -61&#10;55 -118 101 -305 127 -512 l11 -93 262 0 262 0 -17 63 c-66 233 -175 438 -309&#10;580 -118 124 -231 190 -382 222 -87 18 -95 18 -191 -5z"/>
              <path d="M365 2364 c-48 -25 -71 -51 -101 -117 -25 -55 -29 -75 -32 -188 -7&#10;-243 60 -379 188 -379 82 0 134 50 166 159 16 52 15 55 -2 68 -27 20 -32 17&#10;-45 -29 -17 -65 -36 -96 -69 -113 -115 -60 -202 81 -187 303 10 146 46 216&#10;119 231 64 14 114 -24 132 -101 7 -29 20 -34 45 -19 12 8 13 16 2 53 -35 119&#10;-130 177 -216 132z"/>
              <path d="M690 2030 l0 -340 25 0 25 0 0 340 0 340 -25 0 -25 0 0 -340z"/>
              <path d="M810 2330 l0 -40 70 0 70 0 0 -300 0 -300 30 0 30 0 0 300 0 300 70&#10;0 70 0 0 40 0 40 -170 0 -170 0 0 -40z"/>
              <path d="M1170 2366 c0 -5 21 -56 126 -302 34 -80 34 -83 34 -228 l0 -146 30&#10;0 30 0 0 150 0 149 80 182 c44 100 80 186 80 191 0 4 -13 8 -28 8 -27 0 -31&#10;-6 -93 -159 -35 -88 -66 -158 -68 -156 -1 2 -31 73 -65 157 -61 150 -63 153&#10;-94 156 -18 2 -32 1 -32 -2z"/>
              <path d="M1610 2030 l0 -340 135 0 136 0 -5 28 c-2 15 -5 33 -5 40 -1 9 -29&#10;12 -106 12 l-105 0 0 300 0 300 -25 0 -25 0 0 -340z"/>
              <path d="M2047 2298 c-20 -89 -136 -566 -143 -590 -4 -14 1 -18 24 -18 28 0&#10;29 1 51 99 20 85 26 100 45 103 25 5 155 2 161 -4 2 -2 14 -46 27 -98 24 -93&#10;25 -95 55 -98 l31 -3 -60 233 c-33 128 -72 280 -87 338 -27 103 -28 105 -57&#10;108 -30 3 -31 2 -47 -70z m116 -313 c2 -18 -4 -20 -66 -20 -38 0 -70 2 -72 5&#10;-2 3 9 59 25 125 15 66 31 138 35 160 7 37 10 30 41 -105 19 -80 36 -154 37&#10;-165z"/>
              <path d="M2350 2031 l0 -341 25 0 25 0 1 263 0 262 24 -50 c14 -27 54 -122 91&#10;-210 110 -266 109 -265 138 -265 l26 0 0 340 0 340 -25 0 -25 0 -1 -267 c0&#10;-173 -4 -261 -10 -248 -5 11 -55 130 -112 265 -96 227 -106 245 -130 248 l-27&#10;3 0 -340z"/>
              <path d="M2780 2030 l0 -340 101 0 c85 0 107 3 139 21 52 30 85 94 106 208 28&#10;156 -3 330 -73 404 -35 36 -79 47 -185 47 l-88 0 0 -340z m246 225 c38 -47 49&#10;-100 48 -225 0 -133 -14 -192 -54 -232 -26 -26 -34 -28 -107 -28 l-78 0 3 261&#10;3 261 80 -4 c76 -3 83 -5 105 -33z"/>
              <path d="M870 1579 c0 -31 36 -167 71 -266 93 -264 243 -477 416 -593 170&#10;-114 343 -135 522 -65 237 92 451 375 564 743 l25 82 -259 0 c-199 0 -260 -3&#10;-263 -12 -2 -7 -12 -71 -21 -143 -34 -262 -110 -499 -184 -573 -131 -131 -265&#10;153 -327 696 l-17 152 -264 0 c-260 0 -263 0 -263 -21z"/>
              </g>
            </svg>
            <div class="flex flex-col items-center justify-center -mb-3">
              <div class="flex-1 px-2 text-[17px] leading-6 text-center text-white">
                Computerized Accounting System
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-6 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="-ml-1 size-14">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <h1 class="text-4xl font-bold tracking-tighter">
              <div class="flex items-end gap-4 -mr-10">
                <div>
                  Invoice Issuance <br />for Lease
                </div>
              </div>
            </h1>
            <div class="text-sm">
              A program for issuing billing and service invoices for leasing units with accuracy and efficiency.
            </div>
          </div>
        </div>
        <div class="bg-[url('/cover.webp')] bg-center bg-cover w-full h-full opacity-10 ">
        </div>
      </div>

      <div class="flex flex-col justify-between p-6 sm:p-9 md:p-12 text-sm sm:min-w-[25rem] gap-4">
        <!-- HEADER -->
        <div class="flex items-center justify-center">
          <svg class="w-[4rem] sm:w-[5rem] md:w-[6rem] h-[4rem] sm:h-[5rem] md:h-[6rem]" preserveAspectRatio="xMidYMid meet" viewBox="0 30.492 338.31600000000003 333.23400000000004" xmlns="http://www.w3.org/2000/svg" version="1.0" style="max-height: 500px" width="338.31600000000003" height="333.23400000000004">
            <g stroke="none" :fill="themeStore.getThemeMode === 'light' ? '#49090D' : 'white'" transform="translate(0.000000,403.000000) scale(0.100000,-0.100000)">
            <path d="M1568 3430 c-248 -61 -450 -265 -592 -598 -38 -89 -91 -259 -102&#10;-329 l-7 -43 266 0 266 0 5 43 c48 399 102 621 179 733 78 114 151 94 222 -61&#10;55 -118 101 -305 127 -512 l11 -93 262 0 262 0 -17 63 c-66 233 -175 438 -309&#10;580 -118 124 -231 190 -382 222 -87 18 -95 18 -191 -5z"/>
            <path d="M365 2364 c-48 -25 -71 -51 -101 -117 -25 -55 -29 -75 -32 -188 -7&#10;-243 60 -379 188 -379 82 0 134 50 166 159 16 52 15 55 -2 68 -27 20 -32 17&#10;-45 -29 -17 -65 -36 -96 -69 -113 -115 -60 -202 81 -187 303 10 146 46 216&#10;119 231 64 14 114 -24 132 -101 7 -29 20 -34 45 -19 12 8 13 16 2 53 -35 119&#10;-130 177 -216 132z"/>
            <path d="M690 2030 l0 -340 25 0 25 0 0 340 0 340 -25 0 -25 0 0 -340z"/>
            <path d="M810 2330 l0 -40 70 0 70 0 0 -300 0 -300 30 0 30 0 0 300 0 300 70&#10;0 70 0 0 40 0 40 -170 0 -170 0 0 -40z"/>
            <path d="M1170 2366 c0 -5 21 -56 126 -302 34 -80 34 -83 34 -228 l0 -146 30&#10;0 30 0 0 150 0 149 80 182 c44 100 80 186 80 191 0 4 -13 8 -28 8 -27 0 -31&#10;-6 -93 -159 -35 -88 -66 -158 -68 -156 -1 2 -31 73 -65 157 -61 150 -63 153&#10;-94 156 -18 2 -32 1 -32 -2z"/>
            <path d="M1610 2030 l0 -340 135 0 136 0 -5 28 c-2 15 -5 33 -5 40 -1 9 -29&#10;12 -106 12 l-105 0 0 300 0 300 -25 0 -25 0 0 -340z"/>
            <path d="M2047 2298 c-20 -89 -136 -566 -143 -590 -4 -14 1 -18 24 -18 28 0&#10;29 1 51 99 20 85 26 100 45 103 25 5 155 2 161 -4 2 -2 14 -46 27 -98 24 -93&#10;25 -95 55 -98 l31 -3 -60 233 c-33 128 -72 280 -87 338 -27 103 -28 105 -57&#10;108 -30 3 -31 2 -47 -70z m116 -313 c2 -18 -4 -20 -66 -20 -38 0 -70 2 -72 5&#10;-2 3 9 59 25 125 15 66 31 138 35 160 7 37 10 30 41 -105 19 -80 36 -154 37&#10;-165z"/>
            <path d="M2350 2031 l0 -341 25 0 25 0 1 263 0 262 24 -50 c14 -27 54 -122 91&#10;-210 110 -266 109 -265 138 -265 l26 0 0 340 0 340 -25 0 -25 0 -1 -267 c0&#10;-173 -4 -261 -10 -248 -5 11 -55 130 -112 265 -96 227 -106 245 -130 248 l-27&#10;3 0 -340z"/>
            <path d="M2780 2030 l0 -340 101 0 c85 0 107 3 139 21 52 30 85 94 106 208 28&#10;156 -3 330 -73 404 -35 36 -79 47 -185 47 l-88 0 0 -340z m246 225 c38 -47 49&#10;-100 48 -225 0 -133 -14 -192 -54 -232 -26 -26 -34 -28 -107 -28 l-78 0 3 261&#10;3 261 80 -4 c76 -3 83 -5 105 -33z"/>
            <path d="M870 1579 c0 -31 36 -167 71 -266 93 -264 243 -477 416 -593 170&#10;-114 343 -135 522 -65 237 92 451 375 564 743 l25 82 -259 0 c-199 0 -260 -3&#10;-263 -12 -2 -7 -12 -71 -21 -143 -34 -262 -110 -499 -184 -573 -131 -131 -265&#10;153 -327 696 l-17 152 -264 0 c-260 0 -263 0 -263 -21z"/>
            </g>
          </svg>
        </div>
        <!-- BODY -->
        <div class="flex flex-col gap-8" v-focustrap>
          <div class="flex flex-col gap-1">
            <div class="text-2xl font-bold text-primary">
              Welcome User
            </div>
            <div >
              Please Login to continue
            </div>
          </div>
          <form @submit.prevent="handleActionLogin" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <label for="username" class="font-semibold tracking-wider">
                ISeries Username
              </label>
              <InputText
                name="username"
                type="text"
                v-model="username"
                placeholder="ex. DEP_NAME"
                minlength="4"
                maxlength="8"
                required
                class="uppercase"
                autocomplete="off"
                aria-autocomplete="none"
                autofocus
                size="small"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label for="password" class="font-semibold tracking-wider ">
                Password
              </label>
              <InputText
                name="password"
                type="password"
                v-model="password"
                placeholder="Must be 4 - 10 characters"
                minlength="4"
                maxlength="10"
                required
                autocomplete="off"
                aria-autocomplete="none"
                size="small"
              />
            </div>
            <Button
              type="submit"
              size="small"
              label="LOGIN"
            />
            <div class="text-center">
              <span @click="loginStore.handleActionForgotPassword" class="text-sm tracking-wide cursor-pointer hover:underline hover:underline-offset-2 hover:text-primary">
                Forgot password?
              </span>
            </div>
          </form>
        </div>
        <!-- FOOTER -->
        <div class="flex flex-col items-center gap-1 mt-5 text-xs text-center">
          <div>
            © 2025 Cityland Group of Companies.
          </div>
          <div>
            All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  </section>
</template>