<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import { cn } from '@/utils/ui'

// reka-ui Tabs：Setting 弹窗竖排左列布局
export interface TabItem {
  value: string
  label: string
  icon?: unknown
}

defineProps<{
  items: TabItem[]
  orientation?: 'vertical' | 'horizontal'
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <TabsRoot v-model="model" :orientation="orientation ?? 'horizontal'">
    <slot name="list" :items="items">
      <TabsList :class="cn('flex gap-1', orientation === 'vertical' ? 'flex-col' : 'flex-row')">
        <TabsTrigger
          v-for="item in items"
          :key="item.value"
          :value="item.value"
          :class="
            cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 transition-colors',
              'data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900',
              'dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-gray-100 hover:text-gray-800 dark:text-gray-400',
            )
          "
        >
          <component :is="item.icon" v-if="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </TabsTrigger>
      </TabsList>
    </slot>
    <slot>
      <TabsContent v-for="item in items" :key="item.value" :value="item.value">
        <slot :name="`panel-${item.value}`" />
      </TabsContent>
    </slot>
  </TabsRoot>
</template>
