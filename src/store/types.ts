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
  CLIENT_PIBIG: string
  COMPCD: number
  BRANCH: number

  ACNUM: string
  ACDAT: string

  INVOICE_KEY: InvoiceKey

  IS_ALREADY_VERIFIED: boolean

  IS_VATABLE: string
  VAT_RATE: number
  WHTAX_RATE: number
  SALTYP: string

  YYYYMM: string
  BILL_TYPE: number
  MBTYPE: number
  OLD_BILL_TYPE: number
  OLD_BILL_TYPE_DESC: string

  UNIT_COST: number
  AMOUNT: number

  VAT_SALES: number
  VAT_EXEMPT: number
  ZERO_RATE: number

  TOTAL_SALE: number

  // ADD
  GOVT_TAX: number
  VAT: number

  // LESS
  WITHHOLDING_TAX: number

  TOTAL_AMOUNT: number
}

export interface InvoiceKey {
  RECTYP:   'VI' | 'BI'
  TRNTYP:   'V' | 'B'

  PROJCD:   string

  COMPLETE_OR_KEY: string
  COMPCD:   number
  BRANCH:   number
  DEPTCD:   number
  ORCOD:    string
  ORNUM:    number

  YY: string
  MM: string

  INVOICE_NAME:   string
  INVOICE_NUMBER: string

  SERIES_RANGE:   string
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
  PRJNAM: string; // PROJECT NAME         (50 chars)
  PBLKEY: string; // PROJECT/BLOCK/LOT KEY(13 chars)

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

export interface InvoiceRecord {
  PBL_KEY: string
  TCLTNO: number
  CLIENT_KEY_RAW?: string

  BILLINGS: LeaseBill[]

  // COMPUTED
  HEADER: {
    COMPANY_NAME:   string
    ADDRESS:        string
    LOGO_URL:       string
    LOGO_SIZE_INCH: {
      WIDTH:        number
      HEIGHT:       number
    }
  },

  FOOTER: {
    ACNUM: string
    ACDAT: string
  }

  INVOICE_KEY: InvoiceKey

  // Main Details (Invoice and Client)
  DETAILS: InvoiceDetails

  // Item Breakdowns
  ITEM_BREAKDOWNS: InvoiceItemBreakdown[]

  // Total / Overall Breakdown
  TOTAL_BREAKDOWN: InvoiceTotalBreakdown

  // CASH OR FILES
  CORFPF: CORFPF
  CORTPF: CORTPF
  CORF3PF: CORF3PF
  CORF4PF: CORF4PF

}

export interface INVOICE_PER_PROJECT {
  PROJCD: string
  PROJECT_NAME: string
  INVOICE_RECORDS: InvoiceRecord[]
}

export interface GROUPED_INVOICE_RECORD {
  COMPCD: number
  BRANCH: number
  DEPTCD: number

