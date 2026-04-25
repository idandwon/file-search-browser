import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_INPUT_FILE = '.generated/file-search/documents.csv'
const DEFAULT_OUTPUT_FILE = '.generated/file-search/document-item-ids.csv'
const EXPECTED_HEADER = 'display_name'
const LOG_PREFIX = '[extract-document-item-ids]'
const ITEM_ID_PATTERN = /^(\d+)_/u

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
  const args = { in: DEFAULT_INPUT_FILE, out: DEFAULT_OUTPUT_FILE }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--in') {
      args.in = argv[index + 1] ?? ''
      index += 1
      continue
    }

    if (arg.startsWith('--in=')) {
      args.in = arg.slice('--in='.length)
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

  if (!args.in.trim()) {
    throw new Error('Input path cannot be empty.')
  }

  if (!args.out.trim()) {
    throw new Error('Output path cannot be empty.')
  }

  return { help: false, ...args }
}

const usage = () => {
  console.log(
    [
      'Extract numeric item ids from documents.csv names.',
      '',
      'Usage:',
      '  npm run extract:item-ids -- [--in .generated/file-search/documents.csv] [--out .generated/file-search/document-item-ids.csv]',
    ].join('\n'),
  )
}

const parseCsv = (content) => {
  const rows = []
  let row = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]

    if (inQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        cell += char
      }

      continue
    }

    if (char === '"') {
      if (cell.length > 0) {
        throw new Error('Malformed CSV: unexpected quote inside an unquoted field.')
      }

      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }

    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }

    if (char === '\r') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''

      if (content[index + 1] === '\n') {
        index += 1
      }

      continue
    }

    cell += char
  }

  if (inQuotes) {
    throw new Error('Malformed CSV: unterminated quoted field.')
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

const toCsvCell = (value) => `"${String(value).replaceAll('"', '""')}"`

const readInputRows = async (inputPath) => {
  let content

  try {
    content = await readFile(inputPath, 'utf8')
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Input file not found: ${inputPath}`)
    }

    throw new Error(`Failed to read input file ${inputPath}.`)
  }

  const rows = parseCsv(content)

  if (rows.length === 0) {
    throw new Error('Input CSV is empty.')
  }

  if (rows[0].length !== 1 || rows[0][0] !== EXPECTED_HEADER) {
    throw new Error(
      `Malformed CSV header. Expected exactly one column named "${EXPECTED_HEADER}".`,
    )
  }

  if (rows.length === 1) {
    throw new Error('Input CSV has no data rows.')
  }

  return rows.slice(1)
}

const extractItemIdRows = (rows) => {
  const matchedRows = []
  const skippedNames = []

  for (const row of rows) {
    if (row.length !== 1) {
      throw new Error('Malformed CSV row. Expected exactly one column per row.')
    }

    const displayName = row[0]
    const match = displayName.match(ITEM_ID_PATTERN)

    if (!match) {
      skippedNames.push(displayName)
      continue
    }

    matchedRows.push({ displayName, itemId: match[1] })
  }

  return { matchedRows, skippedNames }
}

const writeOutputRows = async (outputPath, rows) => {
  const lines = ['display_name,item_id']

  for (const row of rows) {
    lines.push(`${toCsvCell(row.displayName)},${toCsvCell(row.itemId)}`)
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${lines.join('\n')}\n`, 'utf8')
}

const main = async () => {
  const parsedArgs = parseArgs(process.argv.slice(2))

  if (parsedArgs.help) {
    usage()
    return
  }

  const inputPath = path.resolve(projectRoot, parsedArgs.in)
  const outputPath = path.resolve(projectRoot, parsedArgs.out)

  logInfo(`Reading input CSV from ${inputPath}`)
  const inputRows = await readInputRows(inputPath)
  logInfo(`Parsed ${inputRows.length} data rows from input CSV`)

  const { matchedRows, skippedNames } = extractItemIdRows(inputRows)

  for (const skippedName of skippedNames) {
    logInfo(`Skipping row without item id prefix: ${skippedName}`)
  }

  logInfo(`Writing ${matchedRows.length} item id mappings to ${outputPath}`)
  await writeOutputRows(outputPath, matchedRows)

  logInfo(`Processed rows: ${inputRows.length}`)
  logInfo(`Matched rows: ${matchedRows.length}`)
  logInfo(`Skipped rows: ${skippedNames.length}`)
}

main().catch((error) => {
  exitWithError(error instanceof Error ? error.message : String(error))
})
