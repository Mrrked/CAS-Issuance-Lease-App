import { JwtPayload } from "jwt-decode"

export interface StringValueName {
  value: string,
  name: string
}

export interface IntValueName {
  value: number
  name: string
}

export interface ProjectRecord {
  PROJCD: string
  PTITLE: string
  PJINIT: string
  PCSTIR: number
  PENRAT: number
  DPCODE: number
  TERM: number
  TERM1: number
  TERM2: number
  TERM3: number
  TERM4: number
  TERM5: number
  TERM6: number
  INTRTE: number
  BASEP: number
  CATGRY: string
  PCLTNO: number
}

export interface CompanyRecord {
  COMPCD: number;   // COMPANY CODE
  CONAME: string;   // COMPANY NAME - LA
  COMIDD: string;   // COMPANY NAME - MA
  COINIT: string;   // COMPANY INITIALS
  TIN: string;      // TAX ACCT. NO.
  RCNO: string;     // RCNO
  PLACE: string;    // PLACE
  DATRES: number;   // DATE RESERVED
}

export interface MotherBillTypeRecord {
  BTYPE: number;         // BILL TYPE, Zoned(2,0)
  MBTYPE: number;        // MOTHER BILL TYPE, Zoned(2,0)
  MBDESC: string;        // MOTHER BILL TYPE DESCRIPTION, Char(30)
  FILL1: number;         // AMT FILL1, Packed(11,2)
  FILL2: number;         // AMT FILL2, Packed(11,2)
  FILL3: number;         // AMT FILL3, Packed(11,2)
  FILL4: string;         // TAG FILL4, Char(1)
  FILL5: string;         // CHAR FILL4, Char(5)
}

export interface BillTypeRecord {
  BTYPE: number;         // BILL TYPE, Zoned(2,0)
  BDESC: string;         // BILL TYPE DESCRIPTION, Char(30)
  ORDER: number;         // ORDER OF APPLICATION, Zoned(2,0)
  PENRAT: number;        // PENALTY RATE, Zoned(5,2)
  INTRAT: number;        // INTEREST RATE, Zoned(5,2)
  ORTYPE: string;        // RECEIPT TYPE, Char(1)
  FIXPEN: string;        // FIXED PENALTY?, Char(1)
  WTHPEN: string;        // WITH PENALTY?, Char(1)
  MOTACT: number;        // MOTHER ACCOUNT, Zoned(4,0)
  PRJACT: string;        // PROJECT CODE ACCOUNT, Char(3)
  DEPACT: number;        // DEPT. CODE ACCOUNT, Zoned(2,0)
  GENACT: number;        // GENERAL CODE ACCOUNT, Zoned(3,0)
  SUBACT: number;        // SUB-CODE ACCOUNT, Zoned(2,0)
  FILL1: number;         // AMT FILL1, Packed(11,2)
  FILL2: number;         // AMT FILL2, Packed(11,2)
  FILL3: number;         // AMT FILL3, Packed(11,2)
  FILL4: string;         // TAG FILL4, Char(1)
  FILL5: string;         // CHAR FILL4, Char(5)
}

export interface PerBatchRunForm {
  invoiceDate: Date
}

export interface PerBillTypeRunForm {
  invoiceDate: Date
  projectCode?: StringValueName
  billType?:    StringValueName

  PBL?: {
    pcs_code: string
    phase: string
    block: {
      1: string
      2: string
    }
    lot: {
      1: string
      2: string
      3: string
      4: string
    }
    unit_code: {
      1: string
      2: string
    }
  }
}


export interface ExtendedJWTPayload extends JwtPayload {
  username: string
  department: string
  company_code: [number]
}

export interface Column {
  field: string,
  header: string,
}

export interface BillTypeRecord {
  BTYPE: number;         // BILL TYPE, Zoned(2,0)
  BDESC: string;         // BILL TYPE DESCRIPTION, Char(30)
  ORDER: number;         // ORDER OF APPLICATION, Zoned(2,0)
  PENRAT: number;        // PENALTY RATE, Zoned(5,2)
  INTRAT: number;        // INTEREST RATE, Zoned(5,2)
  ORTYPE: string;        // RECEIPT TYPE, Char(1)
  FIXPEN: string;        // FIXED PENALTY?, Char(1)
  WTHPEN: string;        // WITH PENALTY?, Char(1)
  MOTACT: number;        // MOTHER ACCOUNT, Zoned(4,0)
  PRJACT: string;        // PROJECT CODE ACCOUNT, Char(3)
  DEPACT: number;        // DEPT. CODE ACCOUNT, Zoned(2,0)
  GENACT: number;        // GENERAL CODE ACCOUNT, Zoned(3,0)
  SUBACT: number;        // SUB-CODE ACCOUNT, Zoned(2,0)
  FILL1: number;         // AMT FILL1, Packed(11,2)
  FILL2: number;         // AMT FILL2, Packed(11,2)
  FILL3: number;         // AMT FILL3, Packed(11,2)
  FILL4: string;         // TAG FILL4, Char(1)
  FILL5: string;         // CHAR FILL4, Char(5)
}

