import { setIn, getIn, urlToPageKey } from '../utils'
import {
  REMOVE_PAGE,
  CLEAR_FLASH,
  SAVE_RESPONSE,
  HANDLE_GRAFT,
  HISTORY_CHANGE,
  SET_BASE_URL,
  SET_CSRF_TOKEN,
  COPY_PAGE,
} from '../actions'

function addPlaceholdersToDeferredNodes(existingPage, page) {
  const { defers = [] } = existingPage

  const prevDefers = defers.map(({ path }) => {
    const node = getIn(existingPage, path)
    const copy = JSON.stringify(node)
    return [path, JSON.parse(copy)]
  })

  return prevDefers.reduce((memo, [path, node]) => {
    return setIn(page, path, node)
  }, page)
}

function saveResponse(state, pageKey, page) {
  state = { ...state }

  page = {
    pageKey,
    fragments: [],
    ...page,
  }

  const existingPage = state[pageKey]

  if (existingPage) {
    page = addPlaceholdersToDeferredNodes(existingPage, page)
  }

  state[pageKey] = page

  return state
}

export function appendReceivedFragmentsOntoPage(
  state,
  pageKey,
  receivedFragments
) {
  if (!pageKey) {
    return state
  }

  if (receivedFragments.length === 0) {
    return state
  }

  const currentPage = state[pageKey]
  const { fragments: prevFragments = [] } = currentPage
  const nextFragments = [...prevFragments]
  const existingKeys = {}
  prevFragments.forEach((frag) => (existingKeys[frag.path] = true))

  receivedFragments.forEach((frag) => {
    if (!existingKeys[frag.path]) {
      nextFragments.push(frag)
    }
  })

  const nextPage = {
    ...currentPage,
    fragments: nextFragments,
  }

  const nextState = { ...state }
  nextState[pageKey] = nextPage

  return nextState
}

export function addFlash(state, pageKey, receivedFlash) {
  const nextState = { ...state }
  const nextPage = { ...state[pageKey] }
  nextPage.flash = { ...nextPage.flash, ...receivedFlash }
  nextState[pageKey] = nextPage

  return nextState
}

export function graftNodeOntoPage(state, pageKey, node, pathToNode) {
  if (!node) {
    console.warn(
      'There was no node returned in the response. Do you have the correct key path in your bzq?'
    )
    return state
  }

  if (!pathToNode || !pageKey) {
    return state
  }
  const fullPathToNode = [pageKey, pathToNode].join('.')
  return setIn(state, fullPathToNode, node)
}

export function handleGraft(state, pageKey, page) {
  const currentPage = state[pageKey]
  if (!currentPage) {
    const error = new Error(
      `Breezy was looking for ${pageKey} in your state, but could not find it in your mapping. Did you forget to pass in a valid pageKey to this.props.remote or this.props.visit?`
    )
    throw error
  }
  const {
    data: receivedNode,
    path: pathToNode,
    fragments: receivedFragments = [],
    flash: receivedFlash,
  } = page

  return [
    (nextState) =>
      graftNodeOntoPage(nextState, pageKey, receivedNode, pathToNode),
    (nextState) =>
      appendReceivedFragmentsOntoPage(
        nextState,
        pageKey,
        receivedFragments
      ),
    (nextState) => addFlash(nextState, pageKey, receivedFlash),
  ].reduce((memo, fn) => fn(memo), state)
}

export function pageReducer(state = {}, action) {
  switch (action.type) {
    case SAVE_RESPONSE: {
      const { pageKey, page } = action.payload
      return saveResponse(state, pageKey, page)
    }
    case HANDLE_GRAFT: {
      const { pageKey, page } = action.payload

      return handleGraft(state, pageKey, page)
    }
    case CLEAR_FLASH: {
      const { pageKey } = action.payload
      const nextState = { ...state }
      const nextPage = { ...state[pageKey] }

      nextPage.flash = {}
      nextState[pageKey] = nextPage

      return nextState
    }
    case COPY_PAGE: {
      const nextState = { ...state }
      const { from, to } = action.payload

      nextState[urlToPageKey(to)] = JSON.parse(
        JSON.stringify(nextState[from])
      )

      return nextState
    }
    case REMOVE_PAGE: {
      const { pageKey } = action.payload
      const nextState = { ...state }
      delete nextState[pageKey]

      return nextState
    }
    default:
      return state
  }
}

export function metaReducer(state = {}, action) {
  switch (action.type) {
    case HISTORY_CHANGE: {
      const { pathname, search, hash } = action.payload
      const currentPageKey = urlToPageKey(pathname + search)

      return {
        ...state,
        currentPageKey,
        pathname,
        search,
        hash,
      }
    }
    case SET_BASE_URL: {
      const { baseUrl } = action.payload
      return { ...state, baseUrl }
    }
    case SAVE_RESPONSE: {
      const {
        page: { csrfToken, assets },
      } = action.payload

      return { ...state, csrfToken, assets }
    }
    case SET_CSRF_TOKEN: {
      const { csrfToken } = action.payload
      return { ...state, csrfToken: csrfToken }
    }
    default:
      return state
  }
}

export function breezyReducer(state = {}, action) {
  let meta = metaReducer(state, action)

  return { ...meta }
}

export const rootReducer = {
  breezy: breezyReducer,
  pages: pageReducer,
}
