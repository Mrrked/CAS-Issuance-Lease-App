import { AxiosError } from "axios"
import { JwtPayload } from "jwt-decode"

export interface ExtendedAxiosError extends AxiosError {
  expiredToken: boolean
}

export interface ExtendedJWTPayload extends JwtPayload {
  username: string
}

export interface ExtFile extends File {
  objectURL?: string
}

export interface FileAttachment {
  name: string
  type: string
  size: number

  category: 'User' | 'Admin'
  added_by: number | string
  timestamp: Date | string

  file?: ExtFile
  url?: string
}

// EXTERNAL

export interface ExternalJoinProgram {
  id: number
  name: string;
  description: string;
  url: string;
}

export interface ExternalJoinISeriesProfile {
  id: number;
  username: string;
  initials: string;
}

export interface ExternalISeriesProfile {
  id: number;
  username: string;
  initials: string;

  user: ExternalITPortalUser;

  programs: ExternalJoinProgram[]
}

export type ExternalITPortalUserStatus = 'Enabled' | 'Disabled' | 'Archived'

export interface ExternalITPortalDepartment {
  id: number;
  name: string;
}

export interface ExternalITPortalUser {
  id: number;
  username: string;
  full_name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  nickname: string;
  department: string;
  departments: ExternalITPortalDepartment[];
  email: string;
  supervisor: ExternalITPortalUser;
  is_department_head: boolean;
  status: ExternalITPortalUserStatus;
  iseries_profiles: ExternalISeriesProfile[]
}

export interface User extends ExternalISeriesProfile {}

////////////
//  MAIN  //
////////////

export type InquiryType = 'Unit' | 'Client Name'
export type PerBillTypeOption = 'Rental and CUSA' | 'Electricity and Generator Set' | 'Water'
export type PerBatchTypeOption = 'Rental and CUSA' |
  'Rental Only' |
  'CUSA Only'   |
  'Penalty on Rental Only' |
  'Penalty on CUSA Only'

export type ForBillingGroupOptionLabel =
  '(A) Electricity and Generator Set' |
  '(B) Water' |
  '(C) Rental and CUSA' |
  '(D) Rental Only' |
  '(E) CUSA Only'   |
  '(F) Penalty on Rental Only' |
  '(G) Penalty on CUSA Only'

export type ForRecordingGroupOptionLabel =
  '(A) Electricity and Generator Set' |
  '(B) Water' |
  '(C) Rental and CUSA' |
  '(D) Rental Only' |
  '(E) CUSA Only'   |
  '(F) Penalty on Rental Only' |
  '(G) Penalty on CUSA Only'

export type ForBillingGroupOption = {
  value: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G',
  name: ForBillingGroupOptionLabel
  billTypes: number[]
}

export type ForRecordingGroupOption = {
  value: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G',
  name: ForRecordingGroupOptionLabel
  billTypes: number[]
}

export interface PerBillTypeRunForm {
  invoiceDate: Date
  billType:    'A' | 'B' | 'C'

