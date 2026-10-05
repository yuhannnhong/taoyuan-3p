<template>
  <div>
    <h3 class="text-accent text-sm mb-3 flex items-center justify-between">
      <span>
        <component :is="familyStore.hasSpouses ? Heart : Home" :size="14" class="inline" />
        小屋
      </span>
      <button class="text-muted hover:text-accent transition-colors" @click="showCalendarModal = true">
        <Calendar :size="14" />
      </button>
    </h3>

    <!-- 农舍升级 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-1">
        <span class="text-sm text-accent">{{ homeStore.farmhouseName }}</span>
        <span class="text-xs text-muted">等级 {{ homeStore.farmhouseLevel }}</span>
      </div>
      <p class="text-xs text-muted mb-2">{{ currentBenefit }}</p>
      <div
        v-if="homeStore.nextUpgrade"
        class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
        @click="showUpgradeModal = true"
      >
        <span class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</span>
        <span class="text-xs text-accent whitespace-nowrap">{{ homeStore.nextUpgrade.cost }}文</span>
      </div>
    </div>

    <!-- 家人 -->
    <div v-if="familyStore.hasSpouses" class="border border-accent/20 rounded-xs p-3 mb-4">
      <p class="text-sm text-accent mb-2">
        <Users :size="14" class="inline" />
        家人
      </p>

      <!-- 家庭成員 -->
      <div v-for="sid in familyStore.spouses" :key="sid" class="border border-accent/10 rounded-xs p-2 mb-2">
        <div class="flex items-center justify-between">
          <span class="text-xs text-accent">{{ MEMBER_NAMES[sid] }}</span>
          <div class="flex items-center space-x-1.5">
            <Button
              v-if="!familyStore.hasKissedToday('han', sid, gameStore.day)"
              class="py-0 px-1"
              :icon="Heart"
              @click="handleKiss(sid)"
            >
              親親
            </Button>
            <span v-else class="text-[10px] text-muted">已親</span>
            <span class="text-[10px] text-danger">
              <Heart :size="10" class="inline" />
              伴侣
            </span>
          </div>
        </div>
      </div>

      <!-- 今日動態 -->
      <div v-if="todayActions.length > 0" class="border border-accent/10 rounded-xs p-2 mb-2">
        <p class="text-[10px] text-muted mb-1">今日動態</p>
        <p v-for="(entry, i) in todayActions" :key="i" class="text-xs">
          {{ MEMBER_NAMES[entry.actor] }} {{ entry.action }}
        </p>
      </div>

      <!-- 子女列表 -->
      <div v-if="npcStore.children.length > 0" class="flex flex-col space-y-1">
        <div v-for="child in npcStore.children" :key="child.id" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-accent">
              {{ child.name }}
              <span v-if="child.birthQuality === 'healthy'" class="text-[10px] text-success ml-0.5">[健康]</span>
              <span v-else-if="child.birthQuality === 'premature'" class="text-[10px] text-muted/60 ml-0.5">[早产]</span>
            </span>
            <div class="flex items-center space-x-1">
              <Button
                v-if="child.stage !== 'baby' && !child.interactedToday"
                class="py-0 px-1"
                :icon="Heart"
                @click="handleInteractChild(child.id)"
              >
                互动
              </Button>
              <span v-else-if="child.stage !== 'baby'" class="text-xs text-muted">已互动</span>
              <span v-else class="text-xs text-muted">还太小</span>
            </div>
          </div>
          <p class="text-[10px] text-muted mb-0.5">{{ CHILD_STAGE_NAMES[child.stage] }} · {{ child.daysOld }}天</p>
          <div v-if="child.stage !== 'baby'" class="flex items-center space-x-0.5">
            <Heart
              v-for="h in 10"
              :key="h"
              :size="10"
              class="flex-shrink-0"
              :class="child.friendship >= h * 30 ? 'text-danger' : 'text-muted/30'"
              :fill="child.friendship >= h * 30 ? 'currentColor' : 'none'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 雇工管理 -->
    <div class="border border-accent/20 rounded-xs p-3 mb-4">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Hammer :size="14" class="inline" />
          雇工
        </p>
        <Button v-if="currentHelpers.length < 2" class="py-0 px-1.5" :icon="UserPlus" :icon-size="12" @click="showHireModal = true">
          招募
        </Button>
      </div>
      <p class="text-xs text-muted mb-2">雇佣好感度≥4心的村民帮忙打理农场，每日支付工资。</p>

      <!-- 当前雇工 -->
      <div v-if="currentHelpers.length > 0" class="flex flex-col space-y-1 mb-2">
        <div
          v-for="h in currentHelpers"
          :key="h.npcId"
          class="flex items-center justify-between border border-accent/10 rounded-xs px-3 py-1.5"
        >
          <div>
            <span class="text-xs text-accent">{{ npcStore.getNpcDisplayName(h.npcId) }}</span>
            <span class="text-xs text-muted ml-1">{{ npcStore.HELPER_TASK_NAMES[h.task] }}</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="text-[10px] text-muted">{{ h.dailyWage }}文/天</span>
            <Button class="py-0 px-1 btn-danger" :icon="X" :icon-size="10" @click="dismissConfirmNpcId = h.npcId" />
          </div>
        </div>
      </div>
      <div v-if="currentHelpers.length === 0" class="flex flex-col items-center justify-center py-6 text-muted">
        <Hammer :size="32" class="mb-2" />
        <p class="text-xs">暂未雇佣</p>
      </div>
    </div>

    <!-- 酒窖 -->
    <div v-if="homeStore.hasCellar" class="border border-accent/20 rounded-xs p-3">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm text-accent">
          <Wine :size="14" class="inline" />
          酒窖·Lv.{{ homeStore.cellarLevel }}
          <span class="text-[10px] text-muted ml-1">（{{ homeStore.cellarSlots.length }}/{{ homeStore.cellarMaxSlots }}）</span>
        </p>
        <Button v-if="homeStore.nextCellarUpgrade" class="py-0 px-1" @click="showCellarUpgradeModal = true">
          <ArrowUp :size="12" class="inline" />
          升级
        </Button>
      </div>
      <div v-if="homeStore.cellarSlots.length > 0" class="flex flex-col space-y-1.5 mb-3">
        <div v-for="(slot, idx) in homeStore.cellarSlots" :key="idx" class="border border-accent/10 rounded-xs p-2">
          <div class="flex items-center justify-between mb-1">
            <div class="flex items-center space-x-1">
              <span class="text-xs text-accent">{{ getItemName(slot.itemId) }}</span>
              <span v-if="slot.upgradeCount >= 16" class="text-[10px] text-success">陈酿{{ Math.floor(slot.upgradeCount / 16) }}年</span>
            </div>
            <Button class="py-0 px-1" @click="removeAgingConfirmIdx = idx">取出</Button>
          </div>
          <div class="flex items-center justify-between mb-0.5">
            <span class="text-[10px] text-muted">已增值+{{ slot.addedValue }}文（提升{{ slot.upgradeCount }}次）</span>
          </div>
          <div class="flex items-center space-x-1">
            <span class="text-[10px] text-muted w-6">周期</span>
            <div class="flex-1 h-1.5 bg-bg rounded-xs border border-accent/10">
              <div
                class="h-full rounded-xs bg-accent transition-all"
                :style="{
                  width: Math.min(100, Math.floor((slot.daysAging / 7) * 100)) + '%'
                }"
              />
            </div>
            <span class="text-[10px] text-muted">{{ slot.daysAging }}/7天</span>
          </div>
        </div>
      </div>
      <div v-if="homeStore.cellarSlots.length === 0" class="flex flex-col items-center justify-center py-6 text-muted mb-3">
        <Wine :size="32" class="mb-2" />
        <p class="text-xs">酒窖空空如也</p>
      </div>

      <!-- 放入新酒 -->
      <Button
        class="w-full"
        v-if="homeStore.cellarSlots.length < homeStore.cellarMaxSlots && ageableInInventory.length > 0"
        @click="showAgingModal = true"
      >
        放入陈酿
      </Button>
    </div>

    <!-- 升级农舍弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showUpgradeModal && homeStore.nextUpgrade"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">升级农舍</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs">升级为「{{ homeStore.nextUpgrade.name }}」</p>
            <p class="text-xs text-muted mt-0.5">
              {{ homeStore.nextUpgrade.description }}
            </p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in homeStore.nextUpgrade.materialCost" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= homeStore.nextUpgrade.cost ? '' : 'text-danger'">
                {{ homeStore.nextUpgrade.cost }}文
              </span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUpgradeFarmhouse }"
            :disabled="!canUpgradeFarmhouse"
            :icon="ArrowUp"
            :icon-size="12"
            @click="handleUpgradeFromModal"
          >
            升级
          </Button>
        </div>
      </div>
    </Transition>

    <!-- 放入陈酿列表弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showAgingModal"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showAgingModal = false"
      >
        <div class="game-panel max-w-xs w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">放入陈酿</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="showAgingModal = false" />
          </div>
          <div class="flex flex-col space-y-1">
            <div
              v-for="item in ageableInInventory"
              :key="item.itemId + item.quality"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="handleStartAgingFromModal(item.itemId, item.quality)"
            >
              <span
                class="text-xs"
                :class="{
                  'text-quality-fine': item.quality === 'fine',
                  'text-quality-excellent': item.quality === 'excellent',
                  'text-quality-supreme': item.quality === 'supreme'
                }"
              >
                {{ getItemName(item.itemId) }}
              </span>
              <span class="text-xs text-muted">&times;{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <CalendarModal :open="showCalendarModal" @close="showCalendarModal = false" />

    <!-- 招募雇工弹窗 -->
    <Transition name="panel-fade">
      <div v-if="showHireModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="closeHireModal">
        <div class="game-panel max-w-sm w-full">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-accent">招募雇工</p>
            <Button class="py-0 px-1" :icon="X" :icon-size="12" @click="closeHireModal" />
          </div>

          <!-- 任务选择 -->
          <p class="text-xs text-muted mb-1">选择任务</p>
          <div class="grid grid-cols-3 gap-1 mb-2">
            <button
              v-for="(label, key) in npcStore.HELPER_TASK_NAMES"
              :key="key"
              class="text-xs py-1 rounded-xs border"
              :class="selectedHireTask === key ? 'border-accent text-accent' : 'border-accent/20 text-muted'"
              @click="selectHireTask(key as FarmHelperTask)"
            >
              {{ label }}
            </button>
          </div>
          <!-- 讲清这份活到底做什么，避免雇了之后看不出效果 -->
          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-[10px] text-muted leading-relaxed">
              {{ npcStore.HELPER_TASK_DESCRIPTIONS[selectedHireTask] }}
            </p>
            <p class="text-[10px] text-muted/60 mt-1">雇工在次日清晨自动干活，结果会写进当天日志。</p>
          </div>
          <p class="text-xs text-muted mb-2">日薪：{{ npcStore.HELPER_WAGES[selectedHireTask] }}文</p>

          <!-- 确认雇佣 -->
          <div v-if="hireConfirmNpc" class="border border-accent/30 rounded-xs p-3 mb-2">
            <p class="text-xs text-accent mb-2">
              确定雇佣
              <span class="text-text">{{ npcStore.getNpcDisplayName(hireConfirmNpc.id) }}</span>
              负责
              <span class="text-text">{{ npcStore.HELPER_TASK_NAMES[selectedHireTask] }}</span>
              吗？
            </p>
            <p class="text-[10px] text-muted mb-2">日薪：{{ npcStore.HELPER_WAGES[selectedHireTask] }}文</p>
            <div class="flex space-x-2">
              <Button class="py-0.5 px-2 text-xs" @click="handleHire(hireConfirmNpcId!)">确定</Button>
              <Button class="py-0.5 px-2 text-xs" @click="hireConfirmNpcId = null">取消</Button>
            </div>
          </div>

          <!-- 可雇佣NPC列表 -->
          <div v-else class="flex flex-col space-y-1 max-h-48 overflow-y-auto">
            <div
              v-for="npc in hireableNpcs"
              :key="npc.npcId"
              class="flex items-center justify-between border border-accent/20 rounded-xs px-3 py-1.5 cursor-pointer hover:bg-accent/5"
              @click="hireConfirmNpcId = npc.npcId"
            >
              <span class="text-xs">{{ npcStore.getNpcDisplayName(npc.npcId) }}</span>
              <span class="text-[10px] text-muted">
                <Heart :size="10" class="inline" />
                {{ Math.floor(npc.friendship / 250) }}心
              </span>
            </div>
          </div>
          <p v-if="!hireConfirmNpc && hireableNpcs.length === 0" class="text-xs text-muted text-center py-3">
            没有可雇佣的村民（需好感≥4心，且非伴侣/知己）
          </p>
        </div>
      </div>
    </Transition>

    <!-- 解雇确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="dismissConfirmNpcId"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="dismissConfirmNpcId = null"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-sm text-danger mb-3">确定解雇{{ npcStore.getNpcDisplayName(dismissConfirmNpcId) }}吗？</p>
          <p class="text-xs text-muted mb-4">解雇后需要重新招募。</p>
          <div class="flex space-x-3 justify-center">
            <Button @click="dismissConfirmNpcId = null">取消</Button>
            <Button class="btn-danger" @click="handleDismiss(dismissConfirmNpcId!)">确认解雇</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 取出陈酿确认弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="removeAgingConfirmSlot"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="removeAgingConfirmIdx = null"
      >
        <div class="game-panel max-w-xs w-full text-center">
          <p class="text-sm text-accent mb-3">确定取出{{ getItemName(removeAgingConfirmSlot.itemId) }}吗？</p>
          <p class="text-xs text-muted mb-2">
            已增值+{{ removeAgingConfirmSlot.addedValue }}文（提升{{ removeAgingConfirmSlot.upgradeCount }}次）
          </p>
          <p v-if="removeAgingConfirmSlot.upgradeCount >= 16" class="text-xs text-success mb-2">
            已成为陈酿{{ Math.floor(removeAgingConfirmSlot.upgradeCount / 16) }}年，取出将点亮图鉴！
          </p>
          <p v-if="removeAgingConfirmSlot.addedValue > 0" class="text-xs text-accent mb-4">
            取出时将获得{{ removeAgingConfirmSlot.addedValue }}文增值铜钱。
          </p>
          <p v-else class="text-xs text-muted mb-4">尚未增值，满7天可提升价值。</p>
          <div class="flex space-x-3 justify-center">
            <Button @click="removeAgingConfirmIdx = null">取消</Button>
            <Button @click="handleRemoveAging(removeAgingConfirmIdx!)">确认取出</Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 酒窖升级弹窗 -->
    <Transition name="panel-fade">
      <div
        v-if="showCellarUpgradeModal && homeStore.nextCellarUpgrade"
        class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        @click.self="showCellarUpgradeModal = false"
      >
        <div class="game-panel max-w-xs w-full relative">
          <button class="absolute top-2 right-2 text-muted hover:text-text" @click="showCellarUpgradeModal = false">
            <X :size="14" />
          </button>

          <p class="text-sm text-accent mb-2">升级酒窖</p>

          <div class="border border-accent/10 rounded-xs p-2 mb-2">
            <p class="text-xs">升级为「{{ homeStore.nextCellarUpgrade.name }}」</p>
            <p class="text-xs text-muted mt-0.5">
              每次增值{{ homeStore.nextCellarUpgrade.valuePerCycle }}文，最大容量{{ homeStore.nextCellarUpgrade.maxSlots }}个
            </p>
          </div>

          <div class="border border-accent/10 rounded-xs p-2 mb-2 space-y-1">
            <p class="text-xs text-muted mb-1">所需材料</p>
            <div v-for="mat in homeStore.nextCellarUpgrade.materialCost" :key="mat.itemId" class="flex items-center justify-between">
              <span class="text-xs text-muted">{{ getItemName(mat.itemId) }}</span>
              <span class="text-xs" :class="getCombinedItemCount(mat.itemId) >= mat.quantity ? '' : 'text-danger'">
                {{ getCombinedItemCount(mat.itemId) }}/{{ mat.quantity }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted">铜钱</span>
              <span class="text-xs" :class="playerStore.money >= homeStore.nextCellarUpgrade.cost ? '' : 'text-danger'">
                {{ homeStore.nextCellarUpgrade.cost }}文
              </span>
            </div>
          </div>

          <Button
            class="w-full justify-center"
            :class="{ '!bg-accent !text-bg': canUpgradeCellar }"
            :disabled="!canUpgradeCellar"
            :icon="ArrowUp"
            :icon-size="12"
            @click="handleUpgradeCellar"
          >
            升级
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ArrowUp, Calendar, Hammer, Home, Heart, UserPlus, Users, Wine, X } from 'lucide-vue-next'
  import { useGameStore } from '@/stores/useGameStore'
  import { useHomeStore } from '@/stores/useHomeStore'
  import { useInventoryStore } from '@/stores/useInventoryStore'
  import { useNpcStore } from '@/stores/useNpcStore'
  import { useFamilyStore, MEMBER_NAMES } from '@/stores/useFamilyStore'
  import type { MemberId } from '@/stores/useFamilyStore'
  import { useAchievementStore } from '@/stores/useAchievementStore'
  import { usePlayerStore } from '@/stores/usePlayerStore'
  import { getCombinedItemCount } from '@/composables/useCombinedInventory'
  import { getItemById, getNpcById } from '@/data'
  import { ACTION_TIME_COSTS } from '@/data/timeConstants'
  import type { Quality, ChildStage, FarmHelperTask } from '@/types'
  import { addLog } from '@/composables/useGameLog'
  import { handleEndDay } from '@/composables/useEndDay'
  import Button from '@/components/game/Button.vue'
  import CalendarModal from '@/components/game/CalendarModal.vue'

  const homeStore = useHomeStore()
  const inventoryStore = useInventoryStore()
  const gameStore = useGameStore()
  const npcStore = useNpcStore()
  const familyStore = useFamilyStore()
  const playerStore = usePlayerStore()

  const todayActions = computed(() => familyStore.getTodayActions(gameStore.day))

  const showUpgradeModal = ref(false)
  const showAgingModal = ref(false)
  const showCalendarModal = ref(false)
  const showHireModal = ref(false)
  const selectedHireTask = ref<FarmHelperTask>('water')
  const hireConfirmNpcId = ref<string | null>(null)
  const dismissConfirmNpcId = ref<string | null>(null)
  const removeAgingConfirmIdx = ref<number | null>(null)
  const showCellarUpgradeModal = ref(false)
  const removeAgingConfirmSlot = computed(() =>
    removeAgingConfirmIdx.value !== null ? (homeStore.cellarSlots[removeAgingConfirmIdx.value] ?? null) : null
  )

  const hireableNpcs = computed(() => npcStore.getHireableNpcs())
  const currentHelpers = computed(() => npcStore.hiredHelpers)
  const hireConfirmNpc = computed(() => (hireConfirmNpcId.value ? getNpcById(hireConfirmNpcId.value) : null))

  const handleHire = (npcId: string) => {
    const result = npcStore.hireHelper(npcId, selectedHireTask.value)
    addLog(result.message)
    if (result.success) {
      hireConfirmNpcId.value = null
      showHireModal.value = false
    }
  }

  const closeHireModal = () => {
    showHireModal.value = false
    hireConfirmNpcId.value = null
  }

  const selectHireTask = (task: FarmHelperTask) => {
    selectedHireTask.value = task
    hireConfirmNpcId.value = null
  }

  const handleDismiss = (npcId: string) => {
    const result = npcStore.dismissHelper(npcId)
    addLog(result.message)
    dismissConfirmNpcId.value = null
  }

  const CHILD_STAGE_NAMES: Record<ChildStage, string> = {
    baby: '婴儿',
    toddler: '幼儿',
    child: '孩童',
    teen: '少年'
  }

  const AGEABLE_ITEMS = ['watermelon_wine', 'osmanthus_wine', 'peach_wine', 'jujube_wine', 'corn_wine', 'rice_vinegar']

  const currentBenefit = computed(() => {
    switch (homeStore.farmhouseLevel) {
      case 0:
        return '简陋的茅屋。'
      case 1:
        return '厨房升级，烹饪恢复+20%。'
      case 2:
        return '宅院扩建，每晚额外恢复10%体力。'
      case 3:
        return '地下酒窖开放，可陈酿美酒提升品质。'
      default:
        return ''
    }
  })

  const canUpgradeFarmhouse = computed(() => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return false
    if (playerStore.money < upgrade.cost) return false
    return upgrade.materialCost.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const ageableInInventory = computed(() => {
    return inventoryStore.items.filter(inv => AGEABLE_ITEMS.includes(inv.itemId))
  })

  const getItemName = (itemId: string): string => {
    return getItemById(itemId)?.name ?? itemId
  }


  // === 操作处理 ===

  const handleUpgradeFromModal = () => {
    const upgrade = homeStore.nextUpgrade
    if (!upgrade) return
    if (homeStore.upgradeFarmhouse()) {
      addLog(`农舍升级为「${upgrade.name}」！${upgrade.description}`)
      showUpgradeModal.value = false
    } else {
      addLog('铜钱或材料不足，无法升级。')
    }
  }

  const handleKiss = (target: MemberId) => {
    const check = familyStore.canKiss('han', target)
    if (!check.ok) {
      addLog('無法進行這個互動。')
      return
    }
    if (familyStore.hasKissedToday('han', target, gameStore.day)) {
      addLog('今天已經親過了。')
      return
    }
    familyStore.recordKiss('han', target, gameStore.day)
    playerStore.stamina = Math.min(playerStore.stamina + 10, playerStore.maxStamina)
    familyStore.addAction('han', `親了${MEMBER_NAMES[target]}`, gameStore.day, gameStore.hour)
    addLog(`你親了${MEMBER_NAMES[target]}，體力恢復了一點。`)
  }

  const handleInteractChild = (childId: number) => {
    const result = npcStore.interactWithChild(childId)
    if (result) {
      addLog(result.message)
      if (result.item) {
        inventoryStore.addItem(result.item)
        const itemDef = getItemById(result.item)
        addLog(`获得了${itemDef?.name ?? result.item}！`)
      }
    }
  }


  const handleStartAgingFromModal = (itemId: string, quality: Quality) => {
    if (homeStore.startAging(itemId, quality)) {
      const name = getItemName(itemId)
      addLog(`将${name}放入酒窖陈酿。`)
      const tr = gameStore.advanceTime(ACTION_TIME_COSTS.aging)
      if (tr.message) addLog(tr.message)
      if (tr.passedOut) handleEndDay()
    } else {
      addLog('无法放入酒窖（已满或物品不可陈酿）。')
    }
    // 酒窖满或无剩余可陈酿物品时关闭弹窗
    if (homeStore.cellarSlots.length >= homeStore.cellarMaxSlots || ageableInInventory.value.length === 0) {
      showAgingModal.value = false
    }
  }

  const handleRemoveAging = (index: number) => {
    // 取出前先记录剩余天数
    const slotBeforeRemove = homeStore.cellarSlots[index]
    const remainingDays = slotBeforeRemove?.daysAging ?? 0
    const result = homeStore.removeAging(index)
    if (result) {
      inventoryStore.addItem(result.itemId, 1, result.quality)
      const name = getItemName(result.itemId)
      const totalDays = result.upgradeCount * 7 + remainingDays
      let msg = `从酒窖取出了${name}`
      if (result.addedValue > 0) {
        msg += `（陈酿${totalDays}天，增值+${result.addedValue}文）`
      }
      addLog(msg + '。')
      // 满1年点亮图鉴
      if (result.upgradeCount >= 16) {
        const achievementStore = useAchievementStore()
        achievementStore.discoverItem('aged_' + result.itemId)
        addLog(`点亮了${name}陈酿图鉴！`)
      }
    }
    removeAgingConfirmIdx.value = null
  }

  const canUpgradeCellar = computed(() => {
    const upgrade = homeStore.nextCellarUpgrade
    if (!upgrade) return false
    if (playerStore.money < upgrade.cost) return false
    return upgrade.materialCost.every(mat => getCombinedItemCount(mat.itemId) >= mat.quantity)
  })

  const handleUpgradeCellar = () => {
    const upgrade = homeStore.nextCellarUpgrade
    if (!upgrade) return
    if (homeStore.upgradeCellar()) {
      addLog(`酒窖升级为「${upgrade.name}」！每次增值${upgrade.valuePerCycle}文，最大容量${upgrade.maxSlots}个。`)
      showCellarUpgradeModal.value = false
    } else {
      addLog('铜钱或材料不足，无法升级酒窖。')
    }
  }
</script>
