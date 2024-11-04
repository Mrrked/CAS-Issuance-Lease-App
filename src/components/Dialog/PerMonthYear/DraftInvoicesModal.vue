<script lang="ts" setup>
  import html2pdf from 'html2pdf.js';
  import { inject, onMounted, Ref, ref } from 'vue';
  import { COMPANY_DETAILS, COMPANIES } from './data';
  import { LeaseBill } from '../../../store/types';
  import { useConfigStore } from '../../../store/useConfigStore';

  interface DialogRef  {
    data: {
      bills: LeaseBill[]
      file_name: string
      submit: Function
      cancel: Function
    }
  }

  const configStore = useConfigStore()
  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);


  const PDF_BLOB = ref<Blob>();

  const selectedCompany = ref<COMPANY_DETAILS>(COMPANIES.find((c) => c.COMPCD === 1) as COMPANY_DETAILS)

  const handleMergePDFBlob = () => {
    if (PDF_BLOB.value) {

    }
  }

  const handleDownload = () => {
    console.log('BLOB', PDF_BLOB.value);

    if (PDF_BLOB.value) {
      const url = URL.createObjectURL(PDF_BLOB.value as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'TEST.pdf';
      a.click();
      URL.revokeObjectURL(url); // Clean up the URL object
    }
  }

  onMounted(() => {
    if (dialogRef?.value) {
      const SELECTED_BILLINGS = dialogRef.value.data.bills

      console.log('SELECTED_BILLINGS ', SELECTED_BILLINGS);

      let ALL_PAGES = ``

      const FILE_NAME = 'DRAFT - Service Invoice - 11/04/2024'

      const PAGE = `
        <div class="
            min-w-[816px] h-[1056px] min-h-[1056px] max-w-[1056px] p-[36px] gap-[12px] text-12 font-helvetica
            flex flex-col text-black bg-white
          "
        >
          <!-- HEADER -->
          <div class="grid grid-cols-7 -mt-4 min-h-24 max-h-24">
            <!-- LEFT -->
            <div class="flex items-center h-full col-span-5">
              <div class="flex items-center justify-center h-full resize-none shrink-0 w-fit">
                <img src="${selectedCompany.value.IMG_URL}" alt="logo" class="w-20">
              </div>
              <div class="flex flex-col items-start justify-center flex-1 h-full gap-1 pl-4 -mt-4 resize-none shrink-0">
                <div class="font-semibold text-16">
                  ${ selectedCompany.value.CONAME }
                </div>
                <div class="flex flex-col tracking-tighter text-10">
                  <div class="text-wrap">
                    ${ selectedCompany.value.ADDRESS }
                  </div>
                  <div>
                    TEL. NO. ${ selectedCompany.value.TEL_NO }
                  </div>
                  <div>
                    VAT REG TIN: ${ selectedCompany.value.TIN }
                  </div>
                </div>
              </div>
            </div>
            <!-- RIGHT -->
            <div class="flex flex-col items-end justify-center h-full col-span-2 -mt-2">
              <div class="font-semibold text-20 -mt-[12px]">
                SERVICE INVOICE
              </div>
              <div class="flex gap-3 font-semibold text-14">
                <div>
                  No.
                </div>
                <div>
                  VI011331A000001
                </div>
              </div>
              <div class="flex gap-3 font-semibold text-14">
                <div>
                  Date :
                </div>
                <div>
                  2021/12/01
                </div>
              </div>
            </div>
          </div>

          <!-- DESCRIPTION -->
          <div class="grid items-end grid-cols-7 gap-10 mt-1">
            <div class="flex flex-col col-span-4 shrink-0">
              <div class="flex items-end gap-3">
                <div class="w-24 font-semibold">
                  SOLD TO
                </div>
                <div>
                  :
                </div>
                <div>
                  Juan Antonio D. Perez
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-24 font-semibold shrink-0">
                  ADDRESS
                </div>
                <div>
                  :
                </div>
                <div class="flex flex-col w-full">
                  <div>
                    123 Mabini Street, Barangay Poblacion,
                  </div>
                  <div>
                    Makati City, Metro Manila, Philippines
                  </div>
                </div>
              </div>
              <div class="flex items-end gap-3">
                <div class="w-24 font-semibold">
                  TIN
                </div>
                <div>
                  :
                </div>
                <div>
                  123-456-789-000
                </div>
              </div>
            </div>
            <div class="flex flex-col col-span-3 shrink-0">
              <div class="flex items-end gap-3">
                <div class="w-24 font-semibold">
                  CLIENT KEY
                </div>
                <div>
                  :
                </div>
                <div>
                  CL310271 00
                </div>
              </div>
              <div class="flex items-end gap-3">
                <div class="w-24 font-semibold">
                  PROJECT
                </div>
                <div>
                  :
                </div>
                <div>
                  CITYNET CENTRAL
                </div>
              </div>
              <div class="flex items-end gap-3">
                <div class="w-24 font-semibold">
                  UNIT
                </div>
                <div>
                  :
                </div>
                <div class=""> L 0000</div>
              </div>
            </div>
          </div>

          <!-- TABLE -->
          <div class="flex flex-col h-full mt-2 tracking-tighter text-10">
            <!-- THEAD -->
            <div class="grid grid-cols-11 font-bold border border-black" style="line-height: 11px;">
              <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                <div class="col-span-5 px-1 pb-3 border-r border-black -pt-4 text-wrap">
                  Item / Description
                </div>
                <div class="px-1 pb-3 text-center border-r border-black -pt-4 text-wrap">
                  Qty
                </div>
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                Unit Cost
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                VATable Sales
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                VAT Exempt Sales
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                Zero Rated Sales
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                VAT
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                Government Taxes
              </div>
              <div class="px-1 pb-3 text-right border-r border-black -pt-4 text-wrap">
                Withholding Tax
              </div>
              <div class="px-1 pb-3 text-right -pt-4 text-wrap">
                Amount Due
              </div>
            </div>
            <!-- TBODY -->
            <div class="flex flex-col justify-between flex-1 pb-3 border-b border-black border-x">
              <!-- ROWS -->
              <div class="flex flex-col">
                <div class="grid grid-cols-11">
                  <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                    <div class="col-span-5 px-1 text-wrap">
                      Pen. on Rental for September 1 - 30, 2021
                    </div>
                    <div class="px-1 text-center text-wrap">
                      1
                    </div>
                  </div>
                  <div class="px-1 text-right text-wrap">
                    1,619.09
                  </div>
                  <div class="px-1 text-right text-wrap">
                    1,445.62
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    173.47
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    (28.91)
                  </div>
                  <div class="px-1 text-right text-wrap ">
                    1,590.18
                  </div>
                </div>
                <div class="grid grid-cols-11">
                  <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                    <div class="col-span-5 px-1 text-wrap">
                      Cusa for November 1 - 30, 2021
                    </div>
                    <div class="px-1 text-center text-wrap">
                      1
                    </div>
                  </div>
                  <div class="px-1 text-right text-wrap">
                    259,485.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    259,485.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    (5,189.70)
                  </div>
                  <div class="px-1 text-right text-wrap">
                    254.295.30
                  </div>
                </div>
                <div class="grid grid-cols-11">
                  <div class="grid grid-cols-6 col-span-3 px-1 text-wrap">
                    <div class="col-span-5 px-1 text-wrap">
                      Pen. on Cusa for September 1 - 30, 2021
                    </div>
                    <div class="px-1 text-center text-wrap">
                      1
                    </div>
                  </div>
                  <div class="px-1 text-right text-wrap">
                    345.98
                  </div>
                  <div class="px-1 text-right text-wrap">
                    308.91
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    37.07
                  </div>
                  <div class="px-1 text-right text-wrap">
                    0.00
                  </div>
                  <div class="px-1 text-right text-wrap">
                    (6.18)
                  </div>
                  <div class="px-1 text-right text-wrap ">
                    339.80
                  </div>
                </div>
                <pre> </pre>
              </div>

              <!-- BREAKDOWN -->
              <div class="grid items-end grid-cols-2 gap-16 px-2 tracking-normal text-12">
                <!-- COL 1 -->
                <div class="flex flex-col">
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      VATable Sales
                    </div>
                    <div class="col-span-2 text-right">
                      1,754.53
                    </div>
                  </div>
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      VAT Amount
                    </div>
                    <div class="col-span-2 text-right">
                      210.54
                    </div>
                  </div>
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      VAT Exempt Sales
                    </div>
                    <div class="col-span-2 text-right">
                      0.00
                    </div>
                  </div>
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      Zero-Rated Sales
                    </div>
                    <div class="col-span-2 text-right">
                      259,485.00
                    </div>
                  </div>
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      Government Taxes
                    </div>
                    <div class="col-span-2 text-right">
                      0.00
                    </div>
                  </div>
                </div>
                <!-- COL 2 -->
                <div class="flex flex-col">
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      Total Sales
                    </div>
                    <div class="col-span-2 text-right">
                      261,239.53
                    </div>
                  </div>
                  <div class="grid grid-cols-3">
                    <div class="col-span-1 font-bold text-left">
                      Add: VAT
                    </div>
                    <div class="col-span-2 text-right">
                      210.54
                    </div>
                  </div>
                  <div class="grid grid-cols-5">
                    <div class="col-span-2 font-bold text-left">
                      Less: Withholding Tax
                    </div>
                    <div class="col-span-3 text-right">
                      5,224.79
                    </div>
                  </div>
                  <div class="mt-2 border-t border-black"></div>
                  <div class="grid grid-cols-3 -mt-1">
                    <div class="col-span-1 font-bold text-left">
                      Total Amount Due
                    </div>
                    <div class="col-span-2 text-right">
                      256,225.28
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- GENERATE LABEL -->
          <div class="flex flex-col mt-[100px] mb-[20px] ">
            <div v-if="withBankCharges" class="w-full pb-2">
              * Bank charges are to be remitted to the Bank.
            </div>
            <div class="italic text-center border-t border-black">
              This document is computer generated, no signature required.
            </div>
          </div>

          <!-- FOOTER -->
          <div class="flex flex-col tracking-normal">
            <div>
              Acknowledgement Certificate No. : xxxxxxxxxxxxxxx
            </div>
            <div>
              Date Issued : xxxx/xx/xx
            </div>
            <div>
              Series Range : VI011331A000001 - VI011339Z999999
            </div>
            <div>
              Timestamp : 12/01/2021 10:35:28 CELOISA
            </div>
          </div>
        </div>
      `;

      // SELECTED_BILLINGS.forEach((BILL, index) => {
      //   if (index === 0) {
      //     ALL_PAGES = PAGE
      //   } else if(index <= 60) {
      //     ALL_PAGES += PAGE
      //   }
      // })


      for (let index = 0; index < 30; index++) {
        ALL_PAGES += PAGE
      }

      const CONFIGURATION = {
        margin: 0,
        filename: FILE_NAME,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      html2pdf()
        .set(CONFIGURATION)
        .from(ALL_PAGES)
        .output('blob')
        .then(async (pdfBlob: Blob) => {
          const previewElement = document.getElementById('pdf-preview') as HTMLIFrameElement;
          PDF_BLOB.value = await configStore.mergeAndPreviewPDF(pdfBlob, pdfBlob, previewElement)
          console.log(PDF_BLOB.value);
        })

      // html2pdf()
      //   .set(CONFIGURATION)
      //   .from(ALL_PAGES)
      //   .save()
    }
  })

</script>


<template>
  <div>
    <div>
      <button type="button" @click="handleDownload" > Download </button>
    </div>
    <iframe id="pdf-preview" style="width: 100%; height: 500px;" class="border border-black"></iframe>
  </div>
</template>