<script setup lang="ts">
// ProjectCard — tarjeta de proyecto individual
// Reutilizable: recibe datos vía props, no tiene estado propio
import type { Project } from '~/types/project'

const props = defineProps<Project>()
</script>

<template>
  <UCard class="flex flex-col h-full">
    <template #header>
      <img
        v-if="props.image"
        :src="props.image"
        :alt="props.title"
        class="w-full h-48 object-cover rounded-t-lg"
      />
    </template>

    <div class="flex-1">
      <h3 class="text-lg font-semibold mb-2">
        {{ props.title }}
      </h3>
      <p class="text-muted text-sm mb-4">
        {{ props.description }}
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge v-for="tag in props.tags" :key="tag" :label="tag" variant="subtle" size="sm" />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <UButton
          v-if="props.url"
          :to="props.url"
          target="_blank"
          size="sm"
          trailing-icon="i-lucide-external-link"
        >
          Ver proyecto
        </UButton>
        <UButton
          v-if="props.repo"
          :to="props.repo"
          target="_blank"
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-simple-icons-github"
        >
          Repo
        </UButton>
      </div>
    </template>
  </UCard>
</template>
