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
  PBL_KEY:          string
  TCLTNO:           number
  CLIENT_KEY_RAW?:  string
  COMPCD:           number

  BILLINGS:         LeaseBill[]

  HEADER: {
    img_url:        string,
    company_name:   string,
    address:        string,
    tel_no:         string,
    tin:            string,

    invoice_name:   string,
    invoice_number: string,
    invoice_date:   string,
  },

  DESC: {
    client_name:    string,
    address:        string,
    tin:            string,
    client_key:     string,
    project:        string,
    unit:           string,
  },

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

  SIGNATORY: {
    user_id:        string,
  },

  FOOTER: {
    certificate_no: string,
    date_issued:    string,
    series_range:   string,
    timestamp:      string,
  }
}