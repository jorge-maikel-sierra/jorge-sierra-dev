import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      name: 'blog',
      pattern: 'blog/**/*.md',
      type: 'page',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string().transform(str => new Date(str)),
        tags: z.array(z.string()).default([]),
        image: z.string().optional(),
        featured: z.boolean().default(false)
      })
    }),

    projects: defineCollection({
      name: 'projects',
      pattern: 'projects/**/*.md',
      type: 'page',
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.string().transform(str => new Date(str)),
        tags: z.array(z.string()).default([]),
        url: z.string().optional(),
        repo: z.string().optional(),
        image: z.string().optional(),
        featured: z.boolean().default(false)
      })
    })
  }
})