export interface OutstandingBill {
  PROJCD: string;      // PROJECT CODE, Char(3)
  PCSCOD: string;      // PCS CODE, Char(1)
  PHASE: string;       // PHASE, Char(1)
  BLOCK: string;       // BLOCK, Char(2)
  LOT: string;         // LOT/UNIT, Char(4)
  UNITCD: string;      // UNIT CODE, Char(2)
  TCLTNO: number;      // TEMPORARY CLIENT NUMBER, Zoned(7,0)
  BRANCH: number;      // BRANCH CODE, Zoned(1,0)
  CLTNUM: number;      // CLIENT KEY, Zoned(4,0)
  PDSCOD: string;      // PARK, DRY, STORE CODE, Char(1)
  PDSNUM: number;      // PARK, DRY, STORE NUMBER, Zoned(2,0)
  YY: number;          // YEAR, Zoned(4,0)
  MM: number;          // MONTH, Zoned(2,0)
  PAYTYP: string;      // PAYMENT TYPE, Char(1)
  BTYPE: number;       // BILL TYPE, Zoned(2,0)
  BILAMT: number;      // BILL AMOUNT, Packed(11,2)
  BALAMT: number;      // BALANCE AMOUNT, Packed(11,2)
  AMTPD: number;       // AMOUNT PAID, Packed(11,2)
  PRPTAX: number;      // PREPAID TAX, Packed(11,2)
  DATDUE: number;      // BILLING DUE DATE, Zoned(8,0)
  PERIOD: string;      // BILLING PERIOD IN WORDS, Char(20)
  FRBILL: number;      // BILLING PERIOD FROM DATE, Zoned(8,0)
  TOBILL: number;      // BILLING PERIOD TO DATE, Zoned(8,0)
  BALCOD: string;      // BALANCE CODE, Char(1)
  UPDCOD: string;      // UPDATE CODE, Char(1)
  RECCOD: string;      // RECORD CODE, Char(1)
  VERTAG: string;      // VERIFIED TAG, Char(1)
  USRUPD: string;      // USER NAME UPDATED, Char(10)
  DATUPD: number;      // DATE UPDATED, Zoned(8,0)
  TIMUPD: number;      // TIME UPDATED, Zoned(6,0)
}

export interface LeaseBill extends OutstandingBill, BillTypeRecord {
  INDEX: number

  ID: string
  PBL_KEY: string
  TCLTNO: number
  CLIENT_NAME: string
  CLIENT_ADDRESS: string
  CLIENT_TIN: string
  CLIENT_KEY: string
  CLIENT_KEY_RAW: string
  CLIENT_PROJECT_CODE: string
  CLIENT_UNIT: string
  COMPCD: number

  IS_ALREADY_VERIFIED: boolean

  IS_VATABLE: string
  VAT_RATE: number
  WHTAX_RATE: number
  SALTYP: string

  YYYYMM: string
  BILL_TYPE: number
  OLD_BILL_TYPE: number
  OLD_BILL_TYPE_DESC: string

  UNIT_COST: number
  AMOUNT: number

  VAT_SALES: number
  VAT_EXEMPT: number
  ZERO_RATE: number

  // ADD
  GOVT_TAX: number
  VAT: number

  // LESS
  WITHHOLDING_TAX: number

  TOTAL_AMOUNT: number
}

export interface InvoiceRecord {

  // COMPUTE VALUES DURING LOADING [FRONTEND]
  PBL_KEY:          string
  TCLTNO:           number
  CLIENT_KEY_RAW?:  string
  COMPCD:           number

  BILLINGS:         LeaseBill[]


  HEADER: {
    // COMPUTE VALUES DURING LOADING [FRONTEND]
    img_url:        string,
    company_name:   string,
    address:        string,
    tel_no:         string,
    tin:            string,

    invoice_name:   string,
    invoice_number: string,       // PLACE VALUES DURING PROCESSING [BACKEND]
    invoice_date:   string,
  },

  // COMPUTE VALUES DURING LOADING [FRONTEND]
  DESC: {
    client_name:    string,
    address:        string,
    tin:            string,
    client_key:     string,
    project:        string,
    unit:           string,
  },

  // COMPUTE VALUES DURING LOADING [FRONTEND]
  TABLE_ITEM_BREAKDOWNS: {
    item_no:        number,
    item_name:      string,
    qty:            number,
    unit_cost:      number,
    vat_amount:     number,
    amount:         number,
  }[],

