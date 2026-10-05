import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCheatsStore = defineStore('cheats', () => {
  const infiniteGold = ref(true)

  function toggleInfiniteGold(actor: string): boolean {
    if (actor !== 'han') return false
    infiniteGold.value = !infiniteGold.value
    return true
  }

  const serialize = () => ({
    infiniteGold: infiniteGold.value,
  })

  const deserialize = (data: any) => {
    infiniteGold.value = data.infiniteGold ?? true
  }

  return {
    infiniteGold,
    toggleInfiniteGold,
    serialize,
    deserialize,
  }
})
