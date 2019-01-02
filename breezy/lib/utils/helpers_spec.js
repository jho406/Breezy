import {
  isGraft,
  extractNodeAndPath,
  parseSJR,
  pagePath,
} from './helpers'

describe('pagePath', () => {
  it('returns the full keypath relative to the breezy store', () => {
    const path = pagePath('/foo', 'a.b.c')
    expect(path).toBe('/foo.data.a.b.c')
  })
})

describe('isGraft', () => {
  it('returns true if page is a graft', () => {
    const page = {
      action: 'graft'
    }
    expect(isGraft(page)).toBe(true)
  })

  it('returns true if page is a graft', () => {
    const page = {
    }
    expect(isGraft(page)).toBe(false)
  })
})

describe('extractNodeAndPath', () => {
  it('returns the node and the keypath to it', () => {
    const page = {
      data: 'this is a node',
      privateOpts: {
        path: 'path.to.node',
        action: 'graft',
      }
    }

    expect(extractNodeAndPath(page)).toEqual({
      node: 'this is a node',
      pathToNode: 'path.to.node'
    })
  })

  it('errors out if action is anything else', () => {
    const page = {
      data: 'this is a node',
      privateOpts: {
        path: 'path.to.node'
      }
    }

    expect(() => {
      extractNodeAndPath(page)
    }).toThrow(new Error("Expected page to be a graft response rendered from node filtering."))
  })
})
