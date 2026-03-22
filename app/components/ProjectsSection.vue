<script setup lang="ts">
// ProjectsSection — grid de proyectos destacados
// Consume ProjectCard; datos inyectados vía props o desde @nuxt/content

interface Project {
  title: string
  description: string
  url?: string
  repo?: string
  tags: string[]
  image?: string
}

const props = defineProps<{
  projects?: Project[]
}>()

const defaultProjects: Project[] = [
  {
    title: 'Proyecto ejemplo',
    description: 'Descripción breve del proyecto y su impacto.',
    tags: ['Nuxt', 'TypeScript'],
    url: '#'
  }
]

const items = computed(() => props.projects ?? defaultProjects)
</script>

<template>
  <section
    id="projects"
    class="py-20 px-6"
  >
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold mb-4">
        Proyectos
      </h2>
      <p class="text-muted mb-12">
        Selección de proyectos representativos.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard
          v-for="project in items"
          :key="project.title"
          v-bind="project"
        />
      </div>
    </div>
  </section>
</template>
