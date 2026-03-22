<script setup lang="ts">
// ProjectsSection — grid de proyectos cargados desde GitHub
import type { Project } from '~/types/project'

const props = defineProps<{
  projects?: Project[]
}>()

const config = useRuntimeConfig()
const visibleCount = ref(3)
const resolvedTitles = reactive<Record<string, string>>({})

const { data: repos, status } = await useFetch<any[]>(
  `https://api.github.com/users/${config.public.githubUsername}/repos`,
  {
    query: {
      sort: 'updated',
      per_page: 100
    },
    transform: (data) => {
      return data
        .filter((repo: any) => !repo.fork)
        .sort((a: any, b: any) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .map((repo: any) => ({
          title: repo.name,
          full_name: repo.full_name,
          description: repo.description || 'Sin descripción disponible.',
          tags: repo.language ? [repo.language] : [],
          url: repo.homepage || repo.html_url,
          repo: repo.html_url,
          image: null
        }))
    }
  }
)

const items = computed(() => {
  if (props.projects) return props.projects
  return (repos.value || []).map((item) => ({
    ...item,
    title: resolvedTitles[item.full_name] || item.title
  }))
})

const displayItems = computed(() => items.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < items.value.length)

const fetchReadmeTitle = async (fullName: string) => {
  if (resolvedTitles[fullName]) return

  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
      headers: {
        Accept: 'application/vnd.github.v3.raw'
      }
    })
    if (!res.ok) return

    const text = await res.text()
    const match = text.match(/^#\s+(.*)/m)
    if (match && match[1]) {
      resolvedTitles[fullName] = match[1].trim()
    }
  } catch (e) {
    console.error(`Error fetching README for ${fullName}:`, e)
  }
}

watch(
  displayItems,
  (newItems) => {
    newItems.forEach((item: any) => {
      if (item.full_name) {
        fetchReadmeTitle(item.full_name)
      }
    })
  },
  { immediate: true }
)

const loadMore = () => {
  visibleCount.value += 3
}
</script>

<template>
  <section id="projects" class="py-20 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <h2 class="text-3xl font-bold mb-4">Proyectos</h2>
          <p class="text-muted-foreground">
            Una selección de mis proyectos y experimentos de código abierto.
          </p>
        </div>
      </div>

      <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard v-for="project in displayItems" :key="project.title" v-bind="project" />
      </div>

      <div v-if="hasMore" class="mt-12 text-center">
        <UButton size="lg" color="neutral" variant="outline" icon="i-lucide-plus" @click="loadMore">
          Ver más proyectos
        </UButton>
      </div>
    </div>
  </section>
</template>
