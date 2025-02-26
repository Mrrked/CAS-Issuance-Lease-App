<script lang="ts" setup>
  import { ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { usePrintingStore } from '../../store/usePrintingStore';

  defineProps<{
    activateCallback: Function
  }>()

  const printStore = usePrintingStore()

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PBL_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    CLIENT_KEY: { value: null, matchMode: FilterMatchMode.CONTAINS },
    TCLTNO: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
</script>

<template>
  <div>
    <!-- MAIN DATATABLE -->
    <DataTable
      :value="printStore.units_data"
      dataKey="PBL_KEY"

      v-model:filters="filters"
      :filterDisplay="'row'"
      :globalFilterFields="['PBL_KEY', 'CLIENT_KEY', 'TCLTNO']"

      scrollable
      size="small"
      resizableColumns

      stripedRows
      :rows="5"
      :rowsPerPageOptions="[5, 10, 20, 50]"

      paginator
      paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      currentPageReportTemplate="{first} to {last} of {totalRecords}"
    >
      <template #header>
        <div class="flex justify-between gap-3">
          <div class="text-xl font-bold">
            Unit Query Results
          </div>
          <div class="flex gap-3">
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText v-model="filters['global'].value" placeholder="Global Search" />
            </IconField>
          </div>
        </div>
      </template>

      <template #empty> No units found. </template>

      <Column header="Project / Block / Lot"
        field="PBL_KEY"
        sortable
        filterField="PBL_KEY"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by PBL'"
          />
        </template>
        <template #body="{ data }">
          <span class="whitespace-pre">
            {{ data.PBL_KEY }}
          </span>
        </template>
      </Column>

      <Column header="Client Key"
        field="CLIENT_KEY"
        sortable
        filterField="CLIENT_KEY"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Client Key'"
          />
        </template>
      </Column>

      <Column header="Temporary Client #"
        field="TCLTNO"
        sortable
        filterField="TCLTNO"
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Temporary Client Number'"
          />
        </template>
      </Column>

      <Column header=""
        frozen
        align-frozen="right"
      >
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              @click="printStore.handleActionSelectUnit(data, activateCallback)"
              label="Select Unit"
              icon="pi pi-arrow-right"
              iconPos="right"
              size="small"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>