  // MODE_OF_PAYMENT: {
  //   cash:           number,
  //   check: {
  //     amount:       number,
  //     list: {
  //       no:         number,
  //       details:    string,
  //       date:       string,
  //       amount:     number,
  //     }[],
  //   },
  //   total_amount:   number,
  // },

  // PLACE VALUES DURING LOADING [FRONTEND]
  TOTAL_BREAKDOWN: {
    vatable_sales:    number,
    vat_exempt_sales: number,
    zero_rated_sales: number,
    vat_amount:       number,

    total_sales:      number,
    net_of_vat:       number,
    wht_tax:          number,
    total_amount_due: number,
  },

  // PLACE VALUES DURING PROCESSING [BACKEND]
  SIGNATORY: {
    user_id:        string,
  },

  // PLACE VALUES DURING PROCESSING [BACKEND]
  FOOTER: {
    certificate_no: string,
    date_issued:    string,
    series_range:   string,
    timestamp:      string,
  }
}

export interface InvoiceDetails {
  // KEY
  RECTYP: string; // RECEIPT TYPE         (2 chars)
  ORNUM: string;  // OFFICIAL RECEIPT #   (13 chars)

  // REFERENCE
  PAYTYP: string; // PAYMENT TYPE         (1 char)
  PIBIG: string;  // PAGIBIG CODE         (1 char)
  SLSTYP: string; // SALE TYPE            (1 char)
  DATVAL: number; // VALUE DATE           (8 zoned digits)

  // COMPANY INFO
  COMPCD: number; // COMPANY CODE         (2 zoned digits)
  TELNO: string;  // TELEPHONE #          (9 chars)
  REGTIN: string; // VAT REG TIN          (15 chars)

  // CLIENT INFO
  CLTNME: string; // CLIENT NAME          (35 chars)
  RADDR1: string; // CLIENT ADDRESS #1    (80 chars)
  RADDR2: string; // CLIENT ADDRESS #2    (80 chars)
  CLTTIN: string; // CLIENT TIN           (15 chars)
  CLTKEY: string; // CLIENT KEY           (5 chars)
  PRJNAM: string; // PROJECT NAME         (3 chars)
  UNIT: string;   // UNIT NUMBER          (4 chars)

  // FOOTER
  AUTHSG: string; // AUTHORIZED SIGNATURE (8 chars)
  DATSTP: number; // DATE STAMP           (8 zoned digits)
  TIMSTP: number; // TIME STAMP           (8 zoned digits)

  // TRACKING
  STATUS: string; // STATUS               (1 char)
  RUNDAT: number; // RUNNING DATE         (8 zoned digits)
  RUNTME: number; // RUNNING TIME         (6 zoned digits)
  RUNBY: string;  // USER                 (8 chars)

  RPDATE: number; // REPRINT DATE         (8 zoned digits)
  RPTIME: number; // REPRINT TIME         (6 zoned digits)
  REPRBY: string; // REPRINTED BY         (8 chars)
}

export interface InvoiceItemBreakdown {
  // KEY
  RECTYP: string; // RECEIPT TYPE         (2 chars)
  ORNUM: string;  // OFFICIAL RECEIPT #   (13 chars)

  // TRACKING
  ITEMNO: number; // ITEM NUMBER          (3 zoned digits)
  BILTYP: number; // BILL TYPE            (2 zoned digits)
  ITEM: string;   // ITEM/DESCRIPTION     (120 chars)
  QTY: number;    // QUANTITY             (3 zoned digits)

  // VALUES
  UNTCST: number; // UNIT COST            (13 zoned digits with 2 decimals)
  VATAMT: number; // VAT AMOUNT           (13 zoned digits with 2 decimals)
  VATSAL: number; // VAT SALES            (13 zoned digits with 2 decimals)
  VATEXM: number; // VAT EXEMPT           (13 zoned digits with 2 decimals)
  ZERSAL: number; // ZERO-RATED SALES     (13 zoned digits with 2 decimals)
  NETVAT: number; // NET OF VAT           (13 zoned digits with 2 decimals)
  WTHTAX: number; // WITHHOLDING TAX      (13 zoned digits with 2 decimals)
  GOVTAX: number; // GOVERNMENT TAX       (13 zoned digits with 2 decimals)
  WTXRAT: number; // WITHHOLDING TAX RATE (5 zoned digits with 2 decimals)
  AMTDUE: number; // TOTAL AMOUNT DUE     (13 zoned digits with 2 decimals)

  // PERIOD
  FRDATE: number; // BILLING FROM DATE    (8 zoned digits)
  TODATE: number; // BILLING TO DATE      (8 zoned digits)
  DUEDAT: number; // BILLING DUE DATE     (8 zoned digits)
}

export interface InvoiceTotalBreakdown {
  // KEY
  RECTYP: string; // RECEIPT TYPE         (2 chars)
  ORNUM:  string; // OFFICIAL RECEIPT #   (13 chars)

