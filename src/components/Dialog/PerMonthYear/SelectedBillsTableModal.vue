<script lang="ts" setup>
  import Column from 'primevue/column';
  import Button from 'primevue/button';
  import { inject, onMounted, ref, Ref } from 'vue';
  import { FilterMatchMode } from '@primevue/core/api';
  import DataTable, { DataTableRowSelectEvent } from 'primevue/datatable';
  import { useConfigStore } from '../../../store/useConfigStore';

  interface DialogRef  {
    data: {
      table_data: any[],
      table_column: any[],
      view: Function
      view1: Function
      submit: Function
      cancel: Function
    },
  }

  const configStore = useConfigStore()

  const dialogRef = inject<Ref<DialogRef> | null>("dialogRef", null);
  const table_data = ref();
  const table_column = ref();


  const bills_dt = ref();

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const exportCSV = () => {
    bills_dt.value.exportCSV();
  };

  onMounted(() => {
    if (dialogRef && dialogRef.value) {
      table_data.value = dialogRef.value.data.table_data
      table_column.value = dialogRef.value.data.table_column
    }
  });

  const onRowSelect = (event: DataTableRowSelectEvent) => {
    if (dialogRef) {
      dialogRef.value.data.view(event.data)
    }
    event.originalEvent.preventDefault();
    return;
  };

</script>


<template>
  <DataTable
    :value="table_data"
    v-model:filters="filters"
    ref="bills_dt"
    selectionMode="single"
    stripedRows
    paginator
    :size="'small'"
    :rows="15"
    :rowsPerPageOptions="[15, 30, 50]"
    tableStyle="min-width: 50rem"
    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
    currentPageReportTemplate="{first} to {last} of {totalRecords}"
    scrollable
    resizableColumns
    class="w-full"
    @rowSelect="onRowSelect"
  >
    <!-- COLUMNS -->
    <template v-for="col of table_column" :key="col.field">
      <Column
        :field="col.field"
        :header="col.header"
      >
        <template #body="slotProps">
          <div v-if="col.header === 'Bill Type'">
            <span
              class="pr-3 whitespace-pre"
              v-tooltip.right="{
                value: slotProps.data['BDESC'] ,
              }"
            >
              {{ slotProps.data[col.field] ? configStore.fillNumberWithZeroes(slotProps.data[col.field], 2) + '  /  ' + slotProps.data['BDESC'] : '-' }}
            </span>
          </div>
          <div v-else-if="['Billing Amount', 'Amount Due', 'VAT Sales', 'Zero-Rated', 'VAT Exempt', 'Govt. Tax', 'VAT', 'Withholding Tax'].includes(col.header)">
            {{ slotProps.data[col.field] ? configStore.formatFloatNumber1(slotProps.data[col.field]) : '-' }}
          </div>
          <div v-else-if="['Due Date'].includes(col.header)">
            {{ slotProps.data[col.field] ? configStore.formatDate2(slotProps.data[col.field]) : '-' }}
          </div>
          <div v-else-if="col.header === ''">
            <svg v-if="slotProps.data[col.field] === 1" class="w-6 h-6 text-primary-light" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd"/>
            </svg>
            <svg v-else-if="slotProps.data[col.field] === 0" class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div v-else-if="col.header === 'PBL'" class="whitespace-pre">
            {{ slotProps.data[col.field] || '-' }}
          </div>
          <div v-else>
            {{ slotProps.data[col.field] || '-' }}
          </div>
        </template>
      </Column>
    </template>

    <!-- FOOTER -->
    <template #paginatorstart>
      <Button @click="exportCSV" type="button" icon="pi pi-download" :size="'small'" text />
    </template>
  </DataTable>
</template>