import rehypeSanitize from 'rehype-sanitize'

export const storeQueryMarkdownPreviewOptions = {
  rehypePlugins: [rehypeSanitize],
  wrapperElement: {
    'data-color-mode': 'light' as const,
  },
}
