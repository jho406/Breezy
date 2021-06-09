import { isGraft, urlToPageKey } from '../utils'
import parse from 'url-parse'
import {
  SAVE_RESPONSE,
  HANDLE_GRAFT,
  GRAFTING_ERROR,
  GRAFTING_SUCCESS,
  COPY_PAGE,
} from '../actions'
import { remote } from './requests'
export * from './requests'

export function copyPage({ from, to }) {
  return {
    type: COPY_PAGE,
    payload: {
      from,
      to,
    },
  }
}

export function saveResponse({ pageKey, page }) {
  pageKey = urlToPageKey(pageKey)

  return {
    type: SAVE_RESPONSE,
    payload: {
      pageKey,
      page,
    },
  }
}

export function handleGraft({ pageKey, page }) {
  pageKey = urlToPageKey(pageKey)

  return {
    type: HANDLE_GRAFT,
    payload: {
      pageKey,
      page,
    },
  }
}

function fetchDeferments(pageKey, defers = []) {
  pageKey = urlToPageKey(pageKey)
  return (dispatch) => {
    const fetches = defers
      .filter(({ type }) => type === 'auto')
      .map(function ({
        url,
        successAction = GRAFTING_SUCCESS,
        failAction = GRAFTING_ERROR,
      }) {
        let parsedUrl = new parse(url, true)
        const keyPath = parsedUrl.query.bzq

        return dispatch(remote(url, { pageKey }))
          .then(() => {
            dispatch({
              type: successAction,
              payload: {
                pageKey,
                keyPath,
              },
            })
          })
          .catch((err) => {
            dispatch({
              type: failAction,
              payload: {
                url,
                err,
                pageKey,
                keyPath,
              },
            })
          })
      })

    return Promise.all(fetches)
  }
}

export function saveAndProcessPage(pageKey, page) {
  return (dispatch) => {
    pageKey = urlToPageKey(pageKey)

    const { defers = [] } = page

    if (isGraft(page)) {
      if (pageKey) {
        dispatch(handleGraft({ pageKey, page }))
      }
    } else {
      dispatch(saveResponse({ pageKey, page }))
    }

    return dispatch(fetchDeferments(pageKey, defers))
  }
}