  projectCode: ProjectRecord | null
  PBL: {
    pcs_code: {
      1: string
    }
    phase: {
      1: string
    }
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

export interface PerBatchRunForm {
  invoiceDate: Date
  billType:    'A' | 'B' | 'C' | 'D' | 'E'

  projectCode: ProjectRecord | null
  PBL: {
    pcs_code: {
      1: string
    }
    phase: {
      1: string
    }
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

export interface ForBillingGroupForm {
  invoiceDate: Date
  billType:    ForBillingGroupOption

  projectCode: ProjectRecord | null
  PBL: {
    pcs_code: {
      1: string
    }
    phase: {
      1: string
    }
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

export interface ForRecordingGroupForm {
  invoiceDate: Date
  billType:    ForRecordingGroupOption

  company: CompanyRecord | null
  projectCode: ProjectRecord | null
  PBL: {
    pcs_code: {
      1: string
    }
    phase: {
      1: string
    }
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

export interface PerVerificationRunForm {
  invoiceDate: Date
}

export interface UnitForm {
  project_code: ProjectRecord | null
  pcs_code: {
    1: string
  }
  phase: {
    1: string
  }
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

export interface ClientForm {
  name: string
}

//////////////
//  MODELS  //
//////////////

export interface BusinessDay {
  MONTH: number
  YEAR: number
  EARLIEST_CWORK_DATE: number
}

export interface PaymentType {
  initial: string;
  name: string;
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

export interface MotherLeaseBillTypeRecord {
  BTYPE: number;         // BILL TYPE, Zoned(2,0)
  MBTYPE: number;        // MOTHER BILL TYPE, Zoned(2,0)
  MBDESC: string;        // MOTHER BILL TYPE DESCRIPTION, Char(30)
  FILL1: number;         // AMT FILL1, Packed(11,2)
  FILL2: number;         // AMT FILL2, Packed(11,2)
  FILL3: number;         // AMT FILL3, Packed(11,2)
  FILL4: string;         // TAG FILL4, Char(1)
  FILL5: string;         // CHAR FILL4, Char(5)
}

export interface LeaseBillTypeRecord {
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

export interface LeaseBillTypeRecord {
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

export interface Client {
  CACCT: number
  CLIENT_NAME: string
  BIRTH: number
  TAN1: string
  TYPE: null | string

  LNAME: string
  FNAME: string
  MI: string
}

export interface Unit {
  PROJCD: string
  PCSCOD: string
  PHASE: string
  BLOCK: string
  LOT: string
  UNITCD: string
  CLTNUM: number
  PDSCOD: string
  PDSNUM: number
  TCLTNO: number
  CACCT: number
  CLTYPE: string
  NAT2: string
  STAT1: string
  STAT2: string
  STAFF1: string
  STAFF2: string
  BROKER: string
  DATDP: number
  DATDCR: number
  DPTAGE: number
  APPCOD: string
  DATAPP: number
  PCSTRC: number
  COSTCD: string
  BRANCH: number
  CONFI: string
  ADDCDE: string
  COMREQ: string
  COMMON: number
  BROCOM: number
  CONTES: string
  DATCON: number
  PIBIG: string
  RETCOD: string
  BSPCOD: string
  DATOCC: number
  DATINS: number
  COMPCD: number
  BDAYCD: string
  DATCOM: number
  HLTYPE: string
}

export interface GenHeader {
  PROJCD: string;    // PROJECT CODE
  BRANCH: number;    // BRANCH CODE
  CLTNUM: number;    // CLIENT KEY
  PDSCOD: string;    // PARK, DRY, STORE CODE
  PDSNUM: number;    // PARK, DRY, STORE NUMBER
  CACCT: number;     // CLIENT ACCOUNT NUMBER
  TERM: number;      // TERM
  MODE: number;      // PAYMENT MODE
  INSTNO: number;    // INSTALLMENT NUMBER
  TPRICE: number;    // TERM PRICE
  DOWNP: number;     // DOWNPAYMENT
  AMORT: number;     // AMORTIZATION
  SECMA: number;     // SECOND M.A.
  PNALTY: number;    // PENALTY
  DATFMA: number;    // FIRST MA DATE
  DATLMA: number;    // LAST MA DATE
  DUEDAY: number;    // DUE DAY
  ASSIGN: string;    // ASSIGN CODE
  DATASS: number;    // ASSIGN DATE
  DATINS: number;    // INSTALLMENT DATE
  SA: number;        // SA NUMBER
  INRTIR: number;    // INTEREST RATE - IR
  GPRATE: number;    // GP RATE
  SCHEDB: number;    // SCHEDULE BALANCE
  ACTBAL: number;    // ACTUAL BALANCE
  RUNBAL: number;    // RUNNING BALANCE
  YTDRGP: number;    // YEAR-TO-DATE RGP
  RGP: number;       // REALIZED GROSS PROFIT
  UGP: number;       // UNREALIZED GROSS PROFIT
  NOOFOR: number;    // NO. OF OR'S
  MMYY: number;      // MONTH/YEAR
  ACTDPY: number;    // ACTUAL DP YEAR
  ACCINT: number;    // ACCUMULATED INTEREST
  CANCEL: number;    // CANCEL. MONTH OR CANCEL CODE
  METERD: number;    // METER DEPOSIT
  COMPCD: number;    // COMPANY CODE
  PIBIG: string;     // PAG-IBIG
  BNKCOD: string;    // BANK CODE
  LTERM: number;     // LONG TERM CODE
  SAPCOD: string;    // SA PRINT CODE
  DELETE: string;    // DELETE
  OVER_UNDER: number;    // COMPUTED OVER_UNDER
}

export interface LeaseHeader {
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
  SCHEDB: number;      // RENTAL SCHED. BALANCE, Packed(13,2)
  ACTBAL: number;      // RENTAL ACTUAL BALANCE, Packed(13,2)
  CUSSCH: number;      // CUSA SCHEDULE BALANCE, Packed(13,2)
  CUSACT: number;      // CUSA ACTUAL BALANCE, Packed(13,2)
  LESTYP: string;      // LEASE TYPE/BPO CODE, Char(3)
  SALTYP: string;      // SALE TYPE: VAT, NVAT, ZERO, Char(4)
  FILL1: string;       // FILLER 1, Char(10)
  FILL2: string;       // FILLER 2, Char(10)
  FILL3: number;       // FILLER 3, Zoned(10,0)
  DELETE: string;      // DELETE CODE, Char(1)
  USRUPD: string;      // USER NAME UPDATED, Char(10)
  DATUPD: number;      // DATE UPDATED, Zoned(8,0)
  TIMUPD: number;      // TIME UPDATED, Zoned(6,0)

  REGTYP: string
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

export interface LeaseBill extends OutstandingBill, LeaseBillTypeRecord {
  INDEX: number

  ID: string
  PBL_KEY: string
  CODEA: string
  CODEE: string
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

  STAFF1: string
  STAFF2: string

  ACNUM: string
  ACDAT: string

  NOTICE_NUMBER: string

  INVOICE_KEY: InvoiceKey

  IS_VATABLE: boolean
  VAT_RATE: number
  WHTAX_RATE: number
  SALTYP: string
  LTYPCD: string

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

  LOPD2PF?: LOPD2PF[]
  VERIFICATION?: VerificationOfPayment
}

export interface LedgerRemark {
  PROJCD: string;     // PROJECT CODE, Char(3)
  BRANCH: number;     // BRANCH CODE, Zoned(1,0)
  CLTNUM: number;     // CLIENT KEY, Zoned(4,0)
  PDSCOD: string;     // PARK, DRY, STORE CODE, Char(1)
  PDSNUM: number;     // PARK, DRY, STORE NUMBER, Zoned(2,0)
  LINE: number;       // REMARKS LINE NUMBER, Zoned(2,0)
  REMKS: string;      // REMARKS, Char(50)
  FILL1: string;      // FILLER 1, Char(10)
  FILL2: string;      // FILLER 2, Char(5)
  FILL3: number;      // FILLER 3, Zoned(10,0)
  FILL4: number;      // FILLER 4, Zoned(5,0)
}

export interface ORRecord {
  COMPCD: string;        // COMPANY CODE (ZONED, 2, 0)
  BRANCH: string;        // BRANCH CODE (ZONED, 1, 0)
  DEPTCD: string;        // DEPARTMENT CODE (ZONED, 2, 0)
  ORCOD: string;         // O.R. CODE (CHAR, 2)
  ORNUM: string;         // O. R. NUMBER (ZONED, 6, 0)
  DATOR: number;         // O. R. DATE (ZONED, 8, 0)
  CASHCD: string;        // USER ID CODE (CHAR, 10)
  COLSTF: string;        // COLLECTION STAFF (CHAR, 4)
  ORAMT: number;         // OR AMOUNT (PACKED, 11, 2)
  NOACCT: number;        // NO. OF ACCOUNTS (ZONED, 3, 0)
  PAYTYP: string;        // PAYMENT TYPE (CHAR, 1)
  INTRST: number;        // INTEREST (PACKED, 11, 2)
  PNALTY: number;        // PENALTY (PACKED, 9, 2)
  OTHERS: number;        // OTHER AMOUNT (PACKED, 11, 2)
  OVRPAY: number;        // OVER PAYMENT (PACKED, 9, 2)
  UNDPAY: number;        // UNDER PAYMENT (PACKED, 9, 2)
  PROJCD: string;        // PROJECT CODE (CHAR, 3)
  PCSCOD: string;        // PCS CODE (CHAR, 1)
  PHASE: string;         // PHASE (CHAR, 1)
  BLOCK: string;         // BLOCK (CHAR, 2)
  LOT: string;           // LOT/UNIT (CHAR, 4)
  UNITCD: string;        // UNIT CODE (CHAR, 2)
  PAYCOD: string;        // PAYEE CODE (CHAR, 4)
  PAYEE: string;         // NAME OF PAYEE (CHAR, 35)
  PN: number;            // PROMISSORY NOTE # (ZONED, 5, 0)
  DATVAL: number;        // VALUE DATE (ZONED, 8, 0)
  DATPRT: number;        // PRINTING DATE (ZONED, 8, 0)
  BANKCD: string;        // BANK CODE (CHAR, 5)
  BNKACT: string;        // BANK ACCT. NO. (CHAR, 1)
  NOCHK: number;         // NO. OF CHECKS (ZONED, 2, 0)
  PRNO: number;          // PR NO. (ZONED, 6, 0)
  CSHAMT: number;        // CASH AMOUNT (PACKED, 11, 2)
  TCHKAM: number;        // TOTAL CHECK AMOUNT (PACKED, 11, 2)
  LEAFNO: number;        // LEAFLET NUMBER (ZONED, 6, 0)
  NORMRK: number;        // NO. OF REMARKS (ZONED, 2, 0)
  DATCAN: number;        // DATE CANCELLED (ZONED, 8, 0)
  RETCOD: string;        // RETURN CHECK CODE (CHAR, 1)
  UPDCOD: string;        // UPDATE CODE (CHAR, 1)
  NOMOS: number;         // NO. OF MONTHS (ZONED, 3, 0)
  TRANSN: number;        // TRANSACTION NO. (ZONED, 4, 0)
  DELOR: string;         // DELOR (CHAR, 1)
}

export interface ORRecord_Temporary {
  COMPCD: string;        // COMPANY CODE (ZONED, 2, 0)
  BRANCH: string;        // BRANCH CODE (ZONED, 1, 0)
  DEPTCD: string;        // DEPARTMENT CODE (ZONED, 2, 0)
  ORCOD: string;         // O.R. CODE (CHAR, 2)
  ORNUM: string;         // O. R. NUMBER (ZONED, 6, 0)
  DATVAL: number;        // VALUE DATE (ZONED, 8, 0)
  PROJCD: string;        // PROJECT CODE (CHAR, 3)
  PCSCOD: string;        // PCS CODE (CHAR, 1)
  PHASE: string;         // PHASE (CHAR, 1)
  BLOCK: string;         // BLOCK (CHAR, 2)
  LOT: string;           // LOT/UNIT (CHAR, 4)
  UNITCD: string;        // UNIT CODE (CHAR, 2)
  PAYTYP: string;        // PAYMENT TYPE (CHAR, 1)
  CLTNUM: number;        // CLIENT NUMBER (ZONED, 4, 0)
  PDSCOD: string;        // PARK, DRY, STORE CODE (CHAR, 1)
  PDSNUM: number;        // PARK, DRY, STORE NUMBER (ZONED, 2, 0)
  TCLTNO: number;        // TEMPORARY CLIENT NUMBER (ZONED, 7, 0)
  DATINS: number;        // INSTALLMENT DATE (ZONED, 8, 0)
  BALRUN: number;        // RUNNING BALANCE (PACKED, 13, 2)
  PAYNO: number;         // PAYMENT NUMBER (ZONED, 3, 0)
  NOMOS: number;         // NO. OF MONTHS (ZONED, 3, 0)
}

export interface ORRemarks {
  COMPCD: string;        // COMPANY CODE (ZONED, 2, 0)
  BRANCH: string;        // BRANCH CODE (ZONED, 1, 0)
  DEPTCD: string;        // DEPARTMENT CODE (ZONED, 2, 0)
  ORCOD: string;         // O.R. CODE (CHAR, 2)
  ORNUM: string;         // O. R. NUMBER (ZONED, 6, 0)
  RMARK1: string;       // REMARK 1 (CHAR, 25)
  RMARK2: string;       // REMARK 2 (CHAR, 25)
  RMARK3: string;       // REMARK 3 (CHAR, 25)
  RMARK4: string;       // REMARK 4 (CHAR, 25)
}

export interface CheckDetails {
  COMPCD: string;        // COMPANY CODE (ZONED, 2, 0)
  BRANCH: string;        // BRANCH CODE (ZONED, 1, 0)
  DEPTCD: string;        // DEPARTMENT CODE (ZONED, 2, 0)
  ORCOD: string;         // O.R. CODE (CHAR, 2)
  ORNUM: string;         // O. R. NUMBER (ZONED, 6, 0)
  NOCHK: number;         // NO. OF CHECKS (ZONED, 2, 0)
  BNCODE: string;        // BANK CODE (CHAR, 5)
  BNKBR: number;         // BANK BRANCH (ZONED, 2, 0)
  CHKNUM: number;        // CHECK NUMBER (ZONED, 10, 0)
  DATCHK: number;        // CHECK DATE (ZONED, 8, 0)
  CHKAMT: number;        // CHECK AMOUNT (PACKED, 11, 2)
  BANKCD: string;        // BANK CODE (CHAR, 5)
  BNKACT: string;        // BANK ACCOUNT NO. (CHAR, 1)
  RETCOD: string;        // RETURN CHECK CODE (CHAR, 1)
  REMCOD: number;        // REMARKS CODE (ZONED, 3, 0)
  ACTION: string;        // ACTION TAKEN (CHAR, 30)
  DATREC: number;        // DATE RECEIVED (ZONED, 8, 0)
  PRNTCD: string;        // PRINT CODE (CHAR, 1)
  CASHCD: string;        // USER ID CODE (CHAR, 10)
  TIMEUP: number;        // TIME UPDATED (ZONED, 6, 0)
  DELCHK: string;        // DELETE CHECK (CHAR, 1)
}

export type VerificationType = 'VS' | 'NR'
export type Truth = 'Y' | 'N' | ''

export interface VerificationOfPayment {
  VER_KEY: string;         //
  // CLIENT_KEY: string;      //
  // CLIENT_NAME: string;     //
  // PBL_KEY: string;         //
  // IS_ISSUED: boolean;
  // STATUS: VerificationStatus;
  // ISSUED_DOCUMENTS: IssuedDocument[]


  ROWID: number;           //
  VERTYP: VerificationType // Verification Type
  COMPCD: number;          // Company Code (Zoned, 2 digits)
  VERCOD: string;          // Verification Code (Char, 2 characters)
  VERNUM: number;          // Verification Number (Zoned, 8 digits)

  PROJCD: string;          // Project Code (Char, 3 characters)
  PCSCOD: string;          // PCS Code (Char, 1 character)
  PHASE: string;           // Phase (Char, 1 character)
  BLOCK: string;           // Block (Char, 2 characters)
  LOT: string;             // Lot (Char, 4 characters)
  UNITCD: string;          // Unit Code (Char, 2 characters)
  TCLTNO: number;          // Temp. Client Number (Zoned, 7 digits)

  VATCOD: string;          // Vat Code (Char, 1 character)
  PAYTYP: string;          // Payment Type (Char, 1 character)
  PAYNUM: number;          // Payment Number (Zoned, 3 digits)
  PAYDAT: number;          // Payment Date (Zoned, 8 digits)
  NOMOS: number;           // Number of Months (Zoned, 3 digits)

  INSTNO: number;          // Installment Number (Zoned, 3 digits)
  DATINS: number;          // Installment Date (Zoned, 8 digits)
  SCHEDB: number;          // Schedule Balance (Zoned, 13.2)
  ACTBAL: number;          // Actual Balance (Zoned, 13.2)
  RUNBAL: number;          // Running Balance (Zoned, 13.2)

  INSTDP: Truth;           // Instalment DP? Y/N
  TRMTOCSH: Truth;         // Term to Cash? Y/N

  BILTYP: number;          // Bill Type (Zoned, 2 digits)
  FRBILL: number;          // Bill From-Date (Zoned, 8 digits)
  TOBILL: number;          // Bill To-Date (Zoned, 8 digits)

  PRNPAL: number;          // Principal (Zoned, 13.2)
  INTRST: number;          // Interest (Zoned, 13.2)
  PNALTY: number;          // Penalty (Zoned, 13.2)
  OTHERS: number;          // Others (Zoned, 13.2)
  GROSSRET: number;        // Gross RET (Zoned, 13.2)
  NETRET: number;          // Net RET (Zoned, 13.2)
  DISCOUNT: number;        // Discount Availed (Zoned, 13.2)
  YRQTR: string;           // Year/Quarter (Char, 1 character)
  THRESH: number;          // Threshold (Zoned, 13.2)
  ADVANCE: number;         // Advance Payment (Zoned, 13.2)
  ADVBT: number;           // Advance Payment-Bill Type (Zoned, 2 digits)
  OVRPAY: number;          // Over Payment (Zoned, 13.2)
  UNDPAY: number;          // Under Payment (Zoned, 13.2)
  PROCFEE: number;         // Processing Fee (Zoned, 13.2)
  ZERORT: number;          // Zero Rated (Zoned, 13.2)
  VATSAL: number;          // Vat Sales (Zoned, 13.2)
  VATEXM: number;          // Vat Exempt (Zoned, 13.2)
  VATAMT: number;          // Vat Amount (Zoned, 13.2)
  GOVTAX: number;          // Government Tax (Zoned, 13.2)
  PRPTAX: number;          // Prepaid Tax (Zoned, 13.2)
  TRNAMT: number;          // Transaction Amount (Zoned, 13.2)

  RMARK1: string;          // Remarks 1 (Char, 50 characters)
  RMARK2: string;          // Remarks 2 (Char, 50 characters)
  RMARK3: string;          // Remarks 3 (Char, 50 characters)
  RMARK4: string;          // Remarks 4 (Char, 50 characters)
  COLLID: string;          // Collection Staff (Char, 10 characters)

  DATVER: number;          // Verification Date (Zoned, 8 digits)
  TIMVER: number;          // Verification Time (Zoned, 6 digits)

  DOCTYP: string;          // Ref. Doc. Type (Char, 2 characters)

  DELETE: string;
  USRDEL: string;
  DATDEL: number;
  TIMDEL: number;
}

export type IssuedDocumentType = 'Sales Invoice' | 'Service Invoice' | 'Billing Invoice' | 'Collection Receipt' | 'Acknowledgement Receipt' | 'Old Official Receipt'
export type HistoryOfPaymentStatus = 'VALID' | 'DELETED' | 'CANCELLED' | 'RETURNED'
export interface HistoryOfPayment extends ORRecord, ORRecord_Temporary {
  OR_KEY: string;
  OR_KEY_RAW: string;
  PBL_KEY: string;
  PBL_KEY_RAW: string;

  STATUS: HistoryOfPaymentStatus;
  DOCUMENT_TYPE: IssuedDocumentType

  recordRemarks: ORRemarks | null;
  recordChecks: CheckDetails[];
}


export interface InvoiceKey {
  RECTYP:   'IS' | 'BI'
  TRNTYP:   'I' | 'B'

  PROJCD:   string

  COMPLETE_OR_KEY: string
  COMPCD:   number
  BRANCH:   number
  DEPTCD:   number
  ORCOD:    string
  ORNUM:    number

  YY: number
  MM: number

  INVOICE_NAME:   string
  INVOICE_NUMBER: string

  SERIES_RANGE:   string
}

export type InvoiceStatus = '' | 'D' | 'C'
export type InvoicePrintStatus = '' | 'P' | 'R'

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
  CONAME: string; // COMPANY NAME         (45 chars)
  COINIT: string; // COMPANY INITIAL      (5 chars)
  TELNO: string;  // TELEPHONE #          (9 chars)
  REGTIN: string; // VAT REG TIN          (15 chars)
  CADDR1: string; // COMPANY ADDRESS #1   (80 chars)
  CADDR2: string; // COMPANY ADDRESS #2   (80 chars)
  CADDR3: string; // COMPANY ADDRESS #3   (80 chars)

  // CLIENT INFO
  CLTNME: string; // CLIENT NAME          (35 chars)
  RADDR1: string; // CLIENT ADDRESS #1    (80 chars)
  RADDR2: string; // CLIENT ADDRESS #2    (80 chars)
  CLTTIN: string; // CLIENT TIN           (15 chars)
  CLTKEY: string; // CLIENT KEY           (5 chars)
  PRJNAM: string; // PROJECT NAME         (50 chars)
  PBLKEY: string; // PROJECT/BLOCK/LOT KEY(13 chars)
  STAFF1: string; // SALES STAFF 1        (4 chars)
  STAFF2: string; // SALES STAFF 2        (4 chars)

  // HEADER
  SYSNME: string; // SYSTEM NAME          (35 chars)
  RUNDAT: number; // RUNNING DATE         (8 zoned digits)
  RUNTME: number; // RUNNING TIME         (6 zoned digits)
  RUNBY:  string; // USER                 (8 chars)

  // FOOTER
  AUTHSG: string; // AUTHORIZED SIGNATURE (35 chars)
  ACNUM:  string; // ACKNOWLEDGEMENT NO.  (100 chars)
  ACDAT:  string; // AC DATE ISSUED       (10 chars)
  STRRNG:  string;// SERIES RANGE         (35 chars)

  // TRACKING
  STATUS: InvoiceStatus; // STATUS
  PRSTAT: InvoicePrintStatus // PRINT STATUS
  PRCNT:  number;  // PRINT COUNT

  RPDATE: number;  // REPRINT DATE         (8 zoned digits)
  RPTIME: number;  // REPRINT TIME         (6 zoned digits)
  REPRBY: string;  // REPRINTED BY         (8 chars)

  UPDDTE: number; // UPDATE DATE         (8 zoned digits)
  UPDTME: number; // UPDATE TIME         (6 zoned digits)
  UPDBY: string;   // UPDATED BY          (8 chars)
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
  WTXRAT: number; // WITHHOLDING TAX RATE (05 zoned digits with 2 decimals)
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
  NOTICE_NUMBER: string
  CODEA: string  //FOR ENTRY RENTAL CUSA
  CODEE: string  //FOR ENTRY RENTAL CUSA
  SALTYP: string //FOR ENTRY RENTAL CUSA

  BILLINGS: LeaseBill[]
  VER_KEY: string
  VERIFICATION?: VerificationOfPayment

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
  CRMKPF: CRMKPF
  CORF4PF: CORF4PF[]

  LOPH2PF: LOPH2PF
  LOPD2PF: LOPD2PF[]
  CORF3PF: CORF3PF

  // ENTRIES
  ENTRY?: ACCOUNTING_ENTRIES
}

export interface ACCOUNTING_ENTRIES {
  GFL1PF: GFL1PF
  GFL2PF: GFL2PF[]
  GPARPF: GPARPF[]
}

export interface GFL1PF { //ACCOUNTING FILE 1 (MAIN VOUCHER RECORD)
  VTYPE: string
  COMPCD: number
  BRANCH: number
  DEPTCD: number
  YY: number
  MM: number
  VRCOD: string
  'VOUCH#': number
  // ---------------------
  NOACCT: number
  DATTRN: number //value date, max 1 month advance
  DATECR: number //creation date
  PAYCOD: string
  PAYEE: string
  PARCLR: string
  AMPAID: number
  BALNCE: number
  CONTNO: number
  PARTNO: number
  BRNHCD: number
  'PN#': number
  FAO: string
  FAOCOD: number
  VSCODE: string
  ORCOD: string
  ORNUM: number
}

export interface GFL2PF { //ACCOUNTING FILE 2 (ACCOUNTING ENTRIES ARRAY)
  VTYPE: string
  COMPCD: number
  BRANCH: number
  DEPTCD: number
  YY: number
  MM: number
  VRCOD: string
  'VOUCH#': number
  // ---------------------
  'ACCT#': number
  ACCTCD: string
  DEBIT: number
  CREDIT: number
  CHKNUM: number
  PRNTCD: string
  MCCODE: string
  DATTRN: number
  ORCOD: string
  ORNUM: number
}

export interface GPARPF { //PARTICULARS FILE (PARTICULARS ARRAY)
  VTYPE: string
  COMPCD: number
  BRANCH: number
  DEPTCD: number
  YY: number
  MM: number
  VRCOD: string
  'VOUCH#': number
  // ---------------------
  PARTNO: number
  PARCLR: string
}


export interface INVOICE_PER_COMPANY_AND_PROJECT {
  COMPCD: number
  PROJCD: string

  HEADER: {
    COMPANY_NAME:   string
    PROJECT_NAME:   string
    ADDRESS:        string
    LOGO_URL:       string
    LOGO_SIZE_INCH: {
      WIDTH:        number
      HEIGHT:       number
    },
    INVOICE_DATE:   number
  },

  FOOTER: {
    ACNUM:          string
    ACDAT:          string
    TIMSTP:         number
    DATSTP:         number
  },

  INVOICE_RECORDS: InvoiceRecord[]
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
  'PN#': number; // PROMISSORY NOTE # (ZONED 5, 0)
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

export interface CRMKPF {
  COMPCD: number; // COMPANY CODE (ZONED 2, 0)
  BRANCH: number; // BRANCH CODE (ZONED 1, 0)
  DEPTCD: number; // DEPARTMENT CODE (ZONED 2, 0)
  ORCOD: string; // O.R. CODE (CHAR 2)
  ORNUM: number; // O.R. NUMBER (ZONED 6, 0)
  RMARK1: string;
  RMARK2: string;
  RMARK3: string;
  RMARK4: string;
}

interface CORF4PF {
  COMPCD: number; // COMPANY CODE (ZONED 2,0)
  BRANCH: number; // BRANCH CODE (ZONED 1,0)
  DEPTCD: number; // DEPARTMENT CODE (ZONED 2,0)
  ORCOD: string; // O. R. CODE (CHAR 2)
  ORNUM: number; // O. R. NUMBER (ZONED 6,0)
  DATVAL: number; // VALUE DATE (ZONED 8,0)
  PROJCD: string; // PROJECT CODE (CHAR 3)
  PCSCOD: string; // PCS CODE (CHAR 1)
  PHASE: string; // PHASE (CHAR 1)
  BLOCK: string; // BLOCK (CHAR 2)
  LOT: string; // LOT/UNIT (CHAR 4)
  UNITCD: string; // UNIT CODE (CHAR 2)
  PAYTYP: string; // PAYMENT TYPE (CHAR 1)
  BTYPE: number; // BILL TYPE (ZONED 2,0)
  MBTYPE: number; // MOTHER BILL TYPE (ZONED 2,0)
  LESDES: string; // LEASE DESCRIPTION (CHAR 30)
  ORAMT: number; // OR AMOUNT (PACKED 11,2)
  VATSAL: number; // VATABLE SALES (PACKED 11,2)
  VATXMP: number; // VAT-EXEMPT SALES (PACKED 11,2)
  VATZRO: number; // ZERO RATED SALES (PACKED 11,2)
  TOTSAL: number; // TOTAL SALES (PACKED 11,2)
  VATAMT: number; // VAT AMOUNT (PACKED 11,2)
  WITTAX: number; // WITHHOLDING TAX (PACKED 11,2)
  GRSAMT: number; // GROSS AMOUNT (PACKED 11,2)
  ENTDES: string; // ACK.REC-ENTRY DESCRIPTION (CHAR 25)
  ENTAMT: number; // ACK.REC.-ENTRY AMOUNT (PACKED 11,2)
  LESRF: number; // LESS: RES. FEE (PACKED 11,0)
  ORTYPE: string; // OR TYPE (CHAR 1)
  DATENT: number; // DATE ENTERED (ZONED 8,0)
  TIMENT: number; // TIME ENTERED (ZONED 6,0)
  USRENT: string; // USER NAME (CHAR 10)
}

interface LOPH2PF { //Long Term Lease Header File
  COMPCD: number;   // COMPANY CODE (ZONED 2,0)
  BRANCH: number;   // BRANCH CODE (ZONED 1,0)
  DEPTCD: number;   // DEPARTMENT CODE (ZONED 2,0)
  ORCOD: string;    // O. R. CODE (CHAR 2)
  ORNUM: number;    // O. R. NUMBER (ZONED 6,0)
  PROJCD: string;   // PROJECT CODE
  PCSCOD: string;   // PCS CODE
  PHASE: string;    // PHASE
  BLOCK: string;    // BLOCK
  LOT: string;      // LOT/UNIT
  UNITCD: string;   // UNIT
  TCLTNO: number;   // TEMPORARY CLIENT NUMBER
  CLBRAN: number;   // CLIENT BRANCH (ZONED 1,0)
  CLTNUM: number;   // CLIENT KEY (ZONED 4,0)
  PDSCOD: string;   // PARK, DRY, STORE CODE (CHAR 1)
  PDSNUM: number;   // PARK, DRY, STORE NUMBER (ZONED 2,0)
  DATOR: number;    // O. R. DATE (ZONED 8,0)
  DATVAL: number;   // VALUE DATE (ZONED 8,0)
  PAYTYP: string;   // PAYMENT TYPE (CHAR 1)
  ORAMT: number;    // OR AMOUNT (PACKED 11,2)
  BALANC: number;   // BALANCE (PACKED 13,2)
  VATOR: number;    // VAT PER O.R. (PACKED 11,2)
  PRPTAX: number;   // PREPAID TAX/WITHHOLDING TAX (PACKED 11,2)
  USRUPD: string;   // USER NAME UPDATED (CHAR 10)
  DATUPD: number;   // DATE UPDATED (ZONED 8,0)
  TIMUPD: number;   // TIME UPDATED (ZONED 6,0)
}

interface LOPD2PF { //Long Term Lease Payment Detail
  COMPCD: number;    // COMPANY CODE (ZONED 2,0)
  BRANCH: number;    // BRANCH CODE (ZONED 1,0)
  DEPTCD: number;    // DEPARTMENT CODE (ZONED 2,0)
  ORCOD: string;     // O. R. CODE (CHAR 2)
  ORNUM: number;     // O. R. NUMBER (ZONED 6,0)
  DATVAL: number;    // VALUE DATE (ZONED 8,0)
  PROJCD: string;    // PROJECT CODE (CHAR 3)
  PCSCOD: string;    // PCS CODE (CHAR 1)
  PHASE: string;     // PHASE (CHAR 1)
  BLOCK: string;     // BLOCK (CHAR 2)
  LOT: string;       // LOT/UNIT (CHAR 4)
  UNITCD: string;    // UNIT CODE (CHAR 2)
  TCLTNO: number;    // TEMPORARY CLIENT NUMBER (ZONED 7,0)
  CLBRAN: number;    // CLIENT BRANCH (ZONED 1,0)
  CLTNUM: number;    // CLIENT KEY (ZONED 4,0)
  PDSCOD: string;    // PARK, DRY, STORE CODE (CHAR 1)
  PDSNUM: number;    // PARK, DRY, STORE NUMBER (ZONED 2,0)
  PAYTYP: string;    // PAYMENT TYPE (CHAR 1)
  BTYPE: number;     // BILL TYPE (ZONED 2,0)
  YY: number;        // BILLING YEAR (ZONED 4,0)
  MM: number;        // BILLING MONTH (ZONED 2,0)
  BILAMT: number;    // BILL AMOUNT (PACKED 11,2)
  AMTPD: number;     // AMOUNT PAID (PACKED 11,2)
  PRPTAX: number;    // PREPAID TAX PER BILL TYPE (PACKED 11,2)
  DATDUE: number;    // BILLING DUE DATE (ZONED 8,0)
  PERIOD: string;    // BILLING PERIOD IN WORDS (CHAR 20)
  FRBILL: number;    // BILLING PERIOD FROM DATE (ZONED 8,0)
  TOBILL: number;    // BILLING PERIOD TO DATE (ZONED 8,0)
  USRUPD: string;    // USER NAME UPDATED (CHAR 10)
  DATUPD: number;    // DATE UPDATED (ZONED 8,0)
  TIMUPD: number;    // TIME UPDATED (ZONED 6,0)
}

interface CORF3PF { //CD OR File 3 (VAT reflected on OR Issued)
  COMPCD: number;   // COMPANY CODE (ZONED 2,0)
  BRANCH: number;   // BRANCH CODE (ZONED 1,0)
  DEPTCD: number;   // DEPARTMENT CODE (ZONED 2,0)
  ORCOD: string;    // O. R. CODE (CHAR 2)
  ORNUM: number;    // O. R. NUMBER (ZONED 6,0)
  DATVAL: number;   // VALUE DATE (ZONED 8,0)
  PROJCD: string;   // PROJECT CODE (CHAR 3)
  PCSCOD: string;   // PCS CODE (CHAR 1)
  PHASE: string;    // PHASE (CHAR 1)
  BLOCK: string;    // BLOCK (CHAR 2)
  LOT: string;      // LOT/UNIT (CHAR 4)
  UNITCD: string;   // UNIT CODE (CHAR 2)
  PAYTYP: string;   // PAYMENT TYPE (CHAR 1)
  ORAMT: number;    // OR AMOUNT (PACKED 11,2)
  VATAMT: number;   // VAT AMOUNT (PACKED 11,2)
  RATIO: number;    // RATIO OF ZV/NET SP (ZONED 5,4)
  ZONVAL: number;   // ZONAL VALUE USED (PACKED 13,2)
  NETSP: number;    // NET SELLING PRICE USED (PACKED 13,2)
  PRPTAX: number;   // PREPAID TAX OF LEASE CLIENTS (PACKED 13,2)
  VATCOD: string;   // VAT/NON VAT CODE (CHAR 1)
  VATDES: string;   // VAT DESCRIPTION (CHAR 30)
  DATENT: number;   // DATE ENTERED (ZONED 8,0)
  TIMENT: number;   // TIME ENTERED (ZONED 6,0)
  USRENT: string;   // USER NAME (CHAR 10)
}

interface FAILED_INVOICE_RECORD {
  error: string
  invoice_record: InvoiceRecord
}

export interface FAILED_INVOICE_RECORDS {
  RUN_TYPE: string,
  RUN_BY: string,
  RUN_AT: string,
  FAILED_INVOICES: FAILED_INVOICE_RECORD[],
  FAILED_INVOICES_LENGTH: number,
}


// PRINT OUT

export interface VariantInfo {
  NAME: string;
  TEL_NO: string;
  ADDRESS1: string;
  ADDRESS2: string;
  ADDRESS3: string;
  TIN_EXTENSION: string;
}

export interface COMPANY_HEADER_DETAIL {
  COMPCD: number;
  COINIT: string;
  CONAME: string;
  TIN_BASE: string;
  VARIANTS: Record<number, VariantInfo>;
  ACN:        string
  DATE_ISSUED:string
}

export interface MINOR_COMPANY_HEADER_DETAIL {
  COMPCD:      number
  DEPTCD:      number
  COINIT:      string
  CONAME:      string
  TIN:         string
  TEL_NO:      string
  ADDRESS1:    string
  ADDRESS2:    string
  ADDRESS3:    string
  BRANCH_NAME: string
  ACN:         string
  DATE_ISSUED: string
}

export interface COMPANY_LOGO {
  COMPCD:     number
  IMG_URL:    string
  IMG_SIZE_INCH:   {
    WIDTH:  number
    HEIGHT: number
  }
}

export interface Signatories {
  name: string
  timestamp: string
}

export interface InvoicePDF {
  header: {
    systemName: string,

    runDateAndTime: string,
    runUsername: string,

    companyName: string,
    companyAddress: string,
    companyInitials: string,
    companyTelephone: string,
    companyRegisteredTIN: string,

    companyLogo: string,
    companyLogoWidth: number,
    companyLogoHeight: number,

    invoiceTypeName: string,
    controlNumber: string,
    dateValue: string,

    name: string,
    address: string,
    tin: string,
    clientKey: string,
    project: string,
    unit: string,
    salesStaff: string,
  },
  footer: {
    acknowledgementCertificateNumber: string
    dateIssued: string,
    approvedSeriesRange: string
  },
  body: {
    billings: {
      itemDescription: string,
      qty: string,
      unitCost: string,
      vatAmount: string,
      amount: string,
    }[]
    breakdowns: {
      section1: {
        vatableSales: string,
        vatAmount: string,
        vatExemptSales: string,
        zeroRatedSales: string,
        governmentTax: string,
      },
      section2: {
        totalSales: string,
        lessVAT: string,
        netOfVAT: string,
        addVAT: string,
        addGovernmentTaxes: string,
        lessWithholdingTax: string,
        totalAmountDue: string,
      },
    }
  },
  authorizedSignature: string,
  reprinting: {
    isReprint: boolean,
    reprintBy: string,
    reprintDateTime: string,
  }
}