  INVOICE_RECORDS: InvoiceRecord[]
  INVOICE_RECORDS_PER_PROJECT: INVOICE_PER_PROJECT[]
}



interface CORFPF {
  COMPCD: number; // COMPANY CODE (ZONED 2, 0)
  BRANCH: number; // BRANCH CODE (ZONED 1, 0)
  DEPTCD: number; // DEPARTMENT CODE (ZONED 2, 0)
  ORCOD: string; // O.R. CODE (CHAR 2)
  ORNUM: number; // O.R. NUMBER (ZONED 6, 0)
  DATOR: number; // O.R. DATE (ZONED 8, 0)
  CASHCD: string; // USER ID CODE (CHAR 10)
  COLSTF: string; // COLLECTION STAFF (CHAR 4)
  ORAMT: number; // OR AMOUNT (PACKED 11, 2)
  NOACCT: number; // NO. OF ACCOUNTS (ZONED 3, 0)
  PAYTYP: string; // PAYMENT TYPE (CHAR 1)
  INTRST: number; // INTEREST (PACKED 11, 2)
  PNALTY: number; // PENALTY (PACKED 9, 2)
  OTHERS: number; // OTHER AMOUNT (PACKED 11, 2)
  OVRPAY: number; // OVER PAYMENT (PACKED 9, 2)
  UNDPAY: number; // UNDER PAYMENT (PACKED 9, 2)
  PROJCD: string; // PROJECT CODE (CHAR 3)
  PCSCOD: string; // PCS CODE (CHAR 1)
  PHASE: string; // PHASE (CHAR 1)
  BLOCK: string; // BLOCK (CHAR 2)
  LOT: string; // LOT/UNIT (CHAR 4)
  UNITCD: string; // UNIT CODE (CHAR 2)
  PAYCOD: string; // PAYEE CODE (CHAR 4)
  PAYEE: string; // NAME OF PAYEE (CHAR 35)
  PN: number; // PROMISSORY NOTE # (ZONED 5, 0)
  DATVAL: number; // VALUE DATE (ZONED 8, 0)
  DATPRT: number; // PRINTING DATE (ZONED 8, 0)
  BANKCD: string; // BANK CODE (CHAR 5)
  BNKACT: string; // BANK ACCT. NO. (CHAR 1)
  NOCHK: number; // NO. OF CHECKS (ZONED 2, 0)
  PRNO: number; // PR NO. (ZONED 6, 0)
  CSHAMT: number; // CASH AMOUNT (PACKED 11, 2)
  TCHKAM: number; // TOTAL CHECK AMOUNT (PACKED 11, 2)
  LEAFNO: number; // LEAFLET NUMBER (ZONED 6, 0)
  NORMRK: number; // NO. OF REMARKS (ZONED 2, 0)
  DATCAN: number; // DATE CANCELLED (ZONED 8, 0)
  RETCOD: string; // RETURN CHECK CODE (CHAR 1)
  UPDCOD: string; // UPDATE CODE (CHAR 1)
  NOMOS: number; // NO. OF MONTHS (ZONED 3, 0)
  TRANSN: number; // TRANSACTION NO. (ZONED 4, 0)
  DELOR: string; // DELOR (CHAR 1)
}


interface CORTPF {
  COMPCD: number;  // COMPANY CODE
  BRANCH: number;  // BRANCH CODE
  DEPTCD: number;  // DEPARTMENT CODE
  ORCOD: string;   // O. R. CODE
  ORNUM: number;   // O. R. NUMBER
  DATVAL: number;  // VALUE DATE
  PROJCD: string;  // PROJECT CODE
  PCSCOD: string;  // PCS CODE
  PHASE: string;   // PHASE
  BLOCK: string;   // BLOCK
  LOT: string;     // LOT/UNIT
  UNITCD: string;  // UNIT CODE
  PAYTYP: string;  // PAYMENT TYPE
  CLTNUM: number;  // CLIENT NUMBER
  PDSCOD: string;  // PARK, DRY, STORE CODE
  PDSNUM: number;  // PARK, DRY, STORE NUMBER
  TCLTNO: number;  // TEMPORARY CLIENT NUMBER
  DATINS: number;  // INSTALLMENT DATE
  BALRUN: number;  // RUNNING BALANCE
  PAYNO: number;   // PAYMENT NUMBER
  NOMOS: number;   // NO. OF MONTHS
}


interface CORF3PF {
  COMPCD: number;    // COMPANY CODE
  BRANCH: number;    // BRANCH CODE
  DEPTCD: number;    // DEPARTMENT CODE
  ORCOD: string;     // O. R. CODE
  ORNUM: number;     // O. R. NUMBER
  DATVAL: number;    // VALUE DATE
  PROJCD: string;    // PROJECT CODE
  PCSCOD: string;    // PCS CODE
  PHASE: string;     // PHASE
  BLOCK: string;     // BLOCK
  LOT: string;       // LOT/UNIT
  UNITCD: string;    // UNIT CODE
  PAYTYP: string;    // PAYMENT TYPE
  ORAMT: number;     // OR AMOUNT
  VATAMT: number;    // VAT AMOUNT
  RATIO: number;     // RATIO OF ZV/NET SP
  ZONVAL: number;    // ZONAL VALUE USED
  NETSP: number;     // NET SELLING PRICE USED
  PRPTAX: number;    // PREPAID TAX OF LEASE CLIENTS
  VATCOD: string;    // VAT/NON VAT CODE
  VATDES: string;    // VAT DESCRIPTION
  DATENT: number;    // DATE ENTERED
  TIMENT: number;    // TIME ENTERED
  USRENT: string;    // USER NAME
}

interface CORF4PF {
  COMPCD: number; // COMPANY CODE
  BRANCH: number; // BRANCH CODE
  DEPTCD: number; // DEPARTMENT CODE
  ORCOD: string;  // O. R. CODE
  ORNUM: number;  // O. R. NUMBER
  DATVAL: number; // VALUE DATE
  PROJCD: string; // PROJECT CODE
  PCSCOD: string; // PCS CODE
  PHASE: string;  // PHASE
  BLOCK: string;  // BLOCK
  LOT: string;    // LOT/UNIT
  UNITCD: string; // UNIT CODE
  PAYTYP: string; // PAYMENT TYPE
  BTYPE: number;  // BILL TYPE
  MBTYPE: number; // MOTHER BILL TYPE
  LESDES: string; // LEASE DESCRIPTION
  ORAMT: number;  // OR AMOUNT
  VATSAL: number; // VATABLE SALES
  VATXMP: number; // VAT-EXEMPT SALES
  VATZRO: number; // ZERO RATED SALES
  TOTSAL: number; // TOTAL SALES
  VATAMT: number; // VAT AMOUNT
  WITTAX: number; // WITHHOLDING TAX
  GRSAMT: number; // GROSS AMOUNT
  ENTDES: string; // ACK.REC-ENTRY DESCRIPTION
  ENTAMT: number; // ACK.REC.-ENTRY AMOUNT
  LESRF: number;  // LESS: RES. FEE
  ORTYPE: string; // OR TYPE
  DATENT: number; // DATE ENTERED
  TIMENT: number; // TIME ENTERED
  USRENT: string; // USER NAME
}