  BILTYP: number; // BILL TYPE            (2 zoned digits)

  // AMOUNTS
  VATSAL: number; // VAT SALES            (13 zoned digits with 2 decimals)
  VATEXM: number; // VAT EXEMPT           (13 zoned digits with 2 decimals)
  ZERSAL: number; // ZERO-RATED SALES     (13 zoned digits with 2 decimals)
  GOVTAX: number; // GOVERNMENT TAX       (13 zoned digits with 2 decimals)

  TOTSAL: number; // TOTAL SALES          (13 zoned digits with 2 decimals)
  NETVAT: number; // NET OF VAT           (13 zoned digits with 2 decimals)
  VATAMT: number; // VAT AMOUNT           (13 zoned digits with 2 decimals)
  PRDTAX: number; // PREPAID TAX          (13 zoned digits with 2 decimals)
  AMTDUE: number; // TOTAL AMOUNT DUE     (13 zoned digits with 2 decimals)
}

export interface InvoiceRecordNew {
  PBL_KEY: string
  TCLTNO: number
  CLIENT_KEY_RAW?:  string
  COMPCD:   number
  BILLINGS: LeaseBill[]

  // COMPUTED
  HEADER: {
    COMPANY_NAME:   string
    ADDRESS:        string
    LOGO_URL:       string

    INVOICE_NAME:   string
    INVOICE_NUMBER: string
    INVOICE_DATE:   string
  },

  // Main Details (Invoice and Client)
  DETAILS: InvoiceDetails

  // Item Breakdowns
  ITEM_BREAKDOWNS: InvoiceItemBreakdown[]

  // Total / Overall Breakdown
  TOTAL_BREAKDOWN: InvoiceTotalBreakdown
}

const SAMPLE: InvoiceRecordNew = {

  PBL_KEY:          'CL3 L 0000  ',
  TCLTNO:           0,
  COMPCD:           0,

  BILLINGS:         [],

  // COMPUTED
  HEADER: {
    COMPANY_NAME:   'selectedCompany.CONAME',
    ADDRESS:        'selectedCompany.ADDRESS',
    LOGO_URL:       'selectedCompany.CONAME',

    INVOICE_NAME:   'SERVICE INVOICE',
    INVOICE_NUMBER: 'VI011331A000001',
    INVOICE_DATE:   '2021/12/01',
  },

  // CIRCLTPF
  DETAILS: {
    // KEY
    RECTYP: 'VI',
    ORNUM:  '01133A 008310',

    PAYTYP: 'Y',
    PIBIG:  '',
    SLSTYP: 'V',
    DATVAL: 20231114,

    // COMPANY INFO
    COMPCD: 2,
    TELNO:  '8893-6060',
    REGTIN: '000-527-103-00000',

    // CLIENT INFO
    CLTNME: 'John Doe Industries',
    RADDR1: '123 Business Rd.',
    RADDR2: 'Suite 100',
    CLTTIN: '987654321012345',
    CLTKEY: '12345678910',
    PRJNAM: 'CITYNET CENTRAL',
    UNIT:   'L 0000',

    // FOOTER
    DATSTP: 20231114,
    TIMSTP: 143200,
    AUTHSG: 'JD123456',

    // TRACKING
    STATUS: '',
    RUNDAT: 20231114,
    RUNTME: 152500,
    RUNBY: 'USER1234',

    RPDATE: 0,
    RPTIME: 0,
    REPRBY: '',
  },
  // CIRBRKPF
  ITEM_BREAKDOWNS: [
    {
      // KEY
      RECTYP: "01",
      ORNUM: "0000123456789",

      // TRACKING
      ITEMNO: 1,
      BILTYP: 4,
      ITEM:   "RENTAL (September 1 - 30, 2001) VATable",
      QTY:    1,

      // VALUES
      UNTCST: 1500.25,
      VATAMT: 180.03,
      VATSAL: 1200.10,
      VATEXM: 0.00,
      ZERSAL: 0.00,
      NETVAT: 1020.07,
      WTHTAX: 50.00,
      GOVTAX: 25.00,
      WTXRAT: 2.50,
      AMTDUE: 1775.35,

      // PERIOD
      FRDATE: 20240101,
      TODATE: 20240131,
      DUEDAT: 20240215
    }
  ],
  // CIRVATPF
  TOTAL_BREAKDOWN: {
    // KEY
    RECTYP: "01",
    ORNUM:  "0000123456789",

    BILTYP: 0,

    // VALUES
    VATSAL: 1200.10,
    VATEXM: 0.00,
    ZERSAL: 0.00,
    GOVTAX: 25.00,

    TOTSAL: 1380.13,
    NETVAT: 1020.07,
    VATAMT: 180.03,
    PRDTAX: 50.00,
    AMTDUE: 1475.20
  }
}