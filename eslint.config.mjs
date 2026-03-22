// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt()
  // Disable all Vue formatting rules that conflict with Prettier.
  // Prettier is the single source of truth for code formatting.
  .override('nuxt/vue/rules', {
    rules: {
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/html-closing-bracket-spacing': 'off'
    }
  })
  // Disable @stylistic rules that may still be included via transitive configs
  .append({
    rules: {
      '@stylistic/arrow-parens': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/no-trailing-spaces': 'off',
      '@stylistic/semi': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/brace-style': 'off',
      '@stylistic/quote-props': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/space-infix-ops': 'off',
      '@stylistic/padded-blocks': 'off'
    }
  })
