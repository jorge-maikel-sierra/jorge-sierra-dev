import type { getGPUTier as GetGPUTier } from "detect-gpu";

type Options = NonNullable<Parameters<typeof GetGPUTier>[0]>;
type LoadBenchmarks = NonNullable<NonNullable<Options["override"]>["loadBenchmarks"]>;

// Benchmarks come from the installed package (one lazy chunk per GPU family)
// instead of detect-gpu's default unpkg.com fetch: no third-party CDN at runtime.
const loadBenchmarks: LoadBenchmarks = async (file) => {
  const data: unknown[] = (await import(`detect-gpu/dist/benchmarks/${file}`)).default;
  // The first entry is the data version, as in detect-gpu's own loader.
  return data.slice(1) as Awaited<ReturnType<LoadBenchmarks>>;
};

// Software rasterizers render WebGL on the CPU. detect-gpu's blocklist misses
// current ANGLE strings ("ANGLE (Google, Vulkan … SwiftShader Device …)") and
// rates them tier 1, so they are caught here and sent to the static fallback.
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

export const isSoftwareRenderer = (gpu: string | undefined) =>
  !!gpu && SOFTWARE_RENDERER.test(gpu);

/** 0: no, blocklisted or software WebGL; 1: low end; 2–3: capable. Never throws. */
export async function detectGpuTier(): Promise<number> {
  try {
    const { getGPUTier } = await import("detect-gpu");
    const result = await getGPUTier({ override: { loadBenchmarks } });
    if (isSoftwareRenderer(result.gpu)) return 0;
    return result.tier;
  } catch {
    // Unknown GPU or failed lookup: assume a modest device, not a broken one.
    return 1;
  }
}
