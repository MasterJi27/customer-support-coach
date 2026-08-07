import 'dotenv/config'
import { embed } from './src/llm.js'

console.time('embed-1')
const e1 = await embed('Customer is angry about a double charge on their card')
console.timeEnd('embed-1')
console.log('embed-1 ok:', !!e1)

console.time('embed-2')
const e2 = await embed('Another query about refund delay')
console.timeEnd('embed-2')
console.log('embed-2 ok:', !!e2)

console.time('searchKB')
const { searchKB } = await import('./src/rag.js')
const r = await searchKB('double charge refund', 3)
console.timeEnd('searchKB')
console.log('results:', r.length)
process.exit(0)
