<template>
  <div v-if="recentActions.length" class="px-2 py-1 bg-accent/10 rounded text-xs text-muted flex items-center gap-1 overflow-hidden">
    <Users :size="12" class="flex-shrink-0 text-accent" />
    <span class="truncate">{{ latestLine }}</span>
    <button
      v-if="recentActions.length > 1"
      class="ml-auto text-accent hover:underline flex-shrink-0"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起' : `+${recentActions.length - 1}` }}
    </button>
  </div>
  <div v-if="expanded && recentActions.length > 1" class="px-2 pb-1 space-y-0.5">
    <p
      v-for="(entry, i) in recentActions.slice(1)"
      :key="i"
      class="text-xs text-muted truncate"
    >
      {{ formatEntry(entry) }}
    </p>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Users } from 'lucide-vue-next'
  import { useGameStore } from '@/stores/useGameStore'
  import { useFamilyStore, MEMBER_NAMES } from '@/stores/useFamilyStore'
  import type { ActionLogEntry } from '@/stores/useFamilyStore'

  const gameStore = useGameStore()
  const familyStore = useFamilyStore()
  const expanded = ref(false)

  const recentActions = computed(() => {
    return familyStore.getTodayActions(gameStore.day).slice().reverse()
  })

  const formatEntry = (entry: ActionLogEntry): string => {
    const name = MEMBER_NAMES[entry.actor] ?? entry.actor
    return `${name} ${entry.action}`
  }

  const latestLine = computed(() => {
    const first = recentActions.value[0]
    if (!first) return ''
    return formatEntry(first)
  })
</script>
