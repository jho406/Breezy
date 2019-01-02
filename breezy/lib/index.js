import parse from 'url-parse'
import {rootReducer} from './reducers'
import {setWindow, unsetWindow, hasWindow} from './window'
import connect from './connector'
import {withoutBZParams} from './utils/url'
import {saveAndProcessPage} from './action_creators'
import {
  HISTORY_CHANGE,
  SET_CSRF_TOKEN,
  SET_BASE_URL,
} from './actions'

export {mapStateToProps, mapDispatchToProps, enhanceVisitWithBrowserBehavior} from './utils/react'
export {breezyReducer, pageReducer, rootReducer} from './reducers'
export {getIn} from './utils/immutability.js'
export {setWindow, unsetWindow}
export function stop () {
  unsetWindow()
}

function pageToInitialState (key, page) {
  return {
    pages: {[key]: page}
  }
}

export function start ({window, baseUrl='', url, initialPage={}}) {
  let nav

  if (window) {
    setWindow(window)
    if (!url) {
      url = window.location.href
    }
  }

  const initialPageKey = withoutBZParams(parse(url).href)
  const {privateOpts: {csrfToken} = {}} = initialPage

  return {
    reducer: rootReducer,
    Nav: nav,
    connect: function (store){
      connect(store)

      if(hasWindow()) {
        store.dispatch({
          type: HISTORY_CHANGE,
          payload: {
            url:  parse(url).href
          }
        })
      }

      store.dispatch(saveAndProcessPage(
        initialPageKey,
        initialPage
      ))

      store.dispatch({type: SET_BASE_URL, payload: {baseUrl}})
      store.dispatch({type: SET_CSRF_TOKEN, payload: {csrfToken}})
    },
    initialState: pageToInitialState(initialPageKey, initialPage),
    initialPageKey,
  }
}

export default {
  start,
  stop
}
