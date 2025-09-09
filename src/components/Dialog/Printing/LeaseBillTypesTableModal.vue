<script lang="ts" setup>
  import { ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { useMainStore } from '../../../store/useMainStore';

  const mainStore = useMainStore()

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    BTYPE: { value: null, matchMode: FilterMatchMode.CONTAINS },
    BDESC: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
</script>


<template>
  <DataTable
    :value="mainStore.lease_bill_types"
    dataKey="BTYPE"

    v-model:filters="filters"
    :filterDisplay="undefined"
    :globalFilterFields="['BTYPE', 'BDESC']"

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
    <template #empty> No bill types found. </template>

    <Column header="Bill Type"
      field="BTYPE"
      sortable
      filterField="BTYPE"
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

    <Column header="Description"
      field="BDESC"
      sortable
      filterField="BDESC"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Description'"
        />
      </template>
    </Column>
  </DataTable>
</template>