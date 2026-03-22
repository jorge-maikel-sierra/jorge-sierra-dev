<script setup lang="ts">
const config = useRuntimeConfig()
const form = reactive({
  name: '',
  company: '',
  message: ''
})

const isLoading = ref(false)

// Configurar con variable de entorno real en el futuro
const wppNumber = '1234567890'
const wppMessage = 'Hola Jorge, me interesa hablar sobre un proyecto.'
const whatsappUrl = computed(
  () => `https://wa.me/${wppNumber}?text=${encodeURIComponent(wppMessage)}`
)

const submitForm = async () => {
  isLoading.value = true
  // Simulación de envío
  setTimeout(() => {
    isLoading.value = false
    alert('¡Mensaje enviado correctamente! (Simulación). Te contactaré lo antes posible.')
    form.name = ''
    form.company = ''
    form.message = ''
  }, 1000)
}
</script>

<template>
  <section
    id="contacto"
    class="py-24 px-6 border-t border-zinc-900/80 bg-gradient-to-b from-transparent to-zinc-950"
  >
    <UContainer>
      <div class="max-w-5xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <!-- Contact Info & CTAs -->
          <div class="lg:col-span-5 flex flex-col justify-center">
            <h2 class="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
              Conversemos
            </h2>
            <h3 class="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
              Iniciemos tu próximo gran proyecto.
            </h3>
            <p class="text-zinc-400 text-lg mb-10 leading-relaxed font-light">
              La comunicación rápida es clave. Escríbeme a WhatsApp para obtener una respuesta casi
              inmediata, o envíame un correo si prefieres detallar tu idea.
            </p>

            <div class="space-y-4">
              <UButton
                :to="whatsappUrl"
                target="_blank"
                size="xl"
                color="primary"
                class="w-full flex justify-center text-base font-bold shadow-[0_0_20px_rgba(248,96,20,0.15)] hover:shadow-[0_0_30px_rgba(248,96,20,0.3)] transition-shadow py-4"
                icon="i-simple-icons-whatsapp"
              >
                Escríbeme por WhatsApp
              </UButton>

              <UButton
                :to="`mailto:${config.public.contactEmail}`"
                size="xl"
                color="neutral"
                variant="outline"
                class="w-full flex justify-center text-base font-medium py-4 bg-zinc-900/30"
                icon="i-lucide-mail"
              >
                Enviar correo electrónico
              </UButton>
            </div>
          </div>

          <!-- Simple Form -->
          <div class="lg:col-span-7">
            <div
              class="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-sm"
            >
              <h4 class="text-2xl font-bold text-white mb-8 tracking-tight">
                Déjame un mensaje directo
              </h4>
              <form class="space-y-6" @submit.prevent="submitForm">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <UFormGroup label="Nombre completo" class="text-zinc-300 font-medium">
                    <UInput
                      v-model="form.name"
                      placeholder="Ej. John Doe"
                      size="lg"
                      required
                      class="mt-1"
                    />
                  </UFormGroup>
                  <UFormGroup label="Empresa (Opcional)" class="text-zinc-300 font-medium">
                    <UInput
                      v-model="form.company"
                      placeholder="Ej. Acme Corp"
                      size="lg"
                      class="mt-1"
                    />
                  </UFormGroup>
                </div>

                <UFormGroup label="Mensaje" class="text-zinc-300 font-medium">
                  <UTextarea
                    v-model="form.message"
                    placeholder="Cuéntame brevemente sobre tu proyecto o el problema que deseas resolver..."
                    :rows="5"
                    size="lg"
                    required
                    class="mt-1"
                  />
                </UFormGroup>

                <UButton
                  type="submit"
                  size="xl"
                  color="neutral"
                  class="w-full flex justify-center font-bold text-zinc-950 bg-white py-4 mt-8 hover:bg-zinc-200 transition-colors"
                  :loading="isLoading"
                >
                  Enviar Mensaje
                </UButton>
              </form>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
