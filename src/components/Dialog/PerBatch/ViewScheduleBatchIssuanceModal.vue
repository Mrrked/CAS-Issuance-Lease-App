<script lang="ts" setup>
  import { usePerBatchRunStore } from '../../../store/usePerBatchRunStore';
  import { useUtilitiesStore } from '../../../store/useUtilitiesStore';

  const perBatchRunStore = usePerBatchRunStore()
  const utilStore = useUtilitiesStore()
</script>


<template>
  <div class="max-h-[26rem] ">
    <DataTable
      :value="perBatchRunStore.getFirstBusinessDayPerMonth"
      dataKey="id"
      scrollable
      size="small"
      resizableColumns
      stripedRows
    >
      <template #empty> No business days found. </template>

      <Column header="" field="position" style="width: 20px;">
        <template #body="{ data }">
          <Tag
            v-if="data.position === 0"
            value="CURRENT"
            severity="primary"
            size="small"
          />
          <Tag
            v-else-if="data.position === 1 && perBatchRunStore.getNextSchedule?.MONTH === data.MONTH && perBatchRunStore.getNextSchedule?.YEAR === data.YEAR"
            value="NEXT"
            severity="success"
            size="small"
          />
        </template>
      </Column>

      <Column header="Year" field="YEAR" >
        <template #body="{ data }">
          <span :class="[{'font-bold text-primary': data.position === 0}]">
            {{ data.YEAR }}
          </span>
        </template>
      </Column>

      <Column header="Month" field="MONTH" >
        <template #body="{ data }">
          <span :class="[{'font-bold text-primary': data.position === 0}]">
            {{ data.MONTH }}
          </span>
        </template>
      </Column>

      <Column header="First Business Day" field="EARLIEST_CWORK_DATE" >
        <template #body="{ data }">
          <span :class="[{'font-bold text-primary': data.position === 0}]">
            {{ data.EARLIEST_CWORK_DATE ? utilStore.formatDateNumberToStringMONTHDDYYYY(data.EARLIEST_CWORK_DATE) : '-' }}
          </span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>