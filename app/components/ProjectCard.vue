<script setup lang="ts">
import type { Project } from '~/types/project'

const props = defineProps<Project>()

const formatRelativeTime = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Hoy'
  if (diffInDays === 1) return 'Ayer'
  if (diffInDays < 30) return `Hace ${diffInDays} días`
  const months = Math.floor(diffInDays / 30)
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`
}

const getLanguageColor = (lang?: string) => {
  const colors: Record<string, string> = {
    Vue: '#42b883',
    TypeScript: '#3178c6',
    JavaScript: '#f7df1e',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3776ab',
    Go: '#00add8'
  }
  return colors[lang || ''] || '#8b949e'
}
</script>

<template>
  <UCard
    class="group flex flex-col h-full overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl dark:hover:shadow-primary/10 border-white/10 dark:border-white/5 backdrop-blur-sm bg-white/70 dark:bg-gray-900/70"
  >
    <div class="flex flex-col h-full p-1">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <span
            v-if="props.language"
            class="w-3 h-3 rounded-full shadow-sm"
            :style="{ backgroundColor: getLanguageColor(props.language) }"
          ></span>
          <span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {{ props.language || 'Code' }}
          </span>
        </div>

        <div class="flex items-center gap-3 text-xs font-medium text-muted-foreground">
          <div
            v-if="props.stars"
            class="flex items-center gap-1 group-hover:text-amber-400 transition-colors"
          >
            <UIcon name="i-lucide-star" class="w-3.5 h-3.5" />
            <span>{{ props.stars }}</span>
          </div>
          <div
            v-if="props.forks"
            class="flex items-center gap-1 group-hover:text-primary transition-colors"
          >
            <UIcon name="i-lucide-git-fork" class="w-3.5 h-3.5" />
            <span>{{ props.forks }}</span>
          </div>
        </div>
      </div>

      <div class="flex-1">
        <h3 class="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
          {{ props.title }}
        </h3>
        <p class="text-muted-foreground text-sm line-clamp-3 mb-6 leading-relaxed">
          {{ props.description }}
        </p>

        <div class="flex flex-wrap gap-1.5 mb-6">
          <UBadge
            v-for="tag in props.tags.slice(0, 5)"
            :key="tag"
            variant="subtle"
            size="sm"
            class="rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
          >
            {{ tag }}
          </UBadge>
        </div>
      </div>

      <div
        class="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between"
      >
        <div class="flex gap-2">
          <UButton
            v-if="props.url"
            :to="props.url"
            target="_blank"
            size="sm"
            color="primary"
            variant="ghost"
            class="px-3 hover:bg-primary/10"
            trailing-icon="i-lucide-arrow-up-right"
          >
            Demo
          </UButton>
          <UButton
            v-if="props.repo"
            :to="props.repo"
            target="_blank"
            size="sm"
            color="neutral"
            variant="ghost"
            class="px-3 hover:bg-neutral/10"
            icon="i-simple-icons-github"
          >
            Código
          </UButton>
        </div>

        <span class="text-[10px] text-muted-foreground/60 italic font-mono">
          {{ formatRelativeTime(props.updatedAt) }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
:deep(.u-card-body) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
