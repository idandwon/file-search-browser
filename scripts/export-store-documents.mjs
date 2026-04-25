import { ApiError, GoogleGenAI } from '@google/genai'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PAGE_SIZE = 20
const STORE_RESOURCE_PREFIX = 'fileSearchStores/'
const DEFAULT_OUTPUT_FILE = '.generated/file-search/documents.csv'
const LOG_PREFIX = '[export-store-documents]'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const exitWithError = (message) => {
  console.error(`${LOG_PREFIX} ${message}`)
  process.exitCode = 1
}

const logInfo = (message) => {
  console.log(`${LOG_PREFIX} ${message}`)
}

const parseArgs = (argv) => {
  const args = { out: DEFAULT_OUTPUT_FILE, store: '' }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--store') {
      args.store = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg.startsWith('--store=')) {
      args.store = arg.slice('--store='.length)
      continue
    }

    if (arg === '--out') {
      args.out = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg.startsWith('--out=')) {
      args.out = arg.slice('--out='.length)
      continue
    }

    if (arg === '--help' || arg === '-h') {
      return { help: true }
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  if (!args.store.trim()) {
    throw new Error('Missing required argument: --store "<display-name-or-store-id>"')
  }

  if (!args.out.trim()) {
    throw new Error('Output path cannot be empty.')
  }

  return { help: false, ...args }
}

const usage = () => {
  console.log(
    [
      'Export document display names from a Gemini file search store.',
      '',
      'Usage:',
      '  npm run export:documents -- --store "<display-name-or-store-id>" [--out .generated/file-search/documents.csv]',
    ].join('\n'),
  )
}

const parseDotEnv = (content) => {
  const values = new Map()

  for (const line of content.split(/\r?\n/u)) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const match = trimmedLine.match(
      /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u,
    )

    if (!match) {
      continue
    }

    const [, key, rawValue] = match
    let value = rawValue.trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    values.set(key, value)
  }

  return values
}

const loadApiKey = async () => {
  const envApiKey = process.env.GEMINI_API_KEY?.trim()
  if (envApiKey) {
    return { apiKey: envApiKey, source: 'process.env.GEMINI_API_KEY' }
  }

  const envPath = path.join(projectRoot, '.env')

  try {
    const envContent = await readFile(envPath, 'utf8')
    return {
      apiKey: parseDotEnv(envContent).get('GEMINI_API_KEY')?.trim() ?? '',
      source: envPath,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { apiKey: '', source: envPath }
    }

    throw error
  }
}

const isApiErrorWithStatus = (error, status) =>
  error instanceof ApiError && error.status === status

const formatApiError = (error) => {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

const formatErrorDetails = (error) => {
  const message = formatApiError(error)

  if (
    error &&
    typeof error === 'object' &&
    'cause' in error &&
    error.cause instanceof Error &&
    error.cause.message
  ) {
    return `${message}\nCaused by: ${error.cause.message}`
  }

  return message
}

const toStoreResourceName = (value) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    throw new Error('Store value cannot be empty.')
  }

  if (trimmedValue.startsWith(STORE_RESOURCE_PREFIX)) {
    return trimmedValue
  }

  if (trimmedValue.includes('/')) {
    throw new Error(
      `Invalid store value: ${trimmedValue}. Use a full ${STORE_RESOURCE_PREFIX}... resource name, a bare store id, or an exact display name.`,
    )
  }

  return `${STORE_RESOURCE_PREFIX}${trimmedValue}`
}

const listStoresByDisplayName = async (client, displayName) => {
  const pager = await client.fileSearchStores.list({
    config: { pageSize: PAGE_SIZE },
  })

  const matches = []

  for await (const store of pager) {
    if ((store.displayName ?? '').trim() !== displayName) {
      continue
    }

    if (store.name) {
      matches.push(store.name)
    }
  }

  return matches
}

const assertStoreAccessible = async (client, storeName) => {
  try {
    const store = await client.fileSearchStores.get({ name: storeName })
    return store.name ?? storeName
  } catch (error) {
    if (isApiErrorWithStatus(error, 403)) {
      throw new Error(`Store is not accessible: ${storeName}. ${formatApiError(error)}`)
    }

    throw new Error(`Failed to load store ${storeName}. ${formatApiError(error)}`)
  }
}

const resolveStoreName = async (client, rawValue) => {
  const value = rawValue.trim()
  logInfo(`Resolving store from input: ${value}`)
  logInfo('Scanning accessible stores for an exact display name match...')
  const displayNameMatches = await listStoresByDisplayName(client, value)

  if (displayNameMatches.length > 1) {
    throw new Error(
      [
        `Multiple stores matched the exact display name "${value}".`,
        'Re-run the command with one of these resource names:',
        ...displayNameMatches.map((match) => `- ${match}`),
      ].join('\n'),
    )
  }

  if (displayNameMatches.length === 1) {
    logInfo(`Resolved exact display name to ${displayNameMatches[0]}`)
    return displayNameMatches[0]
  }

  logInfo('No exact display name match found. Treating input as a store id or resource name.')
  const storeName = toStoreResourceName(value)
  const resolvedStoreName = await assertStoreAccessible(client, storeName)
  logInfo(`Resolved store input to ${resolvedStoreName}`)
  return resolvedStoreName
}

const toCsvCell = (value) => `"${String(value).replaceAll('"', '""')}"`

const exportDocuments = async ({ client, outPath, storeName }) => {
  logInfo(`Listing documents from ${storeName} with page size ${PAGE_SIZE}`)
  const pager = await client.fileSearchStores.documents.list({
    parent: storeName,
    config: { pageSize: PAGE_SIZE },
  })

  const lines = ['display_name']
  let count = 0

  for await (const document of pager) {
    lines.push(toCsvCell(document.displayName ?? ''))
    count += 1

    if (count % 100 === 0) {
      logInfo(`Processed ${count} documents...`)
    }
  }

  logInfo(`Writing ${count} document names to ${outPath}`)
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, `${lines.join('\n')}\n`, 'utf8')
  return count
}

const main = async () => {
  const parsedArgs = parseArgs(process.argv.slice(2))

  if (parsedArgs.help) {
    usage()
    return
  }

  const { apiKey, source } = await loadApiKey()

  if (!apiKey) {
    throw new Error(
      'Missing GEMINI_API_KEY. Set it in the environment or in the repo-root .env file.',
    )
  }

  logInfo(`Loaded GEMINI_API_KEY from ${source}`)
  const client = new GoogleGenAI({ apiKey })
  const storeName = await resolveStoreName(client, parsedArgs.store)
  const outPath = path.resolve(projectRoot, parsedArgs.out)
  const count = await exportDocuments({ client, outPath, storeName })

  logInfo(`Exported ${count} document names from ${storeName} to ${outPath}`)
}

main().catch((error) => {
  exitWithError(formatErrorDetails(error))
})
