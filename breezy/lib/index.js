import parse from 'url-parse'
import { rootReducer } from './reducers'
import { config } from './config'
import { urlToPageKey } from './utils'
import { saveAndProcessPage } from './action_creators'
import { HISTORY_CHANGE, SET_CSRF_TOKEN } from './actions'

export {
  mapStateToProps,
  mapDispatchToProps,
  mapDispatchToPropsIncludingVisitAndRemote,
} from './utils/react'
export {
  breezyReducer,
  pageReducer,
  rootReducer,
  updateFragments,
} from './reducers'
export { getIn } from './utils/immutability.js'
export { urlToPageKey }

function pageToInitialState(key, page) {
  return {
    pages: { [key]: page },
  }
}

export function start({
  initialPage,
  baseUrl = config.baseUrl,
  maxPages = config.maxPages,
  path,
}) {
  const initialPageKey = urlToPageKey(parse(path).href)
  const { csrfToken } = initialPage
  const location = parse(path)
  const { pathname, query, hash } = location

  config.baseUrl = baseUrl
  config.maxPages = maxPages

  return {
    reducer: rootReducer,
    prepareStore: function (store) {
      store.dispatch({
        type: HISTORY_CHANGE,
        payload: {
          pathname: location.pathname,
          search: location.query,
          hash: location.hash,
        },
      })
      store.dispatch(saveAndProcessPage(initialPageKey, initialPage))
      store.dispatch({ type: SET_CSRF_TOKEN, payload: { csrfToken } })
    },
    initialState: pageToInitialState(initialPageKey, initialPage),
    initialPageKey,
  }
}
