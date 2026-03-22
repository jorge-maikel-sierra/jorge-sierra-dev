<script setup lang="ts">
// ServiceCard — tarjeta de servicio individual
// CTA integrado para facilitar la conversión desde cada servicio

const props = defineProps<{
  icon: string
  title: string
  description: string
  cta?: string
  ctaUrl?: string
}>()
</script>

<template>
  <UCard class="flex flex-col h-full">
    <div class="flex-1">
      <UIcon
        :name="props.icon"
        class="text-primary w-8 h-8 mb-4"
      />
      <h3 class="text-lg font-semibold mb-2">
        {{ props.title }}
      </h3>
      <p class="text-muted text-sm">
        {{ props.description }}
      </p>
    </div>

    <template
      v-if="props.cta"
      #footer
    >
      <UButton
        :to="props.ctaUrl ?? '#contact'"
        size="sm"
        variant="outline"
        trailing-icon="i-lucide-arrow-right"
      >
        {{ props.cta }}
      </UButton>
    </template>
  </UCard>
</template>
