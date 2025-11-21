<script lang="ts" setup>
  import { inject, ref, Ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import DataTable, { DataTableRowSelectEvent } from 'primevue/datatable';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';
  import { InvoiceRecord } from '../../../store/types';
  import { useIssuanceStore } from '../../../store/useIssuanceStore';

  interface DialogRef  {
    data: {
      invoice_date: Date
      table_data: InvoiceRecord[]
      submit: Function
      cancel: Function
    }
  }

  const utilStore = useUtilitiesStore()

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const issuanceStore = useIssuanceStore();

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PBL_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    TCLTNO: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.CLTNME': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'TOTAL_BREAKDOWN.TOTSAL': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'TOTAL_BREAKDOWN.PRDTAX': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'TOTAL_BREAKDOWN.AMTDUE': { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const onRowSelect = (event: DataTableRowSelectEvent) => {
    if (dialogRef) {
      issuanceStore.handleActionPreviewDraftInvoice(event.data)
    }
    event.originalEvent.preventDefault();
    return;
  };
</script>


<template>
  <DataTable
    :value="dialogRef?.data.table_data"
    dataKey="PBL_KEY"
    selectionMode="single"
    @rowSelect="onRowSelect"

    v-model:filters="filters"
    filterDisplay="row"
    :globalFilterFields="['PBL_KEY', 'TCLTNO', 'DETAILS.CLTNME', 'TOTAL_BREAKDOWN.TOTSAL', 'TOTAL_BREAKDOWN.PRDTAX', 'TOTAL_BREAKDOWN.AMTDUE']"

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

    <template #empty> No bill found. </template>

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
  </DataTable>
</template>