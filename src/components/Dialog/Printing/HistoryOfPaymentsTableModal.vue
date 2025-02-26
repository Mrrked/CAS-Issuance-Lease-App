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
    DATOR: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DATVAL: { value: null, matchMode: FilterMatchMode.CONTAINS },
    OR_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PAYTYP: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ORAMT: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PNALTY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    DATCAN: { value: null, matchMode: FilterMatchMode.CONTAINS },
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
    :globalFilterFields="['DATOR', 'DATVAL', 'OR_KEY', 'PAYTYP', 'ORAMT', 'PNALTY', 'DATCAN']"

    scrollable
    size="small"
    resizableColumns

    stripedRows
    :rows="15"
    :rowsPerPageOptions="[15, 30, 50]"

    paginator
    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
    currentPageReportTemplate="{first} to {last} of {totalRecords}"
  >
    <template #empty> No history of payment found. </template>

    <Column header="O.R. Date"
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
          :placeholder="'Search by O.R. Date'"
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

    <Column header="O.R. Key"
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
          :placeholder="'Search by O.R. Key'"
        />
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

    <Column header="Total O.R. Amount"
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
          :placeholder="'Search by Total O.R. Amount'"
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

    <Column header="Cancelled Date"
      field="DATCAN"
      sortable
      filterField="DATCAN"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Cancelled Date'"
        />
      </template>
      <template #body="{ data }">
        {{ data.DATCAN ? utilStore.formatDateNumberToStringYYYYMMDD(data.DATCAN) : '-' }}
      </template>
    </Column>

  </DataTable>
</template>