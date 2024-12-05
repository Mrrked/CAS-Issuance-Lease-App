import { AxiosError } from 'axios';
import { DynamicDialogInstance } from 'primevue/dynamicdialogoptions';
import LoadingModal from '../components/Dialog/General/LoadingModal.vue';
import { defineStore } from 'pinia'
import { useDialog } from 'primevue/usedialog';
import { useToast } from 'primevue/usetoast';

export const useUtilitiesStore = defineStore('utils', () => {

  const toast = useToast();
  const dialog = useDialog();

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

  const convertDateObjToNumberYYYYMMDD = (date: Date):number => {
    try {
      return parseInt(`${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`)
    } catch (error) {
      return 0
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

  const handleAxiosError = (error: AxiosError):void => {
    if (error.response?.status) {
      const errData = error.response?.data as { error: string, exception?: string };

      interface ErrorLog {
        status: number,
        statusText: string,
        message: string,
        exception: string,
        date: string,
        time: string,
      }

      let errorLog:ErrorLog = {
        'status': error.response.status,
        'statusText': error.response.statusText,
        'message': errData.error || '',
        'exception': errData.exception || '',
        'date': new Date().toLocaleDateString(),
        'time': new Date().toLocaleTimeString(),
      }

      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: errData.error ? errData.error : error.response.statusText + ': ' + error.message,
        life: 5000
      });

      console.log(JSON.stringify(errorLog));

      const ERROR_LOGS = localStorage.getItem(new Date().toLocaleDateString())
      let ERROR_LOGS_JSON: ErrorLog[] = []

      if (ERROR_LOGS) {
        ERROR_LOGS_JSON = JSON.parse(ERROR_LOGS) as ErrorLog[]
      }

      ERROR_LOGS_JSON.push(errorLog)

      console.log(ERROR_LOGS_JSON);

      localStorage.setItem(new Date().toLocaleDateString(), JSON.stringify(ERROR_LOGS_JSON))

    } else {
      // SERVER IS NOT RECEIVING REQUESTS
      // SERVER COULD BE DOWN
      console.log('Error: No Response Status Returned');
      toast.add({
        severity: 'warn',
        summary: 'Error',
        detail: 'Can\'t reach server.',
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

  return {
    formatTimeNumberToString12H,
    formatTimeNumberToString24H,

    formatDateNumberToStringMONTHDDYYYY,
    formatDateNumberToStringYYYYMMDD,

    convertDateObjToNumberYYYYMMDD,
    convertNumberToRoundedNumber,

    addLeadingZeroes,
    formatNumberToString2DecimalNumber,

    startLoadingModal,

    handleAxiosError,
    handleDownloadFile,
  }
})