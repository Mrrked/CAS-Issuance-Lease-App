import { defineAsyncComponent, ref } from 'vue';

import { DynamicDialogInstance } from 'primevue/dynamicdialogoptions';
import { ExtendedAxiosError } from './types';
import { defineStore } from 'pinia'
import { useDialog } from 'primevue/usedialog';
import { usePrimeVue } from 'primevue/config';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const LoadingModal = defineAsyncComponent(() => import('../components/Dialog/General/LoadingModal.vue'));
const ViewImageModal = defineAsyncComponent(() => import('../components/Dialog/General/File/ViewImageModal.vue'));
const ViewPDFModal = defineAsyncComponent(() => import('../components/Dialog/General/File/ViewPDFModal.vue'));
const EnterPasswordDialogModal = defineAsyncComponent(() => import('../components/Dialog/General/EnterPasswordDialogModal.vue'));

export const useUtilitiesStore = defineStore('utils', () => {

  const $primevue = usePrimeVue();

  const toast = useToast();
  const router = useRouter();
  const dialog = useDialog();

  const isOpenConfirmAdminPassword = ref(false);

  const formatTimeNumberToString12H = (number: number):string => {
    const timeStr = number.toString().padStart(6, '0');

    let hours = parseInt(timeStr.slice(0, 2));
    const minutes = timeStr.slice(2, 4);
    const seconds = timeStr.slice(4, 6);

    const period = hours < 12 ? 'AM' : 'PM';

    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours -= 12;
    }

    return `${hours}:${minutes}:${seconds} ${period}`;
  }

  const formatTimeNumberToString24H = (number: number):string => {
    let hours = Math.floor(number / 10000);
    let minutes = Math.floor((number % 10000) / 100);
    let seconds = number % 100;

    let formattedHours = hours.toString().padStart(2, '0');
    let formattedMinutes = minutes.toString().padStart(2, '0');
    let formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  const formatDateNumberToStringMONTHDDYYYY = (number: number):string => {
    const dateStr: string = number.toString().padStart(8, '0');

    const year: number = parseInt(dateStr.slice(0, 4), 10);
    const month: number = parseInt(dateStr.slice(4, 6), 10) - 1;
    const day: number = parseInt(dateStr.slice(6, 8), 10);

    const date: Date = new Date(year, month, day);

    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    return date.toLocaleDateString('en-US', options);
  }

  const formatDateNumberToStringYYYYMMDD = (number: number):string => {
    const dateStr = number.toString();
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    return `${year}/${month}/${day}`;
  }

  const formatBytesToFileSize = (bytes: number) => {
    const k = 1024;
    const dm = 3;
    const sizes = $primevue.config.locale?.fileSizeTypes || [];

    if (bytes === 0) {
      return `0 ${sizes[0]}`;
    }

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${formattedSize} ${sizes[i]}`;
  };

  const convertDateObjToNumberYYYYMMDD = (date: Date):number => {
    try {
      return parseInt(`${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`)
    } catch (error) {
      return 0
    }
  }

  const convertDateObjToStringMONDDYYYY12H = (date: string):string => {
    try {
      if (!date) {
        return ''
      }
      const options: Intl.DateTimeFormatOptions = {
        month: "short",    // 'Dec'
        day: "numeric",    // '14'
        year: "numeric",   // '2024'
        hour: "numeric",   // '2'
        minute: "numeric", // '10'
        second: "numeric", // '47'
        hour12: true       // 12-hour clock with AM/PM
      };
      return new Date(date).toLocaleString("en-US", options);
    } catch (error) {
      return ''
    }
  }

  const convertDateObjToStringMMDDYYYY24H = (date: string):string => {
    try {
      if (!date) {
        return ''
      }
      const options: Intl.DateTimeFormatOptions = {
        month: "numeric",   // '12'
        day: "numeric",     // '14'
        year: "numeric",    // '2024'
        hour: "numeric",    // '2'
        minute: "numeric",  // '10'
        // second: "numeric",  // '47'
        hour12: false       // 24-hour clock without AM/PM
      };
      return new Date(date).toLocaleString("en-US", options);
    } catch (error) {
      return ''
    }
  }

  const convertDateObjToStringMONDDYYYY = (date: string):string => {
    try {
      if (!date) {
        return ''
      }
      const options: Intl.DateTimeFormatOptions = {
        month: "long",    // 'December'
        day: "numeric",    // '14'
        year: "numeric",   // '2024'
      };
      return new Date(date).toLocaleString("en-US", options);
    } catch (error) {
      return ''
    }
  }

  const convertDatesObjToDurationString = (start: string, end: string):string => {
    try {
      if (!start || !end) {
        return ''
      }
      const startDate = new Date(start);
      const endDate = new Date(end);

      // Calculate the difference in milliseconds
      let duration = endDate.getTime() - startDate.getTime();

      // Convert milliseconds to days, hours, minutes
      const oneMinute = 60 * 1000;
      const oneHour = 60 * oneMinute;
      const oneDay = 24 * oneHour;

      const days = Math.floor(duration / oneDay);
      duration -= days * oneDay;

      const hours = Math.floor(duration / oneHour);
      duration -= hours * oneHour;

      const minutes = Math.floor(duration / oneMinute);

      // Build the result string
      let result = '';
      if (days > 0) {
        result += `${days} day${days > 1 ? 's' : ''} `;
      }
      if (hours > 0) {
        result += `${hours} hour${hours > 1 ? 's' : ''} `;
      }
      if (minutes > 0) {
        result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }

      return result.trim();
    } catch (error) {
      return ''
    }
  }

  const convertNumberToRoundedNumber = (num: number):number => {
    return Math.round(num * 100) / 100
  }

  const addLeadingZeroes = (num: number | string, length: number): string => {
    return num.toString().trim().padStart(length, '0');
  }

  const formatNumberToString2DecimalNumber = (num: number):string => {
    if(num)
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    else
      return '0.00'
  }

  const isInvalidValue = (value: any): boolean => {
    if (value === undefined) return true
    if (value === null) return true
    if (value === '') return true
    if (value === 0) return true

    return false
  }

  const startLoadingModal = (label: string): DynamicDialogInstance => {
    const loadingDialogRef = dialog.open(LoadingModal, {
      data: {
        label
      },
      props: {
        style: {
          paddingTop: '1.5rem',
        },
        showHeader: false,
        modal: true
      }
    })

    return loadingDialogRef;
  }

  const handleAxiosError = (error: ExtendedAxiosError):void => {
    if (error.response) {
      const { status, data }: { status: number, data: { error: string, details: [], exception: string} } = error.response as any;
      // console.error(`HTTP Status: ${status}`);
      // console.error("Response Data:", data);

      if (status === 401) {
        toast.add({
          severity: 'error',
          summary: 'Session has expired.',
          detail: 'Please login again.',
          life: 5000
        });
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
        router.push('/login')
      } else if (status === 500 && data?.exception) {
        console.error('EXCEPTION: ', data.exception)
      }

      if (data?.error && data.error !== 'Invalid submission data!') {
        // Custom error message from the server
        console.error(`Server Error: ${data.error}`);
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: data.error,
          life: 5000
        });
      }

      if (data?.details) {
        console.error("Details:", data.details);
        const details = Object.entries(data.details)

        details.forEach((pair) => {
          const key = pair[0] as string
          const values = pair[1] as string[]

          values.forEach((value) => {
            toast.add({
              severity: 'error',
              summary: key !== 'non_field_errors' ? 'Invalid field: ' + key : 'Error',
              detail: value,
              life: 5000
            });
          })
        })
      }

    } else if (error.request) {
      toast.add({
        severity: 'error',
        summary: 'Exception',
        detail: 'Server can\'t be reached.',
        life: 5000
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 5000
      });
    }
  };

  const handleDownloadFile = (blob: Blob, fileName: string):void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  const handleActionViewFilePDF = (header: string, filename: string, pdfBlob: Blob | null, pdfURL: string | null, printCallback: Function | null, downloadCallback: Function | null) => {
    let url: string | null = null

    if (!pdfURL && pdfBlob) {
      url = URL.createObjectURL(pdfBlob);
    } else {
      url = pdfURL || null
    }
    if (url) {
      dialog.open(ViewPDFModal, {
        data: {
          filename: filename,
          pdfURL: url,
          printCallback,
          downloadCallback
        },
        props: {
          header: header,
          style: {
            width: '60rem',
          },
          showHeader: true,
          modal: true,
          maximizable: true,
        }
      })
    }
  }

  const handleActionViewFileImage = (url: string, header: string) => {
    dialog.open(ViewImageModal, {
      data: {
        url: url,
      },
      props: {
        header: header,
        style: {
          width: '60rem',
        },
        showHeader: true,
        modal: true,
        maximizable: true,
      }
    })
  }

  const handleActionConfirmAdminPassword = (password: string, callback: Function) => {
    if (!isOpenConfirmAdminPassword.value) {
      isOpenConfirmAdminPassword.value = true
      const EnterPasswordDialogRef = dialog.open(EnterPasswordDialogModal, {
        data: {
          password,
          submit: () => {
            EnterPasswordDialogRef.close()
            callback()
          },
          cancel: () => {
            EnterPasswordDialogRef.close()
          }
        },
        props: {
          header: '(OVERRIDE) Authorization Required!',
          style: {
            width: '26rem'
          },
          showHeader: true,
          modal: true,
        },
        onClose: () => {
          isOpenConfirmAdminPassword.value = false
        }
      })
    }
  }

  return {
    formatTimeNumberToString12H,
    formatTimeNumberToString24H,

    formatDateNumberToStringMONTHDDYYYY,
    convertDateObjToStringMMDDYYYY24H,
    formatDateNumberToStringYYYYMMDD,

    formatBytesToFileSize,

    convertDateObjToNumberYYYYMMDD,
    convertDateObjToStringMONDDYYYY12H,
    convertDateObjToStringMONDDYYYY,
    convertDatesObjToDurationString,
    convertNumberToRoundedNumber,

    addLeadingZeroes,
    formatNumberToString2DecimalNumber,

    isInvalidValue,

    startLoadingModal,

    handleAxiosError,
    handleDownloadFile,
    handleActionViewFilePDF,
    handleActionViewFileImage,
    handleActionConfirmAdminPassword,
  }
})