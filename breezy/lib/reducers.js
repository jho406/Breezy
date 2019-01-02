import {
  reverseMerge,
  forEachFragmentInPage,
  forEachFragmentPathInPage,
} from './utils/helpers'
import {setIn, getIn} from'./utils/immutability'
import {
  REMOVE_PAGE,
  SAVE_RESPONSE,
  HANDLE_GRAFT,
  OVERRIDE_VISIT_SEQ,
  HISTORY_CHANGE,
  SET_BASE_URL,
  SET_CSRF_TOKEN,
  UPDATE_ALL_FRAGMENTS,
  MATCH_FRAGMENTS_IN_PAGE,
} from './actions'

function updateAllFragments (state, pageKey) {
  const selectedPage = state[pageKey]
  const {fragments} = selectedPage

  Object.entries(fragments)
    .forEach(([fragmentName, paths]) => {
      paths.forEach((path) => {
        const fullPath = ['data', path].join('.')
        const updatedNode = getIn(selectedPage, fullPath)
        state = copyInByFragment(state, fragmentName, updatedNode)
      })
    })

  return state
}

function saveResponse (state, pageKey, page) {
  state = {...state}

  reverseMerge(page, {
    pageKey,
    fragments: {},
  })

  state[pageKey] = page

  return state
}

function copyInByFragment (state, name, value, subpath = null) {
  state = {...state}
  const copy = JSON.stringify(value)

  Object.entries(state).forEach(([pageKey, {fragments} = {}]) => {
    (fragments[name] || []).forEach(pathToFragment => {
      const fullpath = [pathToFragment]
      if (subpath) {
        fullpath.push(subpath)
      }

      state = setIn(state, [pageKey, 'data', fullpath].join('.'), JSON.parse(copy))
    })
  })

  return state
}

function updateFragmentsInPageToMatch (state, pageKey, fragmentName, pathToFragment) {
  const currentPage = state[pageKey]
  if (!currentPage) {
    const error = new Error(`Breezy was looking for ${pageKey} in your state, but could not find it in your mapping. Did you forget to pass in a valid pageKey to this.props.remote or this.props.visit?`)
    throw error
  }

  const node = getIn(state, [pageKey, 'data', pathToFragment].join('.'))
  const copy = JSON.stringify(node)

  const fragmentPaths = currentPage.fragments[fragmentName] || []
  fragmentPaths.forEach((path) => {
    state = setIn(state, [pageKey, 'data', path].join('.'), JSON.parse(copy))
  })

  return state
}

function handleGraft (state, pageKey, node, pathToNode, fragments={}) {
  state = {...state}
  fragments = {...fragments}

  const currentPage = state[pageKey]

  if (!currentPage) {
    const error = new Error(`Breezy was looking for ${pageKey} in your state, but could not find it in your mapping. Did you forget to pass in a valid pageKey to this.props.remote or this.props.visit?`)
    throw error
  }
  let nextState = setIn(state, [pageKey, 'data', pathToNode].join('.'), node)

  Object.keys(currentPage.fragments).forEach((name) => {
    if(!fragments[name]) {
      fragments[name] = []
    }

    fragments[name] = [
      ...new Set([...fragments[name],
        ...currentPage.fragments[name]])
    ]
  })

  nextState = setIn(nextState, [pageKey, 'fragments'].join('.'), fragments)
  return nextState
}

export function pageReducer (state = {}, action) {
  switch(action.type) {
  case SAVE_RESPONSE: {
    const {pageKey, page} = action.payload
    return saveResponse(state, pageKey, page)
  }
  case UPDATE_ALL_FRAGMENTS: {
    const {pageKey} = action.payload
    return updateAllFragments(state, pageKey)
  }
  case MATCH_FRAGMENTS_IN_PAGE: {
    const {
      pageKey,
      lastFragmentName,
      lastFragmentPath,
    } = action.payload

    return updateFragmentsInPageToMatch(state, pageKey, lastFragmentName, lastFragmentPath)
  }
  case HANDLE_GRAFT: {
    const {
      pageKey,
      node,
      pathToNode,
      fragments,
    } = action.payload

    return handleGraft(state, pageKey, node, pathToNode, fragments)
  }
  case REMOVE_PAGE: {
    const {pageKey} = action.payload
    const nextState = {...state}
    delete nextState[pageKey]

    return nextState
  }
  default:
    return state
  }
}

export function metaReducer (state = {}, action) {
  switch(action.type) {
  case HISTORY_CHANGE: {
    const {url} = action.payload
    return {...state, currentUrl: url}
  }
  case SET_BASE_URL: {
    const {baseUrl} = action.payload
    return {...state, baseUrl}
  }
  case SAVE_RESPONSE: {
    const {page: {privateOpts = {}}} = action.payload
    const {csrfToken} = privateOpts
    return {...state, csrfToken}
  }
  case SET_CSRF_TOKEN: {
    const {csrfToken} = action.payload
    return {...state, csrfToken: csrfToken}
  }
  default:
    return state
  }
}

export function controlFlowReducer (state = {
}, action) {

  switch(action.type) {
  case OVERRIDE_VISIT_SEQ: {
    const {seqId} = action.payload
    return {...state, visit: seqId}
  }
  default:
    return state
  }
}

export function breezyReducer (state = {}, action) {
  let meta = metaReducer(state, action)
  let controlFlows = controlFlowReducer(meta.controlFlows, action)

  return {...meta, controlFlows}
}

export const rootReducer = {
  breezy: breezyReducer,
  pages: pageReducer
}
