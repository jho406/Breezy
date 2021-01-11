import {
  argsForFetch,
  parseResponse,
  getIn,
  isGraft,
  needsRefresh,
  getFetch,
  urlToPageKey,
  withoutBusters,
  hasBzq,
  removeBzq,
} from '../utils'
import parse from 'url-parse'
import { CLEAR_FLASH, BEFORE_FETCH, BREEZY_ERROR } from '../actions'
import { copyPage, saveAndProcessPage } from './index'

function beforeFetch(payload) {
  return {
    type: BEFORE_FETCH,
    payload,
  }
}

function handleError(err) {
  return {
    type: BREEZY_ERROR,
    payload: {
      message: err.message,
    },
  }
}

function handleFetchErr(err, fetchArgs, dispatch) {
  err.fetchArgs = fetchArgs
  err.url = fetchArgs[0]
  err.pageKey = urlToPageKey(fetchArgs[0])
  dispatch(handleError(err))
  throw err
}

//TODO: Provide a connected component for refresh
function buildMeta(pageKey, page, state) {
  const { assets: prevAssets } = state
  const { assets: nextAssets } = page

  //TODO: needs refresh should dispatch, to get a nice, you need to reload your page
  return {
    pageKey,
    page,
    componentIdentifier: page.componentIdentifier,
    needsRefresh: needsRefresh(prevAssets, nextAssets),
  }
}

export function clearFlash({ pageKey }) {
  return {
    type: CLEAR_FLASH,
    payload: {
      pageKey,
    },
  }
}

export function remote(
  path,
  {
    method = 'GET',
    headers,
    body = '',
    pageKey,
    beforeSave = (prevPage, receivedPage) => receivedPage,
  } = {}
) {
  path = withoutBusters(path)
  pageKey = urlToPageKey(pageKey)

  return (dispatch, getState) => {
    const fetchArgs = argsForFetch(getState, path, {
      method,
      headers,
      body,
    })
    pageKey = pageKey || getState().breezy.currentPageKey

    dispatch(beforeFetch({ fetchArgs }))

    const fetch = getFetch()
    return fetch(...fetchArgs)
      .then(parseResponse)
      .then(({ rsp, json }) => {
        const { breezy, pages = {} } = getState()

        const meta = {
          ...buildMeta(pageKey, json, breezy),
          redirected: rsp.redirected,
          rsp,
          fetchArgs,
        }

        const page = beforeSave(pages[pageKey], json)
        dispatch(saveAndProcessPage(pageKey, page))
        meta.pageKey = pageKey

        return meta
      })
      .catch((e) => handleFetchErr(e, fetchArgs, dispatch))
  }
}

let lastVisitController = new AbortController()

export function visit(
  path,
  {
    method = 'GET',
    headers,
    body = '',
    placeholderKey,
    beforeSave = (prevPage, receivedPage) => receivedPage,
  } = {}
) {
  path = withoutBusters(path)
  let pageKey = urlToPageKey(path)

  return (dispatch, getState) => {
    const currentKey = getState().breezy.currentPageKey
    dispatch(clearFlash({ pageKey: currentKey }))

    placeholderKey = placeholderKey && urlToPageKey(placeholderKey)
    const hasPlaceholder = !!getState().pages[placeholderKey]

    if (placeholderKey && hasPlaceholder) {
      dispatch(copyPage({ from: placeholderKey, to: pageKey }))
    }

    if (placeholderKey && !hasPlaceholder) {
      console.warn(
        `Could not find placeholder with key ${placeholderKey} in state. The bzq param will be ignored`
      )
      path = removeBzq(path)
    }

    if (!placeholderKey && hasBzq(path)) {
      console.warn(
        `visit was called with bzq param in the path ${path}, this will be ignore unless you provide a placeholder.`
      )
      path = removeBzq(path)
    }

    const controller = new AbortController()
    const { signal } = controller
    const fetchArgs = argsForFetch(getState, path, {
      headers,
      body,
      method,
      signal,
    })

    dispatch(beforeFetch({ fetchArgs }))

    const fetch = getFetch()

    lastVisitController.abort()
    lastVisitController = controller

    return fetch(...fetchArgs)
      .then(parseResponse)
      .then(({ rsp, json }) => {
        const { breezy, pages = {} } = getState()

        const meta = {
          ...buildMeta(pageKey, json, breezy),
          redirected: rsp.redirected,
          rsp,
          fetchArgs,
        }

        meta.suggestedAction = 'push'
        if (!rsp.redirected && fetchArgs[1].method != 'GET') {
          meta.suggestedAction = 'replace'
        }

        if (method !== 'GET') {
          const contentLocation = rsp.headers.get('content-location')

          if (contentLocation) {
            pageKey = urlToPageKey(contentLocation)
          }
        }

        if (rsp.redirected) {
          pageKey = urlToPageKey(rsp.url)
        }

        const page = beforeSave(pages[pageKey], json)
        dispatch(saveAndProcessPage(pageKey, page))
        meta.pageKey = pageKey

        return meta
      })
      .catch((e) => handleFetchErr(e, fetchArgs, dispatch))
  }
}
