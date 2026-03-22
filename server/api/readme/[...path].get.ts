export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  if (!path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Path is required'
    })
  }

  try {
    const response = await $fetch.raw(`https://api.github.com/repos/${path}/readme`, {
      headers: {
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'Nuxt-App'
      }
    })
    return response._data
  } catch (error: unknown) {
    // Return empty or error as needed without crashing
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      return ''
    }
    throw error
  }
})
