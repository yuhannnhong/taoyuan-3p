<template>
  <div v-if="displayLines.length" class="px-2 py-1 bg-accent/10 rounded text-xs text-muted flex items-center gap-1 overflow-hidden">
    <Users :size="12" class="flex-shrink-0 text-accent" />
    <span class="truncate">{{ displayLines[0] }}</span>
    <button
      v-if="displayLines.length > 1"
      class="ml-auto text-accent hover:underline flex-shrink-0"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起' : `+${displayLines.length - 1}` }}
    </button>
  </div>
  <div v-if="expanded && displayLines.length > 1" class="px-2 pb-1 space-y-0.5">
    <p
      v-for="(line, i) in displayLines.slice(1)"
      :key="i"
      class="text-xs text-muted truncate"
    >
      {{ line }}
    </p>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { Users } from 'lucide-vue-next'
  import { useGameStore } from '@/stores/useGameStore'
  import { useFamilyStore, MEMBER_NAMES } from '@/stores/useFamilyStore'
  import type { ActionLogEntry, MemberId } from '@/stores/useFamilyStore'

  const gameStore = useGameStore()
  const familyStore = useFamilyStore()
  const expanded = ref(false)

  const recentActions = computed(() => {
    return familyStore.getTodayActions(gameStore.day).slice().reverse()
  })

  const kissLine = computed((): string | null => {
    const kisses = familyStore.getTodayKisses(gameStore.day)
    if (!kisses.length) return null

    const parts: string[] = []
    for (const k of kisses) {
      const fromName = MEMBER_NAMES[k.from] ?? k.from
      const toName = k.to === 'han' ? '妳' : MEMBER_NAMES[k.to as MemberId] ?? k.to
      parts.push(`${fromName}親了${toName}`)
    }
    return `今天：${parts.join('、')}`
  })

  const formatEntry = (entry: ActionLogEntry): string => {
    const name = MEMBER_NAMES[entry.actor] ?? entry.actor
    return `${name} ${entry.action}`
  }

  const displayLines = computed(() => {
    const lines: string[] = []
    if (kissLine.value) lines.push(kissLine.value)
    for (const entry of recentActions.value) {
      if (entry.action.startsWith('親了')) continue
      lines.push(formatEntry(entry))
    }
    return lines
  })
</script>
