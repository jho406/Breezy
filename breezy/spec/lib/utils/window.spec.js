import * as helpers from '../../../lib/utils/window'

describe('needsRefresh', () => {
  it('returns false if passed in undefined', () => {
    let prevAssets = undefined
    let newAssets = undefined

    expect(helpers.needsRefresh(prevAssets, newAssets)).toBe(false)
    expect(helpers.needsRefresh([], newAssets)).toBe(false)
    expect(helpers.needsRefresh(prevAssets, [])).toBe(false)
  })

  it('returns false if assets are equal', () => {
    let prevAssets = ['abc-123']
    let newAssets = ['abc-123']

    expect(helpers.needsRefresh(prevAssets, newAssets)).toBe(false)
  })

  it('returns true if there are new assets', () => {
    let prevAssets = ['abc-123']
    let newAssets = ['abc-123', 'def-123']

    expect(helpers.needsRefresh(prevAssets, newAssets)).toBe(true)
  })

  it('returns false if there are no new assets', () => {
    let prevAssets = ['abc-123', 'def-123']
    let newAssets = ['abc-123']

    expect(helpers.needsRefresh(prevAssets, newAssets)).toBe(false)
  })
})
