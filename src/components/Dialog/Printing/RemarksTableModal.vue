<script lang="ts" setup>
  import { ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { usePrintingStore } from '../../../store/usePrintingStore';

  const printStore = usePrintingStore();

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    LINE: { value: null, matchMode: FilterMatchMode.CONTAINS },
    REMKS: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
</script>

<template>
  <DataTable
    :value="printStore.remarks_data"
    dataKey="id"

    v-model:filters="filters"
    :filterDisplay="undefined"
    :globalFilterFields="['LINE', 'REMKS']"

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
    <template #empty> No remarks found. </template>

    <Column header="Line"
      field="LINE"
      sortable
      filterField="LINE"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search'"
          class="w-20"
        />
      </template>
    </Column>

    <Column header="Remark"
      field="REMKS"
      sortable
      filterField="REMKS"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Remark'"
        />
      </template>
    </Column>
  </DataTable>
</template>