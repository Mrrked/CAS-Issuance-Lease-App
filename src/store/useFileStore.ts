import { FileAttachment } from './types'
import { PDFDocument } from 'pdf-lib';
import { defineAsyncComponent } from 'vue';
import { defineStore } from 'pinia'
import { useDialog } from 'primevue/usedialog';
import { useToast } from 'primevue/usetoast'

const ViewImageModal = defineAsyncComponent(() => import('../components/Dialog/General/File/ViewImageModal.vue'));
const ViewPDFModal = defineAsyncComponent(() => import('../components/Dialog/General/File/ViewPDFModal.vue'));



export const useFileStore = defineStore('file', () => {

  const toast = useToast()
  const dialog = useDialog()

  const mergePDFBlobs = async (blobs: Blob[]) => {
    const mergedPdf = await PDFDocument.create();

    for (const blob of blobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes: any = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

    return mergedBlob;
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

  const handleActionViewFile = (file: FileAttachment) => {
    if (file && file.url && file.type === 'application/pdf') {
      handleActionViewFilePDF('View PDF: ' + file.name, file.name, null, file.url, () => {}, () => {})
    } else if (file && file.url && file.type.includes('image') ) {
      handleActionViewFileImage(file.url, 'View Image: ' + file.name)
    } else if (file && file.url) {
      window.open(file.url, '_blank')
    }
  }

  const handleActionDownloadFile = (file: FileAttachment) => {
    if (file.url) {
      fetch(file.url)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', file.name);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error(error);
          toast.add({
            severity: 'error',
            summary: 'Download Failed!',
            detail: `Failed to download file '${file.name}'.`,
            life: 3000
          });
        });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Download Failed!',
        detail: `File not found: '${file.name}'.`,
        life: 3000
      });
    }
  }

  const handleActionDownloadFileBlob = (blob: Blob, fileName: string):void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    mergePDFBlobs,

    handleActionViewFilePDF,
    handleActionViewFileImage,
    handleActionViewFile,

    handleActionDownloadFile,
    handleActionDownloadFileBlob,
  }
})