import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'

const root = process.cwd()
const ignoredDirectories = new Set(['node_modules', 'unpackage'])

function collectVueFiles(directory) {
  return readdirSync(directory).flatMap(name => {
    if (ignoredDirectories.has(name)) return []
    const path = join(directory, name)
    return statSync(path).isDirectory()
      ? collectVueFiles(path)
      : path.endsWith('.vue') ? [path] : []
  })
}

const failures = []
const files = collectVueFiles(root)

for (const filename of files) {
  const source = readFileSync(filename, 'utf8')
  const id = relative(root, filename).replaceAll('\\', '/')
  const parsed = parse(source, { filename })
  if (parsed.errors.length) {
    failures.push(...parsed.errors.map(error => `${id}: ${String(error)}`))
    continue
  }
  const { descriptor } = parsed
  try {
    if (descriptor.scriptSetup) compileScript(descriptor, { id })
  } catch (error) {
    failures.push(`${id}: ${error.message}`)
  }
  if (descriptor.template) {
    const compiled = compileTemplate({
      id,
      filename,
      source: descriptor.template.content,
    })
    failures.push(...compiled.errors.map(error => `${id}: ${String(error)}`))
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log(`Validated ${files.length} Vue SFC files.`)
