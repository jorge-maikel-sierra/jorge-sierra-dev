<script setup lang="ts">
// ProjectsSection — grid de proyectos cargados desde GitHub

const config = useRuntimeConfig()
const visibleCount = ref(3)
const resolvedTitles = reactive<Record<string, string>>({})

interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  topics?: string[]
  language: string | null
  homepage: string | null
  html_url: string
  stargazers_count?: number
  forks_count?: number
  updated_at: string
  fork: boolean
}

export interface DisplayProject {
  title: string
  full_name: string
  description: string
  tags: string[]
  url: string
  repo: string
  image: string | null
  stars: number
  forks: number
  language?: string | null
  updatedAt: string
}

const { data: repos, status } = await useFetch(
  `https://api.github.com/users/${config.public.githubUsername}/repos`,
  {
    query: {
      sort: 'updated',
      per_page: 100
    },
    transform: (data: unknown) => {
      return (data as GitHubRepo[])
        .filter((repo) => !repo.fork)
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .map((repo) => ({
          title: repo.name,
          full_name: repo.full_name,
          description: repo.description || 'Sin descripción disponible.',
          tags:
            repo.topics && repo.topics.length > 0
              ? repo.topics
              : repo.language
                ? [repo.language]
                : [],
          url: repo.homepage || repo.html_url,
          repo: repo.html_url,
          image: null,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          language: repo.language || undefined,
          updatedAt: repo.updated_at
        }))
    }
  }
)

const items = computed(() => {
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
    const res = await fetch(`/api/readme/${fullName}`)
    if (res.status === 403) {
      console.warn(`GitHub API Rate limit hit for README: ${fullName}`)
      return
    }
    if (!res.ok) return

    const text = await res.text()
    const match = text.match(/^#\s+(.*)/m)
    if (match && match[1]) {
      resolvedTitles[fullName] = match[1].trim()
    }
  } catch {
    // Silent fail for non-critical title enrichment
  }
}

watch(
  displayItems,
  (newItems) => {
    newItems.forEach((item: DisplayProject) => {
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
  <section id="proyectos" class="pt-10 px-6">
    <UContainer>
      <div
        class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4 border-b border-zinc-900 pb-8"
      >
        <div>
          <h2 class="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Portafolio
          </h2>
          <h3 class="text-4xl font-bold tracking-tight text-white mb-4">Proyectos destacados</h3>
          <p class="text-zinc-400 text-lg max-w-2xl">
            Una selección de mis proyectos más recientes y experimentos de código abierto.
          </p>
        </div>
      </div>

      <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-64 rounded-xl bg-zinc-900/50 border border-zinc-800 animate-pulse"
        />
      </div>

      <div
        v-else-if="status === 'error' || !items.length"
        class="text-center py-16 border border-dashed border-zinc-800 bg-zinc-900/20 rounded-2xl"
      >
        <UIcon
          name="i-lucide-alert-circle"
          class="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-20"
        />
        <p class="text-muted-foreground">
          No se pudieron cargar los proyectos de GitHub en este momento.
          <br />
          <span class="text-xs uppercase tracking-widest opacity-50"
            >Consulta el límite de la API o verifica tu conexión</span
          >
        </p>
      </div>

      <div v-else>
        <TransitionGroup
          name="project-list"
          tag="div"
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <ProjectCard v-for="project in displayItems" :key="project.title" v-bind="project" />
        </TransitionGroup>
      </div>

      <div v-if="hasMore" class="mt-12 text-center">
        <UButton size="lg" color="neutral" variant="outline" icon="i-lucide-plus" @click="loadMore">
          Ver más proyectos
        </UButton>
      </div>
    </UContainer>
  </section>
</template>

<style scoped>
.project-list-enter-active,
.project-list-leave-active {
  transition: all 0.5s ease;
}
.project-list-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.project-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
