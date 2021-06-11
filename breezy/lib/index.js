import React from 'react'
import parse from 'url-parse'
import { rootReducer } from './reducers'
import { config } from './config'
import { urlToPageKey, ujsHandlers, argsForHistory } from './utils'
import { saveAndProcessPage } from './action_creators'
import { HISTORY_CHANGE, SET_CSRF_TOKEN } from './actions'
import {
  combineReducers,
  createStore,
  applyMiddleware,
  compose,
} from 'redux'
import thunk from 'redux-thunk'
import { Provider, connect } from 'react-redux'
import { createBrowserHistory, createMemoryHistory } from 'history'
import Nav from './components/Nav'
import PropTypes from 'prop-types'

export {
  mapStateToProps,
  mapDispatchToProps,
  mapDispatchToPropsIncludingVisitAndRemote,
} from './utils/react'
import { mapStateToProps, mapDispatchToProps } from './utils/react'
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

function start({
  initialPage,
  baseUrl = config.baseUrl,
  maxPages = config.maxPages,
  path,
}) {
  const initialPageKey = urlToPageKey(parse(path).href)
  const { csrfToken } = initialPage
  const location = parse(path)

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

class NotImplementedError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
  }
}

export class ApplicationBase extends React.Component {
  constructor(props) {
    super(props)
    this.hasWindow = typeof window !== 'undefined'

    // Create a navigator Ref for UJS attributes and to enhance the base `visit`
    // and `visit` thunks
    this.navigatorRef = React.createRef()

    // Retrieve initial values and methods to prepare the store.
    const { prepareStore, initialState, initialPageKey, reducer } =
      start({
        initialPage: this.props.initialPage,
        baseUrl: this.props.baseUrl,
        path: this.props.path,
        // The max number of pages to keep in the store. Default is 20
        // maxPages: 20
      })
    this.initialPageKey = initialPageKey

    // Build the store and pass Breezy's provided reducer to be combined with
    // your reducers located at `application_reducer.js`
    this.store = this.buildStore(initialState, reducer)

    // Fire initial events and populate the store
    prepareStore(this.store)

    // Build history
    this.history = this.createHistory()
    this.history.replace(...argsForHistory(this.props.path))

    const nextMapping = { ...this.mapping() }
    for (const key in nextMapping) {
      const component = nextMapping[key]
      nextMapping[key] = connect(
        mapStateToProps,
        mapDispatchToProps
      )(component)
    }

    this.connectedMapping = nextMapping

    // Build visit and remote thunks
    // Your modified `visit` and `remote` will get passed below to the
    // Nav component then to your components
    //
    // You can access them via `this.props.visit` or `this.props.remote`. In
    // your page components
    const { visit, remote } = this.visitAndRemote(
      this.navigatorRef,
      this.store
    )
    this.visit = visit
    this.remote = remote
  }

  visitAndRemote() {
    throw new NotImplementedError('Implement this')
  }

  componentDidMount() {
    const { appEl } = this.props
    // Create the ujs event handlers. You can change the ujsAttributePrefix
    // in the event the data attribute conflicts with another.
    this.ujsHandlers = ujsHandlers({
      visit: this.visit,
      remote: this.remote,
      store: this.store,
      ujsAttributePrefix: 'data-bz',
    })
    const { onClick, onSubmit } = this.ujsHandlers

    appEl.addEventListener('click', onClick)
    appEl.addEventListener('submit', onSubmit)
  }

  componentWillUnmount() {
    const { appEl } = this.props
    const { onClick, onSubmit } = this.ujsHandlers

    appEl.removeEventListener('click', onClick)
    appEl.removeEventListener('submit', onSubmit)
  }

  buildStore(initialState, reducer) {
    const store = createStore(
      combineReducers(reducer),
      initialState,
      compose(applyMiddleware(thunk))
    )

    return store
  }

  createHistory() {
    if (this.hasWindow) {
      // This is used for client side rendering
      return createBrowserHistory({})
    } else {
      // This is used for server side rendering
      return createMemoryHistory({})
    }
  }

  mapping() {
    throw new NotImplementedError('Implement this')
  }

  render() {
    // The Nav component is pretty bare and can be inherited from for custom
    // behavior or replaced with your own.
    return (
      <Provider store={this.store}>
        <Nav
          store={this.store}
          ref={this.navigatorRef}
          visit={this.visit}
          remote={this.remote}
          mapping={this.connectedMapping}
          history={this.history}
          initialPageKey={this.initialPageKey}
        />
      </Provider>
    )
  }
}

ApplicationBase.propTypes = {
  initialPage: PropTypes.object,
  baseUrl: PropTypes.string,
  path: PropTypes.string,
  appEl: PropTypes.object,
}
