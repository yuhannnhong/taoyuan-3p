<template>
  <div v-if="visible" class="fixed inset-0 bg-bg/90 flex items-center justify-center z-50 p-8">
    <div class="game-panel max-w-sm w-full">
      <h2 class="text-accent text-sm mb-3">世界已更新</h2>
      <p class="text-xs text-muted mb-4">
        有人在你操作時更新了世界存檔。<br />
        你的變更無法儲存，需要重新載入最新狀態。
      </p>
      <div class="flex gap-2">
        <Button class="flex-1" @click="emit('reload')">重新載入</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import Button from '@/components/game/Button.vue'

  defineProps<{ visible: boolean }>()
  const emit = defineEmits<{ reload: [] }>()
</script>
