<script lang="ts" setup>
  import { onMounted, ref, } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import DataTable from 'primevue/datatable';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';
  import { useIssuanceStore } from '../../../store/useIssuanceStore';
  import { usePerVerificationRunStore } from '../../../store/usePerVerificationStore';

  const utilStore = useUtilitiesStore()

  const issuanceStore = useIssuanceStore();
  const perVerificationRunStore = usePerVerificationRunStore()

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    VER_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PBL_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    TCLTNO: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'VERIFICATION.BILTYP': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.CLTNME': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'TOTAL_BREAKDOWN.TOTSAL': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'TOTAL_BREAKDOWN.PRDTAX': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'TOTAL_BREAKDOWN.AMTDUE': { value: null, matchMode: FilterMatchMode.CONTAINS },
  })

  onMounted(() => {
    perVerificationRunStore.selectedInvoiceRecord = undefined
    issuanceStore.handleActionSearch('D')
  })
</script>


<template>
  <div class="flex flex-col gap-5 text-sm">
    <DataTable
      :value="perVerificationRunStore.invoice_records_data"
      dataKey="PBL_KEY"
      selectionMode="single"
      v-model:selection="perVerificationRunStore.selectedInvoiceRecord"

      v-model:filters="filters"
      filterDisplay="undefined"
      :globalFilterFields="['VER_KEY', 'VERIFICATION.BILTYP', 'PBL_KEY', 'TCLTNO', 'DETAILS.CLTNME', 'TOTAL_BREAKDOWN.TOTSAL', 'TOTAL_BREAKDOWN.PRDTAX', 'TOTAL_BREAKDOWN.AMTDUE']"

      scrollable
      size="small"
      resizableColumns

      stripedRows
      :rows="10"
      :rowsPerPageOptions="[10, 20, 30, 50]"

      paginator
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      currentPageReportTemplate="{first} to {last} of {totalRecords}"
    >
      <template #empty> No verification found. </template>

      <template #header>
        <div class="flex justify-between gap-2">
          <div class="text-2xl font-semibold text-primary">
            List of Verification (Lease)
          </div>
          <div class="flex justify-between gap-5">
            <Button
              @click="issuanceStore.handleActionSearch('D')"
              raised
              label="Refresh"
              icon="pi pi-refresh"
              size="small"
            />
            <Button
              @click="perVerificationRunStore.handleActionIssueInvoice"
              raised
              label="Issue Invoice on Selected Verification"
              icon="pi pi-arrow-right"
              size="small"
              severity="success"
              :disabled="!perVerificationRunStore.selectedInvoiceRecord"
            />
          </div>
        </div>
      </template>

      <Column header="Verification Number"
        field="VER_KEY"
        filterField="VER_KEY"
        sortable
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Verification #'"
          />
        </template>
        <template #body="{ data }">
          {{ data.VER_KEY }}
        </template>
      </Column>

      <Column header="Bill Type"
        field="VERIFICATION.BILTYP"
        filterField="VERIFICATION.BILTYP"
        sortable
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Bill Type'"
            class="w-20"
          />
        </template>
        <template #body="{ data }">
          {{ data.VERIFICATION?.BILTYP || '' }}
        </template>
      </Column>

      <Column header="Project / Block / Lot"
        field="PBL_KEY"
        filterField="PBL_KEY"
        sortable
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by PBL'"
            class="w-32"
          />
        </template>
        <template #body="{ data }">
          <span class="whitespace-pre">
            {{ data.PBL_KEY }}
          </span>
        </template>
      </Column>

      <Column header="Temporary Client #"
        field="TCLTNO"
        filterField="TCLTNO"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by TCLTNO'"
            class="w-36"
          />
        </template>
        <template #body="{ data }">
          {{ data.TCLTNO || '-' }}
        </template>
      </Column>

      <Column header="Client Name"
        field="DETAILS.CLTNME"
        filterField="DETAILS.CLTNME"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Client Name'"
            class="w-60"
          />
        </template>
        <template #body="{ data }">
          {{ data.DETAILS?.CLTNME || '-' }}
        </template>
      </Column>

      <Column header="Total Sales"
        field="TOTAL_BREAKDOWN.TOTSAL"
        filterField="TOTAL_BREAKDOWN.TOTSAL"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Total Sales'"
            class="w-28"
          />
        </template>
        <template #body="{ data }">
          {{ data.TOTAL_BREAKDOWN?.TOTSAL ? utilStore.formatNumberToString2DecimalNumber(data.TOTAL_BREAKDOWN.TOTSAL) : '-' }}
        </template>
      </Column>

      <Column header="Withholding Tax"
        field="TOTAL_BREAKDOWN.PRDTAX"
        filterField="TOTAL_BREAKDOWN.PRDTAX"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Withholding Tax'"
            class="w-28"
          />
        </template>
        <template #body="{ data }">
          {{ data.TOTAL_BREAKDOWN?.PRDTAX ? utilStore.formatNumberToString2DecimalNumber(data.TOTAL_BREAKDOWN.PRDTAX) : '-' }}
        </template>
      </Column>

      <Column header="Total Amount Due"
        field="TOTAL_BREAKDOWN.AMTDUE"
        filterField="TOTAL_BREAKDOWN.AMTDUE"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Total Amount Due'"
            class="w-28"
          />
        </template>
        <template #body="{ data }">
          {{ data.TOTAL_BREAKDOWN?.AMTDUE ? utilStore.formatNumberToString2DecimalNumber(data.TOTAL_BREAKDOWN.AMTDUE) : '-' }}
        </template>
      </Column>

      <Column>
        <template #body="{ data }">
          <Button
            @click="issuanceStore.handleActionPreviewDraftInvoice(data)"
            icon="pi pi-eye"
            label="Draft"
            size="small"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>