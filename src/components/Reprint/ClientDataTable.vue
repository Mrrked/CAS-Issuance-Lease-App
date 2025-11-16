<script lang="ts" setup>
  import { ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import { usePrintingStore } from '../../store/usePrintingStore';
  import { useUtilitiesStore } from '../../store/useUtilitiesStore';

  const printStore = usePrintingStore()
  const utilStore = useUtilitiesStore()

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    CACCT: { value: null, matchMode: FilterMatchMode.CONTAINS },
    CLIENT_NAME: { value: null, matchMode: FilterMatchMode.CONTAINS },
    BIRTH: { value: null, matchMode: FilterMatchMode.CONTAINS },
    TAN1: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
</script>

<template>
  <!-- MAIN DATATABLE -->
  <DataTable
    :value="printStore.clients_data"
    dataKey="CACCT"

    v-model:filters="filters"
    :filterDisplay="'row'"
    :globalFilterFields="['CACCT', 'CLIENT_NAME', 'BIRTH', 'TAN1']"

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
          Client Query Results
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

    <template #empty> No clients found. </template>

    <Column header="CACCT"
      field="CACCT"
      sortable
      filterField="CACCT"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by CACCT#'"
        />
      </template>
    </Column>

    <Column header="Client Full Name"
      field="CLIENT_NAME"
      sortable
      filterField="CLIENT_NAME"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Client Full Name'"
        />
      </template>
    </Column>

    <Column header="Birth Date"
      field="BIRTH"
      sortable
      filterField="BIRTH"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Birth Date'"
        />
      </template>
      <template #body="{ data }">
        {{ data.BIRTH ? utilStore.formatDateNumberToStringMONTHDDYYYY(data.BIRTH) : '-' }}
      </template>
    </Column>

    <Column header="TIN #"
      field="TAN1"
      sortable
      filterField="TAN1"
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by TIN #'"
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
            @click="printStore.handleActionSearchClientUnits(data.CACCT)"
            label="Search Units"
            icon="pi pi-search"
            iconPos="right"
            size="small"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>