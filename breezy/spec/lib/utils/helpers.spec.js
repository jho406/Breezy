import {
  isGraft,
  extractNodeAndPath,
  pagePath,
} from '../../../lib/utils/helpers'
//TODO: camelized path, also camelize this some_id=1 in path

describe('isGraft', () => {
  it('returns true if page is a graft', () => {
    const page = {
      action: 'graft',
    }
    expect(isGraft(page)).toBe(true)
  })

  it('returns true if page is a graft', () => {
    const page = {}
    expect(isGraft(page)).toBe(false)
  })
})

describe('extractNodeAndPath', () => {
  it('returns the node and the keypath to it', () => {
    const page = {
      data: 'this is a node',
      path: 'path.to.node',
      action: 'graft',
    }

    expect(extractNodeAndPath(page)).toEqual({
      node: 'this is a node',
      pathToNode: 'path.to.node',
    })
  })

  it('errors out if action is anything else', () => {
    const page = {
      data: 'this is a node',
      path: 'path.to.node',
    }

    expect(() => {
      extractNodeAndPath(page)
    }).toThrow(
      new Error(
        'Expected page to be a graft response rendered from node filtering.'
      )
    )
  })
})
