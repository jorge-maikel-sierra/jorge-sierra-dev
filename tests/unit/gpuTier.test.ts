import { describe, expect, it } from "vitest";
import { isSoftwareRenderer } from "@/components/hero/gpuTier";

describe("isSoftwareRenderer", () => {
  it("catches software rasterizers detect-gpu misses", () => {
    expect(
      isSoftwareRenderer(
        "angle (google, vulkan 1.3.0 (swiftshader device (llvm 10.0.0))) (ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device)))",
      ),
    ).toBe(true);
    expect(isSoftwareRenderer("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe(true);
    expect(isSoftwareRenderer("Microsoft Basic Render Driver")).toBe(true);
  });

  it("keeps real GPUs", () => {
    expect(isSoftwareRenderer("apple m1")).toBe(false);
    expect(isSoftwareRenderer("nvidia geforce rtx 3060")).toBe(false);
    expect(isSoftwareRenderer("intel iris xe graphics")).toBe(false);
    expect(isSoftwareRenderer(undefined)).toBe(false);
  });
});
