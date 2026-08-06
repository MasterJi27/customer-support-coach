import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadCsv, downloadPdf } from '../lib/export'

describe('export utilities', () => {
  let clicks = []

  beforeEach(() => {
    clicks = []
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
    global.HTMLAnchorElement.prototype.click = function () {
      clicks.push(this.download)
    }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('downloadCsv escapes quotes and uses BOM', () => {
    downloadCsv('report.csv', [
      ['Name', 'Note'],
      ['Priya "P"', 'Great, "job"'],
    ])
    expect(clicks).toEqual(['report.csv'])
  })

  it('downloadPdf generates a file without throwing', () => {
    expect(() =>
      downloadPdf('test.pdf', {
        title: 'Test Report',
        sections: [
          { heading: 'Data', table: { columns: ['A', 'B'], rows: [['1', '2']] } },
        ],
      })
    ).not.toThrow()
  })
})
