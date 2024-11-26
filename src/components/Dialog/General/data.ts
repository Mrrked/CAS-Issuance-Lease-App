import cdcLogo from '../../../assets/cdc.png';
import ciLogo from '../../../assets/ci.png';
import cldiLogo from '../../../assets/cldi.png';

export interface COMPANY_DETAILS {
    COMPCD:     number
    CONAME:     string
    COINIT:     string
    TIN:        string
    ADDRESS:    string
    TEL_NO:     string
    IMG_URL:    string
    IMG_SIZE_INCH:   {
        WIDTH:  number
        HEIGHT: number
    }
}

export const COMPANIES: COMPANY_DETAILS[] = [
    {
        COMPCD:     1,
        COINIT:     'CDC',
        TEL_NO:     '8893-6060',
        TIN:        '000-527-103-00000',
        CONAME:     'CITYLAND DEVELOPMENT CORPORATION',
        ADDRESS:    '2/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V. DELA COSTA ST BEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES',
        IMG_URL:    cdcLogo,
        IMG_SIZE_INCH:   {
            WIDTH:  0.8,
            HEIGHT: 0.8
        }
    },
    {
        COMPCD:     2,
        COINIT:     'CI',
        TEL_NO:     '8893-6060',
        TIN:        '000-662-829-00000',
        CONAME:     'CITYLAND, INC.',
        ADDRESS:    '3/F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V. DELA COSTA STREET BEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES',
        IMG_URL:    ciLogo,
        IMG_SIZE_INCH:   {
            WIDTH:  0.8,
            HEIGHT: 0.75
        }
    },
    {
        COMPCD:     12,
        COINIT:     'CLDI',
        TEL_NO:     '8893-6060',
        TIN:        '000-444-840-00000',
        CONAME:     'CITY & LAND DEVELOPERS, INCORPORATED',
        ADDRESS:    '3F CITYLAND CONDOMINIUM 10 TOWER 1 156 H.V. DELA COSTA BEL-AIR 1209 CITY OF MAKATI NCR, FOURTH DISTRICT PHILIPPINES',
        IMG_URL:    cldiLogo,
        IMG_SIZE_INCH:   {
            WIDTH:  0.8,
            HEIGHT: 0.7
        }
    },
]