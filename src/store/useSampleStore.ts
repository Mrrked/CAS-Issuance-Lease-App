import { InvoicePDF } from './types';
import { defineStore } from 'pinia'
import { onMounted } from 'vue';
import { useCompanyHeaderStore } from './useCompanyHeaderStore';
import { useFileStore } from './useFileStore';
import { useIssuanceStore } from './useIssuanceStore';

const IS_TEST = import.meta.env.VITE_IS_TEST || 'FALSE';

export const useSampleStore = defineStore('sample', () => {

  const fileStore = useFileStore()

  const issuanceStore = useIssuanceStore()
  const companyHeaderStore = useCompanyHeaderStore()

  const handlePreviewSampleInvoicePDF = (invoicePDF: InvoicePDF) => {
    const PDF_BLOB = issuanceStore.generateInvoicePDFBlob(invoicePDF)

    const name = invoicePDF.header.controlNumber

    fileStore.handleActionViewFilePDF(
      name + ' (Preview)',
      `${name}.pdf`,
      PDF_BLOB,
      null,
      () => {},
      () => {}
    )
  }

  onMounted(() => {
    if (IS_TEST === 'TRUE') {
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CDC_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CDC_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CDC_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CDC_Manila)

      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CI_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CI_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CI_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CI_Manila)

      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CLDI_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CLDI_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CLDI_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Service_Invoice_CLDI_Manila)

      ////////////////////////////////////////////////////////////////////////

      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CDC_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CDC_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CDC_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CDC_Manila)

      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CI_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CI_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CI_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CI_Manila)

      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CLDI_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CLDI_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CLDI_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Water_CLDI_Manila)

      ////////////////////////////////////////////////////////////////////////

      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CDC_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CDC_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CDC_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CDC_Manila)

      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CI_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CI_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CI_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CI_Manila)

      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CLDI_Makati)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CLDI_Ortigas)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CLDI_VitoCruz)
      handlePreviewSampleInvoicePDF(InvoicePDF_Billing_Invoice_Elec_CLDI_Manila)
    }
  })

  const InvoicePDF_Service_Invoice_CDC_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA ST BEL-AIR 1209\nCITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CDC',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-527-103-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'SERVICE',
      controlNumber: 'IS011111A000167',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "UNIT 107 2ND FLR R.M. MARIZ BLDG MC ARTHUR HIGHWAY WAKAS, BOCAUE, BULACAN, REGION III (CENTRAL LUZON)",
      tin: '123-456-789-00000',
      clientKey: 'CL110078L00',
      project: 'CITYNET1',
      unit: ' L  G-14',
      salesStaff: 'KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'RENTAL (October 2025) (VATable)',
          qty: '1',
          unitCost: '30,824.00',
          vatAmount: '3,698.88',
          amount: '34,522.88',
        },
        {
          itemDescription: 'CUSA CHARGES (October 2025) (VATable)',
          qty: '1',
          unitCost: ' 5,779.50',
          vatAmount: '693.54',
          amount: '6,473.04',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '36,603.50',
          vatAmount: '4,392.42',
          vatExemptSales: '0.00',
          zeroRatedSales: '0.00',
          governmentTax: '0.00',
        },
        section2: {
          totalSales: '40,995.92',
          lessVAT: '4,392.42',
          netOfVAT: '36,603.50',
          addVAT: '4,392.42',
          addGovernmentTaxes: '0.00',
          lessWithholdingTax: '1,656.79',
          totalAmountDue: '39,339.13',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'IS011111A000001 - IS011119Z999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Service_Invoice_CDC_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR. RD.\nCOR. RUBY & GARNET RDS ORTIGAS CENTER\nPASIG CITY 1605",
      companyInitials: "CDC",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-527-103-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS011331A000058", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 107 2ND FLR R.M. MARIZ BLDG MC ARTHUR HIGHWAY WAKAS, BOCAUE, BULACAN, REGION III (CENTRAL LUZON)",
      tin: "123-456-789-00000",
      clientKey: "CL110078L00",
      project: "CITYNET1",
      unit: " L  G-14",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Service_Invoice_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS011331A000001 - IS011339Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Service_Invoice_CDC_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "UNIT 102 & 103 GROUND FLOOR THE PACIFIC REGENCY\n760 PABLO OCAMPO ZONE 78 BRGY 719 NCR,\nCITY OF MANILA, FIRST DISTRICT MALATE 1004",
      companyInitials: "CDC",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-527-103-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS011441A000569", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 107 2ND FLR R.M. MARIZ BLDG MC ARTHUR HIGHWAY WAKAS, BOCAUE, BULACAN, REGION III (CENTRAL LUZON)",
      tin: "123-456-789-00000",
      clientKey: "CL110078L00",
      project: "CITYNET1",
      unit: " L  G-14",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Service_Invoice_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS011441A000001 - IS011449Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Service_Invoice_CDC_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CDC",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-527-103-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS011551A000070", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 107 2ND FLR R.M. MARIZ BLDG MC ARTHUR HIGHWAY WAKAS, BOCAUE, BULACAN, REGION III (CENTRAL LUZON)",
      tin: "123-456-789-00000",
      clientKey: "CL110078L00",
      project: "CITYNET1",
      unit: " L  G-14",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Service_Invoice_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS011551A000001 - IS011559Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  const InvoicePDF_Service_Invoice_CI_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITYLAND, INC.",
      companyAddress: "3/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA STREET\nBEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CI',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-662-829-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'SERVICE',
      controlNumber: 'IS021111A000017',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "UNIT 1005 TAGAYTAY PRIME RESIDENCES, TAGAYTAY PRIME ROTUNDA, BRGY. SAN JOSE, TAGAYTAY CITY",
      tin: '123-456-789-00000',
      clientKey: 'C6011836L00',
      project: 'TAGAYTAY PRIME RESIDENCES',
      unit: ' L BP117',
      salesStaff: 'NQE',
    },
    body: {
      billings: [
        {
          itemDescription: 'RENTAL (October 2025) (VATable)',
          qty: '1',
          unitCost: '1,785.71',
          vatAmount: '214.29',
          amount: '2,000.00',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '1,785.71',
          vatAmount: '214.29',
          vatExemptSales: '0.00',
          zeroRatedSales: '0.00',
          governmentTax: '0.00',
        },
        section2: {
          totalSales: '2,000.00',
          lessVAT: '214.29',
          netOfVAT: '1,785.71',
          addVAT: '214.29',
          addGovernmentTaxes: '0.00',
          lessWithholdingTax: '0.00',
          totalAmountDue: '2,000.00',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'IS021111A000001 - IS021119Z999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Service_Invoice_CI_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR\nROAD CORNER RUBY AND GARNET ROADS ORTIGAS\nCENTER PASIG CITY 1605",
      companyInitials: "CI",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-662-829-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS021331A000088", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 1005 TAGAYTAY PRIME RESIDENCES, TAGAYTAY PRIME ROTUNDA, BRGY. SAN JOSE, TAGAYTAY CITY",
      tin: "123-456-789-00000",
      clientKey: "C6011836L00",
      project: "TAGAYTAY PRIME RESIDENCES",
      unit: " L BP117",
      salesStaff: "NQE",
    },
    body: { ...InvoicePDF_Service_Invoice_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS021331A000001 - IS021339Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Service_Invoice_CI_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "UNIT 102 & 103 GROUND FLOOR THE PACIFIC REGENCY\n760 PABLO OCAMPO STREET BARANGAY 719, MALATE NCR,\nCITY OF MANILA, FIRST DISTRICT PHILIPPINES 1004",
      companyInitials: "CI",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-662-829-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS021441A000039", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 1005 TAGAYTAY PRIME RESIDENCES, TAGAYTAY PRIME ROTUNDA, BRGY. SAN JOSE, TAGAYTAY CITY",
      tin: "123-456-789-00000",
      clientKey: "C6011836L00",
      project: "TAGAYTAY PRIME RESIDENCES",
      unit: " L BP117",
      salesStaff: "NQE",
    },
    body: { ...InvoicePDF_Service_Invoice_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS021441A000001 - IS021449Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Service_Invoice_CI_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CI",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-662-829-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS021551A000170", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 1005 TAGAYTAY PRIME RESIDENCES, TAGAYTAY PRIME ROTUNDA, BRGY. SAN JOSE, TAGAYTAY CITY",
      tin: "123-456-789-00000",
      clientKey: "C6011836L00",
      project: "TAGAYTAY PRIME RESIDENCES",
      unit: " L BP117",
      salesStaff: "NQE",
    },
    body: { ...InvoicePDF_Service_Invoice_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS021551A000001 - IS021559Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  const InvoicePDF_Service_Invoice_CLDI_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "3F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA BEL-AIR 1209\nCITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CI',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-444-840-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'SERVICE',
      controlNumber: 'IS121111A000176',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "UNIT 2729 GRAND EMERALD TOWER, #6 F. ORTIGAS JR.AVENUE COR GARNET & RUBY ROADS,ORTIGAS CENTER, PASIG CITY",
      tin: '123-456-789-00000',
      clientKey: 'C5311707L00',
      project: 'GRAND EMERALD TOWER',
      unit: ' L  PL10B1',
      salesStaff: 'AMG',
    },
    body: {
      billings: [
        {
          itemDescription: 'RENTAL (October 2025) (VATable)',
          qty: '1',
          unitCost: '4,017.86',
          vatAmount: '482.14',
          amount: '4,500.00',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '4,017.86',
          vatAmount: '482.14',
          vatExemptSales: '0.00',
          zeroRatedSales: '0.00',
          governmentTax: '0.00',
        },
        section2: {
          totalSales: '4,500.00',
          lessVAT: '482.14',
          netOfVAT: '4,017.86',
          addVAT: '482.14',
          addGovernmentTaxes: '0.00',
          lessWithholdingTax: '0.00',
          totalAmountDue: '4,500.00',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'IS121111A000001 - IS121119Z999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Service_Invoice_CLDI_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR. RD\nCOR. RUBY & GARNET RDS. ORTIGAS CTR. PASIG CITY\n1605",
      companyInitials: "CI",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-444-840-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS121331A000012", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 2729 GRAND EMERALD TOWER, #6 F. ORTIGAS JR.AVENUE COR GARNET & RUBY ROADS,ORTIGAS CENTER, PASIG CITY",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "AMG",
    },
    body: { ...InvoicePDF_Service_Invoice_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS121331A000001 - IS121339Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Service_Invoice_CLDI_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "UNIT 102 & 103 GRD FLR, THE PACIFIC REGENCY 760\nPABLO OCAMPO ST ZONE 78 BARANGAY 719, MALATE NCR,\nCITY OF MANILA, FIRST DISTRICT PHILIPPINES 1004",
      companyInitials: "CI",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-444-840-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS121441A000090", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 2729 GRAND EMERALD TOWER, #6 F. ORTIGAS JR.AVENUE COR GARNET & RUBY ROADS,ORTIGAS CENTER, PASIG CITY",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "AMG",
    },
    body: { ...InvoicePDF_Service_Invoice_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS121441A000001 - IS121449Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Service_Invoice_CLDI_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CI",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-444-840-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "SERVICE",
      controlNumber: "IS121551A000017", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "UNIT 2729 GRAND EMERALD TOWER, #6 F. ORTIGAS JR.AVENUE COR GARNET & RUBY ROADS,ORTIGAS CENTER, PASIG CITY",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "AMG",
    },
    body: { ...InvoicePDF_Service_Invoice_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "IS121551A000001 - IS121559Z999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  const InvoicePDF_Billing_Invoice_Water_CDC_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA ST BEL-AIR 1209\nCITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CDC',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-527-103-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'BILLING',
      controlNumber: 'BI0111101000167',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "3/F CITYNET1 183 EDSA WACK WACK, MANDALUYONG CITY ",
      tin: '123-456-789-00000',
      clientKey: 'CL110073L00',
      project: 'CITYNET1',
      unit: ' L  U001',
      salesStaff: 'KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'WATER CHARGES (September 2025) (VAT-Exempt)',
          qty: '1',
          unitCost: '1,961.11',
          vatAmount: '0.00',
          amount: '1,961.11',
        },
        {
          itemDescription: "WATER CHARGES (September 2025) (Gov't-Taxes)",
          qty: '1',
          unitCost: '49.03',
          vatAmount: '0.00',
          amount: '49.03',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '0.00',
          vatAmount: '1,961.11',
          vatExemptSales: '0.00',
          zeroRatedSales: '0.00',
          governmentTax: '49.03',
        },
        section2: {
          totalSales: '2,010.14',
          lessVAT: '0.00',
          netOfVAT: '1,961.11',
          addVAT: '0.00',
          addGovernmentTaxes: '49.03',
          lessWithholdingTax: '39.22',
          totalAmountDue: '1,970.92',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'BI0111101000001 - BI0111199999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Billing_Invoice_Water_CDC_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR. RD.\nCOR. RUBY & GARNET RDS ORTIGAS CENTER\nPASIG CITY 1605",
      companyInitials: "CDC",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-527-103-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0113301000058", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "3/F CITYNET1 183 EDSA WACK WACK, MANDALUYONG CITY ",
      tin: "123-456-789-00000",
      clientKey: "CL110073L00",
      project: "CITYNET1",
      unit: " L  U001",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0113301000001 - BI0113399999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Water_CDC_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "UNIT 102 & 103 GROUND FLOOR THE PACIFIC REGENCY\n760 PABLO OCAMPO ZONE 78 BRGY 719 NCR,\nCITY OF MANILA, FIRST DISTRICT MALATE 1004",
      companyInitials: "CDC",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-527-103-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0114401000569", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "3/F CITYNET1 183 EDSA WACK WACK, MANDALUYONG CITY ",
      tin: "123-456-789-00000",
      clientKey: "CL110073L00",
      project: "CITYNET1",
      unit: " L  U001",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0114401000001 - BI0114499999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Water_CDC_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CDC",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-527-103-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0115501000070", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "3/F CITYNET1 183 EDSA WACK WACK, MANDALUYONG CITY ",
      tin: "123-456-789-00000",
      clientKey: "CL110073L00",
      project: "CITYNET1",
      unit: " L  U001",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0115501000001 - BI0115599999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  const InvoicePDF_Billing_Invoice_Water_CI_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITYLAND, INC.",
      companyAddress: "3/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA STREET\nBEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CI',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-662-829-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'BILLING',
      controlNumber: 'BI0211101000017',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "110 E. RODRIGUEZ JR. AVENUE, BAGUMBAYAN, QUEZON CITY",
      tin: '123-456-789-00000',
      clientKey: 'O2511040L00',
      project: 'UDC (PASIG)',
      unit: ' L BP117',
      salesStaff: 'RLP/KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'WATER CHARGES (September 2025) (VAT-Exempt)',
          qty: '1',
          unitCost: '14,082.31',
          vatAmount: ' 73.98',
          amount: '14,156.29',
        },
        {
          itemDescription: "WATER CHARGES (September 2025) (Gov't-Taxes)",
          qty: '1',
          unitCost: '343.38',
          vatAmount: '0.00',
          amount: '343.38',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '616.48',
          vatAmount: '73.98',
          vatExemptSales: '13,465.83',
          zeroRatedSales: '0.00',
          governmentTax: '343.38',
        },
        section2: {
          totalSales: '14,499.67',
          lessVAT: '73.98',
          netOfVAT: '14,082.31',
          addVAT: '73.98',
          addGovernmentTaxes: '343.38',
          lessWithholdingTax: '281.65',
          totalAmountDue: '14,218.02',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'BI0211101000001 - BI0211199999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Billing_Invoice_Water_CI_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR\nROAD CORNER RUBY AND GARNET ROADS ORTIGAS\nCENTER PASIG CITY 1605",
      companyInitials: "CI",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-662-829-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0213301000088", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "110 E. RODRIGUEZ JR. AVENUE, BAGUMBAYAN, QUEZON CITY",
      tin: "123-456-789-00000",
      clientKey: "O2511040L00",
      project: "UDC (PASIG)",
      unit: " L BP117",
      salesStaff: "RLP/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0213301000001 - BI0213399999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Water_CI_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "UNIT 102 & 103 GROUND FLOOR THE PACIFIC REGENCY\n760 PABLO OCAMPO STREET BARANGAY 719, MALATE NCR,\nCITY OF MANILA, FIRST DISTRICT PHILIPPINES 1004",
      companyInitials: "CI",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-662-829-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0214401000039", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "110 E. RODRIGUEZ JR. AVENUE, BAGUMBAYAN, QUEZON CITY",
      tin: "123-456-789-00000",
      clientKey: "O2511040L00",
      project: "UDC (PASIG)",
      unit: " L BP117",
      salesStaff: "RLP/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0214401000001 - BI0214499999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Water_CI_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CI",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-662-829-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0215501000170", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "110 E. RODRIGUEZ JR. AVENUE, BAGUMBAYAN, QUEZON CITY",
      tin: "123-456-789-00000",
      clientKey: "O2511040L00",
      project: "UDC (PASIG)",
      unit: " L BP117",
      salesStaff: "RLP/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0215501000001 - BI0215599999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  const InvoicePDF_Billing_Invoice_Water_CLDI_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "3F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA BEL-AIR 1209\nCITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CI',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-444-840-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'BILLING',
      controlNumber: 'BI1211101000176',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: '123-456-789-00000',
      clientKey: 'C5311707L00',
      project: 'GRAND EMERALD TOWER',
      unit: ' L  PL10B1',
      salesStaff: 'KRN/KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'WATER CHARGES (September 2025) (VAT-Exempt)',
          qty: '1',
          unitCost: '595.17',
          vatAmount: '0.00',
          amount: '595.17',
        },
        {
          itemDescription: 'WATER CHARGES (September 2025) (Gov\'t-Taxes)',
          qty: '1',
          unitCost: '14.88',
          vatAmount: '0.00',
          amount: '14.88',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '0.00',
          vatAmount: '0.00',
          vatExemptSales: '595.17',
          zeroRatedSales: '0.00',
          governmentTax: '14.88',
        },
        section2: {
          totalSales: '610.05',
          lessVAT: '0.00',
          netOfVAT: '595.17',
          addVAT: '0.00',
          addGovernmentTaxes: '14.88',
          lessWithholdingTax: '11.90',
          totalAmountDue: '598.15',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'BI1211101000001 - BI1211199999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Billing_Invoice_Water_CLDI_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR. RD\nCOR. RUBY & GARNET RDS. ORTIGAS CTR. PASIG CITY\n1605",
      companyInitials: "CI",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-444-840-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI1213301000012", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "KRN/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI1213301000001 - BI1213399999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Water_CLDI_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "UNIT 102 & 103 GRD FLR, THE PACIFIC REGENCY 760\nPABLO OCAMPO ST ZONE 78 BARANGAY 719, MALATE NCR,\nCITY OF MANILA, FIRST DISTRICT PHILIPPINES 1004",
      companyInitials: "CI",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-444-840-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI1214401000090", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "KRN/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI1214401000001 - BI1214499999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Water_CLDI_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CI",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-444-840-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI1215501000017", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "KRN/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Water_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI1215501000001 - BI1215599999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  const InvoicePDF_Billing_Invoice_Elec_CDC_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA ST BEL-AIR 1209\nCITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CDC',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-527-103-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'BILLING',
      controlNumber: 'BI0111101001167',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "2401-2402 24TH FLR. CITYNET CNETRAL, 298-B EDSA CORNER SULTAN ST., HIGHWAY HILLS, MANDALUYONG CITY, PHILIPPINES",
      tin: '123-456-789-00000',
      clientKey: 'CL310078L00',
      project: 'CITYNET CENTRAL',
      unit: ' L  U003',
      salesStaff: 'KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'ELECTRICITY CHARGES (September 2025) (VATable)',
          qty: '1',
          unitCost: '85,213.74',
          vatAmount: '9,507.50',
          amount: '94,721.24',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '79,229.15',
          vatAmount: '9,507.50',
          vatExemptSales: '5,984.59',
          zeroRatedSales: '0.00',
          governmentTax: '0.00',
        },
        section2: {
          totalSales: '94,721.24',
          lessVAT: '9,507.50',
          netOfVAT: '85,213.74',
          addVAT: '9,507.50',
          addGovernmentTaxes: '0.00',
          lessWithholdingTax: '1,584.58',
          totalAmountDue: '93,136.66',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'BI0111101000001 - BI0111199999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Billing_Invoice_Elec_CDC_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR. RD.\nCOR. RUBY & GARNET RDS ORTIGAS CENTER\nPASIG CITY 1605",
      companyInitials: "CDC",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-527-103-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0113301000158", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "2401-2402 24TH FLR. CITYNET CNETRAL, 298-B EDSA CORNER SULTAN ST., HIGHWAY HILLS, MANDALUYONG CITY, PHILIPPINES",
      tin: "123-456-789-00000",
      clientKey: "CL310078L00",
      project: "CITYNET CENTRAL",
      unit: " L  U003",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0113301000001 - BI0113399999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Elec_CDC_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "UNIT 102 & 103 GROUND FLOOR THE PACIFIC REGENCY\n760 PABLO OCAMPO ZONE 78 BRGY 719 NCR,\nCITY OF MANILA, FIRST DISTRICT MALATE 1004",
      companyInitials: "CDC",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-527-103-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0114401001569", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "2401-2402 24TH FLR. CITYNET CNETRAL, 298-B EDSA CORNER SULTAN ST., HIGHWAY HILLS, MANDALUYONG CITY, PHILIPPINES",
      tin: "123-456-789-00000",
      clientKey: "CL310078L00",
      project: "CITYNET CENTRAL",
      unit: " L  U003",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0114401000001 - BI0114499999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Elec_CDC_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND DEVELOPMENT CORPORATION",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CDC",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-527-103-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[0].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[0].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0115501000701", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "2401-2402 24TH FLR. CITYNET CNETRAL, 298-B EDSA CORNER SULTAN ST., HIGHWAY HILLS, MANDALUYONG CITY, PHILIPPINES",
      tin: "123-456-789-00000",
      clientKey: "CL310078L00",
      project: "CITYNET CENTRAL",
      unit: " L  U003",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CDC_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0115501000001 - BI0115599999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  const InvoicePDF_Billing_Invoice_Elec_CI_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITYLAND, INC.",
      companyAddress: "3/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA STREET\nBEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CI',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-662-829-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'BILLING',
      controlNumber: 'BI0211101001017',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "MORNING VIEW SUBD. LOT 3 BLK. 3, BARANGAY PUTING KAHOY, SILANG CAVITE",
      tin: '123-456-789-00000',
      clientKey: 'CL210022L00',
      project: 'TAGAYTAY COMMERCIAL COMPLEX',
      unit: ' L  U001',
      salesStaff: 'KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'ELECTRICITY CHARGES (September 2025) (VATable)',
          qty: '1',
          unitCost: '7,135.44',
          vatAmount: '794.21',
          amount: '7,929.65',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '6,618.38',
          vatAmount: '794.21',
          vatExemptSales: '517.06',
          zeroRatedSales: '0.00',
          governmentTax: '0.00',
        },
        section2: {
          totalSales: '7,929.65',
          lessVAT: '794.21',
          netOfVAT: '7,135.44',
          addVAT: '794.21',
          addGovernmentTaxes: '0.00',
          lessWithholdingTax: '132.37',
          totalAmountDue: '7,797.28',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'BI0211101000001 - BI0211199999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Billing_Invoice_Elec_CI_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR\nROAD CORNER RUBY AND GARNET ROADS ORTIGAS\nCENTER PASIG CITY 1605",
      companyInitials: "CI",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-662-829-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0213301000188", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "MORNING VIEW SUBD. LOT 3 BLK. 3, BARANGAY PUTING KAHOY, SILANG CAVITE",
      tin: "123-456-789-00000",
      clientKey: "CL210022L00",
      project: "TAGAYTAY COMMERCIAL COMPLEX",
      unit: " L  U001",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0213301000001 - BI0113399999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Elec_CI_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "UNIT 102 & 103 GROUND FLOOR THE PACIFIC REGENCY\n760 PABLO OCAMPO STREET BARANGAY 719, MALATE NCR,\nCITY OF MANILA, FIRST DISTRICT PHILIPPINES 1004",
      companyInitials: "CI",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-662-829-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0214401000139", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "MORNING VIEW SUBD. LOT 3 BLK. 3, BARANGAY PUTING KAHOY, SILANG CAVITE",
      tin: "123-456-789-00000",
      clientKey: "CL210022L00",
      project: "TAGAYTAY COMMERCIAL COMPLEX",
      unit: " L  U001",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0214401000001 - BI0214499999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Elec_CI_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITYLAND, INC.",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CI",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-662-829-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[1].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[1].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI0215501001170", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "MORNING VIEW SUBD. LOT 3 BLK. 3, BARANGAY PUTING KAHOY, SILANG CAVITE",
      tin: "123-456-789-00000",
      clientKey: "CL210022L00",
      project: "TAGAYTAY COMMERCIAL COMPLEX",
      unit: " L  U001",
      salesStaff: "KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI0215501000001 - BI0215599999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  const InvoicePDF_Billing_Invoice_Elec_CLDI_Makati: InvoicePDF = {
    header: {
      systemName: 'CGC ACCOUNTING SYSTEM VERSION 2.0',

      runDateAndTime: '10/01/2025 10:16:01',
      runUsername: 'CDJANE',

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "3F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V DELA COSTA BEL-AIR 1209\nCITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES",
      companyInitials: 'CI',
      companyTelephone: '8893-6060',
      companyRegisteredTIN: '000-444-840-00000',

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: 'BILLING',
      controlNumber: 'BI1211101001176',
      dateValue: '10/01/2025',

      name: "ABC TRADING CORPORATION",
      address: "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: '123-456-789-00000',
      clientKey: 'C5311707L00',
      project: 'GRAND EMERALD TOWER',
      unit: ' L  PL10B1',
      salesStaff: 'KRN/KIM',
    },
    body: {
      billings: [
        {
          itemDescription: 'ELECTRICITY CHARGES (September 2025) (VATable)',
          qty: '1',
          unitCost: '9,396.59',
          vatAmount: '1,047.28',
          amount: '10,443.87',
        },
      ],
      breakdowns: {
        section1: {
          vatableSales: '8,727.32',
          vatAmount: '1,047.28',
          vatExemptSales: '669.27',
          zeroRatedSales: '0.00',
          governmentTax: '0.00',
        },
        section2: {
          totalSales: '10,443.87',
          lessVAT: '1,047.28',
          netOfVAT: '9,396.59',
          addVAT: '1,047.28',
          addGovernmentTaxes: '0.00',
          lessWithholdingTax: '174.55',
          totalAmountDue: '10,269.32',
        },
      }
    },
    footer: {
      acknowledgementCertificateNumber: 'Acknowledgement Certificate Number : xxxxxxxxxxxxxxx',
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: 'BI1211101000001 - BI1211199999999',
    },
    authorizedSignature: 'JANE DELA CRUZ',
    reprinting: {
      isReprint: false,
      reprintBy: '',
      reprintDateTime: '',
    }
  }

  const InvoicePDF_Billing_Invoice_Elec_CLDI_Ortigas: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "UNIT 105 GRAND EMERALD TOWER #6F ORTIGAS JR. RD\nCOR. RUBY & GARNET RDS. ORTIGAS CTR. PASIG CITY\n1605",
      companyInitials: "CI",
      companyTelephone: "8687-3333",
      companyRegisteredTIN: "000-444-840-00002",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI1213301000112", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "KRN/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI1213301000001 - BI1213399999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Elec_CLDI_VitoCruz: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "UNIT 102 & 103 GRD FLR, THE PACIFIC REGENCY 760\nPABLO OCAMPO ST ZONE 78 BARANGAY 719, MALATE NCR,\nCITY OF MANILA, FIRST DISTRICT PHILIPPINES 1004",
      companyInitials: "CI",
      companyTelephone: "8567-3333",
      companyRegisteredTIN: "000-444-840-00003",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI1214401000190", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "KRN/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber: "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI1214401000001 - BI1214499999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };

  const InvoicePDF_Billing_Invoice_Elec_CLDI_Manila: InvoicePDF = {
    header: {
      systemName: "CGC ACCOUNTING SYSTEM VERSION 2.0",

      runDateAndTime: "10/01/2025 10:16:01",
      runUsername: "CDJANE",

      companyName: "CITY & LAND DEVELOPERS, INCORPORATED",
      companyAddress: "581 QUINTIN PAREDES ST., ZONE 027 BARANGAY 289 NCR,\nCITY OF MANILA, FIRST DISTRICT BINONDO 1006",
      companyInitials: "CI",
      companyTelephone: "8242-1212",
      companyRegisteredTIN: "000-444-840-00001",

      companyLogo: companyHeaderStore.COMPANY_LOGOS[2].IMG_URL,
      companyLogoWidth: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.WIDTH,
      companyLogoHeight: companyHeaderStore.COMPANY_LOGOS[2].IMG_SIZE_INCH.HEIGHT,

      invoiceTypeName: "BILLING",
      controlNumber: "BI1215501000117", // NEW CONTROL NUMBER
      dateValue: "10/01/2025",

      name: "ABC TRADING CORPORATION",
      address:
        "9K TOWER 2, DANSALAN GARDENS, 347 M VICENTE ST., BRGY. MALAMIG, MANDALUYONG",
      tin: "123-456-789-00000",
      clientKey: "C5311707L00",
      project: "GRAND EMERALD TOWER",
      unit: " L  PL10B1",
      salesStaff: "KRN/KIM",
    },
    body: { ...InvoicePDF_Billing_Invoice_Elec_CLDI_Makati.body },
    footer: {
      acknowledgementCertificateNumber:
        "Acknowledgement Certificate Number : xxxxxxxxxxxxxxx",
      dateIssued: "Date Issued : MM/DD/YYYY",
      approvedSeriesRange: "BI1215501000001 - BI1215599999999",
    },
    authorizedSignature: "JANE DELA CRUZ",
    reprinting: { isReprint: false, reprintBy: "", reprintDateTime: "" },
  };


  return {
  }
})