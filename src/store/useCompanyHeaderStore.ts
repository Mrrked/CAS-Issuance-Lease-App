import { COMPANY_HEADER_DETAIL, COMPANY_LOGO, MINOR_COMPANY_HEADER_DETAIL } from './types'

import axios from '../axios';
import cdcLogo from '../assets/cdc.jpg';
import ciLogo from '../assets/ci.jpg';
import cldiLogo from '../assets/cldi.jpg';
import { defineStore } from 'pinia'
import { ref } from 'vue';

export const useCompanyHeaderStore = defineStore('companyHeader', () => {

  const COMPANY_LOGOS: COMPANY_LOGO[] = [
    {
      COMPCD:     1,
      IMG_URL:    cdcLogo,
      IMG_SIZE_INCH:   {
        WIDTH:  0.8,
        HEIGHT: 0.8
      }
    },
    {
      COMPCD:     2,
      IMG_URL:    ciLogo,
      IMG_SIZE_INCH:   {
        WIDTH:  0.8,
        HEIGHT: 0.75
      }
    },
    {
      COMPCD:     12,
      IMG_URL:    cldiLogo,
      IMG_SIZE_INCH:   {
        WIDTH:  0.8,
        HEIGHT: 0.7
      }
    },
  ]

  const all_company_header_details = ref<COMPANY_HEADER_DETAIL[]>([])

  const getCompanyLogoByCompanyCode = (company_code: number): COMPANY_LOGO => {
    const logo = COMPANY_LOGOS.find(logo => logo.COMPCD === company_code);
    if (logo) return logo;
    return COMPANY_LOGOS[0];
  }

  const getCompanyHeaderDetail = (company_code: number, dept_code: number): MINOR_COMPANY_HEADER_DETAIL | null => {
    if (![1, 2, 12].includes(company_code)) {
      return null;
    } else if (![11, 33, 44, 55].includes(dept_code)) {
      return null;
    }

    // console.log(`Company Code: ${company_code}, Department Code: ${dept_code}`);

    const appropriate_company = all_company_header_details.value
      .find((company) => company.COMPCD === company_code);

    if (!appropriate_company) {
      return null;
    }

    const appropriate_variant = appropriate_company.VARIANTS || {};
    const appropriate_branch = appropriate_variant[dept_code];

    if (!appropriate_branch) {
      return null;
    }

    // console.log("Company:", appropriate_company);
    // console.log("Branch:", appropriate_branch);

    return {
      COMPCD: appropriate_company.COMPCD,
      DEPTCD: dept_code,
      COINIT: appropriate_company.COINIT,
      CONAME: appropriate_company.CONAME,
      TIN: appropriate_company.TIN_BASE + (appropriate_branch.TIN_EXTENSION || ""),
      TEL_NO: appropriate_branch.TEL_NO,
      ADDRESS1: appropriate_branch.ADDRESS1,
      ADDRESS2: appropriate_branch.ADDRESS2,
      BRANCH_NAME: appropriate_branch.NAME
    };
  }

  const fetchAllCompanyHeaderDetails = async (force: boolean = false) => {
    if (all_company_header_details.value.length === 0 || force) {
      return axios.get('issuance_lease/company_header/all/')
        .then((response) => {
          all_company_header_details.value = response.data.data;
        })
    }
  }

  return {
    COMPANY_LOGOS,

    all_company_header_details,

    getCompanyLogoByCompanyCode,
    getCompanyHeaderDetail,

    fetchAllCompanyHeaderDetails,
  }
})