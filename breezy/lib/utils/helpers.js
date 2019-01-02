import uuidv4 from 'uuid/v4'
export {uuidv4}

export function reverseMerge (dest, obj) {
  let k, v
  for (k in obj) {
    v = obj[k]
    if (!dest.hasOwnProperty(k)) {
      dest[k] = v
    }
  }
  return dest
}

export function pagePath (pageKey, keyPath) {
  let fullPath = [pageKey, 'data']

  if (keyPath) {
    fullPath.push(keyPath)
  }

  return fullPath.join('.')
}

export function isGraft (page) {
  return page.action === 'graft'
}

export function extractNodeAndPath (page) {
  const {
    data: node,
    privateOpts: {
      action,
      path: pathToNode,
    }
  } = page

  if(action === 'graft') {
    return {node, pathToNode}
  } else {
    const errMsg = 'Expected page to be a graft response rendered from node filtering.'
    throw new Error(errMsg)
  }
}

export function parseSJR (body) {
  return (new Function(`'use strict'; return ${body}` )())
}
