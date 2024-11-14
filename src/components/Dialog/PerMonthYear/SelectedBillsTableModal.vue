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
          <div v-if="col.header === 'Project/Block/Lot'" class="whitespace-pre">
            {{ slotProps.data[col.field] || '-' }}
          </div>
          <div v-else-if="col.header === 'Temp. Client #'">
            {{ slotProps.data[col.field] || '-' }}
          </div>
          <div v-else-if="col.header === 'Client Name'">
            {{ slotProps.data['DETAILS'].CLTNME || '-' }}
          </div>
          <div v-else-if="col.header === 'Total Sales'">
            {{ slotProps.data['TOTAL_BREAKDOWN'] ? configStore.formatFloatNumber1(slotProps.data['TOTAL_BREAKDOWN'].TOTSAL) : '-' }}
          </div>
          <div v-else-if="col.header === 'Withholding Tax'">
            {{ slotProps.data['TOTAL_BREAKDOWN'] ? configStore.formatFloatNumber1(slotProps.data['TOTAL_BREAKDOWN'].PRDTAX) : '-' }}
          </div>
          <div v-else-if="col.header === 'Total Amount Due'">
            {{ slotProps.data['TOTAL_BREAKDOWN'] ? configStore.formatFloatNumber1(slotProps.data['TOTAL_BREAKDOWN'].AMTDUE) : '-' }}
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