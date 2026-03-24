import MDEditor from '@uiw/react-md-editor/nohighlight'
import { storeQueryMarkdownPreviewOptions } from './store-query-markdown-preview-options'
import { cn } from '@/lib/utils'

type StoreQueryMarkdownProps = {
  readonly source: string
  readonly className?: string
}

const markdownClassName = cn(
  'wmde-markdown-var bg-transparent text-sm leading-6',
  '[&_h1]:text-base [&_h1]:leading-6',
  '[&_h2]:text-base [&_h2]:leading-6',
  '[&_h3]:text-sm [&_h3]:leading-6',
  '[&_h4]:text-sm [&_h4]:leading-6',
  '[&_p]:text-sm [&_p]:leading-6',
  '[&_li]:text-sm [&_li]:leading-6',
  '[&_table]:text-sm',
  '[&_pre]:text-xs',
)

export const StoreQueryMarkdown = ({
  source,
  className,
}: StoreQueryMarkdownProps) => {
  if (!source.trim()) {
    return null
  }

  return (
    <div className="min-w-0">
      <MDEditor.Markdown
        source={source}
        className={cn(markdownClassName, className)}
        {...storeQueryMarkdownPreviewOptions}
      />
    </div>
  )
}
