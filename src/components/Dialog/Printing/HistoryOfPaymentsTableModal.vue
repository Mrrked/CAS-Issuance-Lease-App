<script lang="ts" setup>
  import { inject, ref, Ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import DataTable, { DataTableRowSelectEvent } from 'primevue/datatable';
  import { HistoryOfPayment } from '../../../store/types';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';
  import { useMainStore } from '../../../store/useMainStore';

  interface DialogRef  {
    data: {
      table_data: HistoryOfPayment[],
      submit: Function
      cancel: Function
    },
  }

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DOCUMENT_TYPE: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DATOR: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DATVAL: { value: null, matchMode: FilterMatchMode.CONTAINS },
    OR_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PAYTYP: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ORAMT: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PNALTY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DATCAN: { value: null, matchMode: FilterMatchMode.CONTAINS },
    STATUS: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const onRowSelect = (event: DataTableRowSelectEvent) => {
    if (dialogRef) {
      dialogRef.value.data.submit(event.data)
    }
  };
</script>


<template>
  <DataTable
    :value="dialogRef?.data.table_data"
    dataKey="OR_KEY"

    @rowSelect="onRowSelect"
    selectionMode="single"

    v-model:filters="filters"
    :filterDisplay="'undefined'"
    :globalFilterFields="['DOCUMENT_TYPE','DATOR', 'DATVAL', 'OR_KEY', 'PAYTYP', 'ORAMT', 'PNALTY', 'DATCAN']"

    scrollable
    size="small"
    resizableColumns

    stripedRows
    :rows="10"
    :rowsPerPageOptions="[10, 30, 50]"

    paginator
    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
    currentPageReportTemplate="{first} to {last} of {totalRecords}"
  >
    <template #empty> No history of payment found. </template>

    <Column header="Document Type"
      field="DOCUMENT_TYPE"
      sortable
      filterField="DOCUMENT_TYPE"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Document Type'"
        />
      </template>
    </Column>

    <Column header="Invoice / Receipt #"
      field="OR_KEY"
      sortable
      filterField="OR_KEY"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Invoice / Receipt #'"
        />
      </template>
    </Column>

    <Column header="Date Issued"
      field="DATOR"
      sortable
      filterField="DATOR"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Date Issued'"
        />
      </template>
      <template #body="{ data }">
        {{ data.DATOR ? utilStore.formatDateNumberToStringYYYYMMDD(data.DATOR) : '-' }}
      </template>
    </Column>

    <Column header="Value Date"
      field="DATVAL"
      sortable
      filterField="DATVAL"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Value Date'"
        />
      </template>
      <template #body="{ data }">
        {{ utilStore.formatDateNumberToStringYYYYMMDD(data.DATVAL) }}
      </template>
    </Column>

    <Column header="Type"
      field="PAYTYP"
      sortable
      filterField="PAYTYP"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Type'"
        />
      </template>
      <template #body="{ data }">
        <span
          class="pr-3"
          v-tooltip.right="{
            value: mainStore.PAYMENT_TYPES.find((type) => type.initial === data.PAYTYP)?.name || '-',
          }"
        >
          {{ mainStore.PAYMENT_TYPES.find((type) => type.initial === data.PAYTYP)?.initial || '-' }}
        </span>
      </template>
    </Column>

    <Column header="Total Amount"
      field="ORAMT"
      sortable
      filterField="ORAMT"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Total Amount'"
        />
      </template>
      <template #body="{ data }">
        {{ data.ORAMT ? utilStore.formatNumberToString2DecimalNumber(data.ORAMT) : '0.00' }}
      </template>
    </Column>

    <Column header="Penalty"
      field="PNALTY"
      sortable
      filterField="PNALTY"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Penalty'"
        />
      </template>
      <template #body="{ data }">
        {{ data.PNALTY ? utilStore.formatNumberToString2DecimalNumber(data.PNALTY) : '0.00' }}
      </template>
    </Column>

    <Column header="Status"
      field="STATUS"
      sortable
      filterField="STATUS"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Status'"
        />
      </template>
      <template #body="{ data }">
        <svg v-if="data.STATUS === 'VALID'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="text-green-800 dark:text-green-400 size-6">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
        </svg>
        <Tag v-else-if="data.DATCAN"
          :value="data.STATUS + (data.DATCAN ? ' - ' + utilStore.formatDateNumberToStringYYYYMMDD(data.DATCAN) : '')"
          severity="danger"
        />
      </template>
    </Column>

  </DataTable>
</template>