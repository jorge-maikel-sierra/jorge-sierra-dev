// GLSL files are imported as strings (turbopack.rules in next.config.ts).
declare module "*.glsl" {
  const source: string;
  export default source;
}
