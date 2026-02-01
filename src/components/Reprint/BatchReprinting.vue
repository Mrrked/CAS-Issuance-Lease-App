<script lang="ts" setup>
  import DataTable from 'primevue/datatable';
  import { FilterMatchMode } from '@primevue/core/api';
  import { onMounted, ref } from 'vue';
  import { useUtilitiesStore } from '../../store/useUtilitiesStore';
  import { useBatchPrintingStore } from '../../store/useBatchPrintingStore';
  import { useMainStore } from '../../store/useMainStore';

  const mainStore = useMainStore()
  const utilStore = useUtilitiesStore()
  const batchPrintingStore = useBatchPrintingStore()

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'INVOICE_KEY.INVOICE_NAME': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'INVOICE_KEY.INVOICE_NUMBER': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.DATVAL': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.COMPCD': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.PBLKEY': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.CLTNME': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.CLTTIN': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'DETAILS.RUNBY': { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  onMounted(() => {
    batchPrintingStore.handleActionReset()
  })
</script>

<template>
  <!-- MAIN DATATABLE -->
  <div class="flex flex-col h-full">
    <DataTable
      :value="batchPrintingStore.issued_documents_data"
      dataKey="INVOICE_KEY.INVOICE_NUMBER"
      v-model:selection="batchPrintingStore.selectedIssuedDocuments"

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
      class="w-full h-full text-xs"
    >
      <!-- HEADER -->
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div class="flex gap-4">
            <Select
              v-model="batchPrintingStore.batchPrintingForm.group"
              :options="batchPrintingStore.GROUP_OPTIONS"
              placeholder="Select Group"
              class="min-w-40"
            ></Select>
            <Select
              ref="indexRef"
              v-model="batchPrintingStore.batchPrintingForm.company"
              :options="mainStore.getCompanyCodeOptions"
              optionLabel="option_name"
              placeholder="Select Company"
              class="min-w-40 w-60"
              showClear
            ></Select>
            <Button
              @click="batchPrintingStore.handleActionSearch"
              icon="pi pi-search"
              size="small"
              type="button"
              severity="primary"
              label="SEARCH"
            />
            <Button
              @click="batchPrintingStore.handleActionReset"
              icon="pi pi-times"
              size="small"
              type="button"
              severity="warn"
              label="RESET"
              v-if="batchPrintingStore.issued_documents_data.length > 0"
            />
          </div>
          <Button
            @click="batchPrintingStore.handleActionPrintSelectedInvoices"
            icon="pi pi-print"
            size="small"
            type="button"
            severity="primary"
            :label="'PRINT (' + batchPrintingStore.selectedIssuedDocuments.length + ')'"
            :disabled="!batchPrintingStore.selectedIssuedDocuments.length"
            class="w-44"
          />
        </div>
      </template>

      <template #empty> No issued documents found. </template>

      <Column selectionMode="multiple" selectAll headerStyle="width: 3rem"></Column>

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
            :placeholder="'Search'"
            class="w-24"
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
            :placeholder="'Search'"
            class="w-24"
          />
        </template>
      </Column>

      <Column header="Company"
        field="DETAILS.COMPCD"
        filterField="DETAILS.COMPCD"
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
        <template #body="{ data }">
          {{ data.DETAILS.COMPCD }}
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
            :placeholder="'Search'"
            class="w-20"
          />
        </template>
        <template #body="{ data }">
          {{ data.DETAILS.DATVAL ? utilStore.formatDateNumberToStringYYYYMMDD(data.DETAILS.DATVAL) : '-' }}
        </template>
      </Column>

      <Column header="PBL"
        field="DETAILS.PBLKEY"
        filterField="DETAILS.PBLKEY"
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
        <template #body="{ data }">
          {{ data.DETAILS.PBLKEY }}
        </template>
      </Column>

      <Column header="Client Name"
        field="DETAILS.CLTNME"
        filterField="DETAILS.CLTNME"
        sortable
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Client Name'"
          />
        </template>
        <template #body="{ data }">
          {{ data.DETAILS.CLTNME }}
        </template>
      </Column>

      <Column header="Client TIN"
        field="DETAILS.CLTTIN"
        filterField="DETAILS.CLTTIN"
        sortable
      >
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            size="small"
            @input="filterCallback()"
            :placeholder="'Search by Client TIN'"
          />
        </template>
        <template #body="{ data }">
          {{ data.DETAILS.CLTTIN }}
        </template>
      </Column>

      <Column header="Issued By"
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
        <template #body="{ data }">
          {{ data.DETAILS.RUNBY }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>
