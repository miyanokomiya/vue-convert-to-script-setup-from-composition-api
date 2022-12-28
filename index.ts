import klaw from 'klaw'
import path from 'node:path'
import { convert } from './convert'

const isDryRun = process.argv.some((a) => a === '-d')
const fileArg = process.argv.findIndex((a) => a === '-f')
const filePath = fileArg > -1 ? process.argv[fileArg + 1] : undefined

const root = process.cwd()
const ignores = [
  '.git',
  'node_modules',
  'dist',
  'coverage'
]

const toRelative = (p: string) => path.relative(root, p)

const main = async () => {
  const warningList: Array<{ file: string, messages: string[] }> = []

  if (filePath) {
      console.log(`Processing: ${toRelative(filePath)}`)

      const warnings = await convert(filePath, isDryRun)
      if (warnings.length > 0) {
        warningList.push({
          file: filePath,
          messages: warnings
        })
      }
  } else {
    const list = klaw(root, {
      filter: p => !ignores.includes(path.basename(p)),
      depthLimit: -1
    })

    for await (const file of list) {
      if (file.stats.isDirectory()) continue
      if (path.extname(file.path) !== '.vue') continue

      console.log(`Processing: ${toRelative(file.path)}`)

      const warnings = await convert(file.path, isDryRun)
      if (warnings.length > 0) {
        warningList.push({
          file: file.path,
          messages: warnings
        })
      }
    }
  }

  console.log('\n\nFinished')
  if (warningList.length > 0) {
    console.log('Warnings:')
    for (const w of warningList) {
      console.log(`  ${toRelative(w.file)}`)
      for (const m of w.messages) {
        console.log(`    ${m}`)
      }
    }
  }
}

main()
