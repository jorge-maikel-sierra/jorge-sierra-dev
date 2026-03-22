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
    class="py-12 sm:py-18 px-6 border-t border-zinc-900/80 bg-gradient-to-b from-transparent to-zinc-950"
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

          <!-- Redesigned Form Card -->
          <div class="lg:col-span-7">
            <div class="relative group">
              <!-- Decorative background glow behind the card -->
              <div
                class="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/10 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"
              />

              <div
                class="relative bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-2xl overflow-hidden"
              >
                <!-- Subtle top edge highlight -->
                <div
                  class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent"
                />

                <h4 class="text-3xl font-bold text-white mb-2 tracking-tight">
                  Déjame un mensaje directo
                </h4>
                <p class="text-zinc-500 mb-10 text-base">
                  Cuéntame sobre tu idea y hagámosla realidad.
                </p>

                <form class="space-y-8" @submit.prevent="submitForm">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <UFormField
                      label="Nombre completo"
                      class="text-zinc-400 text-sm font-medium uppercase tracking-widest"
                    >
                      <UInput
                        v-model="form.name"
                        placeholder="Ej. John Doe"
                        size="xl"
                        icon="i-lucide-user"
                        required
                        class="mt-2 w-full transition-all duration-300 focus-within:scale-[1.01]"
                        variant="subtle"
                        color="primary"
                      />
                    </UFormField>

                    <UFormField
                      label="Empresa (Opcional)"
                      class="text-zinc-400 text-sm font-medium uppercase tracking-widest"
                    >
                      <UInput
                        v-model="form.company"
                        placeholder="Ej. Acme Corp"
                        size="xl"
                        icon="i-lucide-building-2"
                        class="mt-2 w-full transition-all duration-300 focus-within:scale-[1.01]"
                        variant="subtle"
                        color="neutral"
                      />
                    </UFormField>
                  </div>

                  <UFormField
                    label="Mensaje"
                    class="text-zinc-400 text-sm font-medium uppercase tracking-widest"
                  >
                    <UTextarea
                      v-model="form.message"
                      placeholder="Cuéntame brevemente sobre tu proyecto o el problema que deseas resolver..."
                      :rows="6"
                      size="xl"
                      required
                      class="mt-2 w-full transition-all duration-300 focus-within:scale-[1.005]"
                      variant="subtle"
                      color="primary"
                    />
                  </UFormField>

                  <div class="pt-4">
                    <UButton
                      type="submit"
                      size="xl"
                      color="primary"
                      class="w-full flex justify-center font-bold text-base py-5 rounded-2xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                      :loading="isLoading"
                      trailing-icon="i-lucide-send"
                    >
                      Enviar Mensaje
                    </UButton>
                    <p class="text-center text-xs text-zinc-600 mt-6 tracking-wide uppercase">
                      Respondemos usualmente en menos de 24 horas.
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </section>
</template>
