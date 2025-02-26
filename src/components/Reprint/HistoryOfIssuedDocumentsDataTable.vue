<script lang="ts" setup>
  import DataTable from 'primevue/datatable';
  import { FilterMatchMode } from '@primevue/core/api';
  import { ref } from 'vue';
  import { usePrintingStore } from '../../store/usePrintingStore';
  import { useUtilitiesStore } from '../../store/useUtilitiesStore';

  const utilStore = useUtilitiesStore()
  const printStore = usePrintingStore()

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'INVOICE_KEY.INVOICE_NAME': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'INVOICE_KEY.INVOICE_NUMBER': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.DATVAL': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.STATUS': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.PRSTAT': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.PRCNT': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.RUNBY': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'EXTRA.TIMESTAMP_PRINT': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.REPRBY': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'EXTRA.TIMESTAMP_REPRINT': { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
</script>

<template>
  <!-- MAIN DATATABLE -->
  <DataTable
    :value="printStore.history_of_issued_documents_data"
    dataKey="INVOICE_KEY.INVOICE_NUMBER"
    v-model:selection="printStore.selectedHistoryOfIssuedDocument"
    selectionMode="multiple"

    v-model:filters="filters"
    :filterDisplay="'row'"
    :globalFilterFields="[]"

    scrollable
    size="small"
    resizableColumns

    stripedRows
    :rows="10"
    :rowsPerPageOptions="[10, 20, 30, 50]"

    paginator
    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
    currentPageReportTemplate="{first} to {last} of {totalRecords}"
    class="w-full border border-y-primary border-x-transparent"
  >
    <!-- HEADER -->
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="text-xl font-bold">
          History of Issued Documents
        </div>
        <Button
          @click="printStore.handleActionReprint"
          @wheel="printStore.handleActionPrintOriginal"
          icon="pi pi-print"
          size="small"
          type="button"
          severity="primary"
          label="REPRINT"
          :disabled="!printStore.selectedHistoryOfIssuedDocument.length"
        />
      </div>
    </template>

    <template #empty> No issued documents found. </template>

    <Column header="P"
      field="INVOICE_KEY.INVOICE_NUMBER"
    >
      <template #body="{ data }">
        <span v-if="printStore.selectedHistoryOfIssuedDocument.some((selected) => selected.INVOICE_KEY.INVOICE_NUMBER === data.INVOICE_KEY.INVOICE_NUMBER)" class="pi pi-arrow-right" />
      </template>
    </Column>

    <Column header="Document Type"
      field="INVOICE_KEY.INVOICE_NAME"
      filterField="INVOICE_KEY.INVOICE_NAME"
      sortable
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
      <template #body="{ data }">
        {{ data.INVOICE_KEY.INVOICE_NAME }} INVOICE
      </template>
    </Column>

    <Column header="Document Number"
      field="INVOICE_KEY.INVOICE_NUMBER"
      filterField="INVOICE_KEY.INVOICE_NUMBER"
      sortable
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search by Document Number'"
        />
      </template>
    </Column>

    <Column header="Value Date"
      field="DETAILS.DATVAL"
      filterField="DETAILS.DATVAL"
      sortable
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
        {{ data.DETAILS.DATVAL ? utilStore.formatDateNumberToStringYYYYMMDD(data.DETAILS.DATVAL) : '-' }}
      </template>
    </Column>

    <Column header="Print Status"
      field="DETAILS.PRSTAT"
      filterField="DETAILS.PRSTAT"
      sortable
    >
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          @change="filterCallback()"
          :options="printStore.PRINT_STATUSES"
          option-value="value"
          option-label="name"
          placeholder="Select One"
          size="small"
          showClear
          class="text-xs"
        />
      </template>
      <template #body="{ data }">
        <Tag v-if="data.DETAILS.PRSTAT === 'P'" severity="success" value="PRINTED" />
        <Tag v-else-if="data.DETAILS.PRSTAT === 'R'" severity="info" value="REPRINTED" />
      </template>
    </Column>

    <Column header="Print Count"
      field="DETAILS.PRCNT"
      filterField="DETAILS.PRCNT"
      sortable
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

    <Column header="Last Reprinted By"
      field="DETAILS.REPRBY"
      filterField="DETAILS.REPRBY"
      sortable
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

    <Column header="Last Reprinted Timestamp"
      field="EXTRA.TIMESTAMP_REPRINT"
      filterField="EXTRA.TIMESTAMP_REPRINT"
      sortable
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search'"
        />
      </template>
    </Column>

    <Column header="Run By"
      field="DETAILS.RUNBY"
      filterField="DETAILS.RUNBY"
      sortable
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

    <Column header="Run Timestamp"
      field="EXTRA.TIMESTAMP_PRINT"
      filterField="EXTRA.TIMESTAMP_PRINT"
      sortable
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          size="small"
          @input="filterCallback()"
          :placeholder="'Search'"
        />
      </template>
    </Column>

    <Column header="Status"
      field="DETAILS.STATUS"
      filterField="DETAILS.STATUS"
      sortable
    >
      <template #filter="{ filterModel, filterCallback }">
        <Select
          v-model="filterModel.value"
          @change="filterCallback()"
          :options="printStore.DOCUMENT_STATUSES"
          option-value="value"
          option-label="name"
          placeholder="Select One"
          size="small"
          class="text-xs"
          showClear
        />
      </template>
      <template #body="{ data }">
        <Tag v-if="data.DETAILS.STATUS === 'D'" severity="danger" value="DELETED" />
        <Tag v-else-if="data.DETAILS.STATUS === 'C'" severity="contrast" value="CANCELLED" />
      </template>
    </Column>
  </DataTable>
</template>
