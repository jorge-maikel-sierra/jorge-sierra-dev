<script setup lang="ts">
const config = useRuntimeConfig()

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Jorge Sierra',
  url: config.public.siteUrl,
  jobTitle: 'Software Engineer & Full-Stack Developer',
  description: 'Ingeniero de software especializado en el desarrollo de aplicaciones web de alto impacto con tecnologías modernas.',
  image: `${config.public.siteUrl}/hero.png`,
  sameAs: [
    `https://github.com/${config.public.githubUsername}`,
    config.public.linkedinUrl
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Colombia',
    addressCountry: 'CO'
  }
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Jorge Sierra — Software Engineering',
  image: `${config.public.siteUrl}/logo_original.png`,
  '@id': `${config.public.siteUrl}/#service`,
  url: config.public.siteUrl,
  telephone: '',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Colombia',
    addressCountry: 'CO'
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday'
    ],
    opens: '09:00',
    closes: '18:00'
  },
  sameAs: [
    `https://github.com/${config.public.githubUsername}`,
    config.public.linkedinUrl
  ]
}

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(personSchema)
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(serviceSchema)
    }
  ]
})
</script>

<template>
  <div></div>
</template>
