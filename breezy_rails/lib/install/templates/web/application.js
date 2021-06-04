import React from 'react'
import {combineReducers, createStore, applyMiddleware, compose} from 'redux'
import reduceReducers from 'reduce-reducers'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import { createBrowserHistory, createMemoryHistory } from 'history'
import { start } from '@jho406/breezy'
import Nav from '@jho406/breezy/components/NavComponent'
import { ujsHandlers } from '@jho406/breezy/utils'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { applicationRootReducer, applicationPagesReducer } from './reducer'
import { buildVisitAndRemote } from './application_visit'

if(typeof window !== 'undefined' ) {
  document.addEventListener("DOMContentLoaded", function() {
    const appEl = document.getElementById('app')
    const location = window.location

    if (appEl) {
      render(
        <Application
          appEl={appEl}
          // The base url is an optional prefix to all calls made by the `visit`
          // and `remote` thunks.
          baseUrl={''}
          // The global var BREEZY_INITIAL_PAGE_STATE is set by your erb
          // template, e.g., index.html.erb
          initialPage={window.BREEZY_INITIAL_PAGE_STATE}
          // The initial path of the page, e.g., /foobar
          path={location.pathname + location.search + location.hash}
        />, appEl)
    }
 })
}

export default class Application extends React.Component {
  constructor(props) {
    super(props)
    this.hasWindow = typeof window !== 'undefined'

    // Mapping between your props template to Component, you must add to this
    // to register any new page level component you create. If you are using the
    // scaffold, it will auto append the identifers for you.
    //
    // e.g {'posts/new': PostNew}
    this.identifierToComponentMapping = {
    }

    // Create a navigator Ref for UJS attributes and to enhance the base `visit`
    // and `visit` thunks
    this.navigatorRef = React.createRef()

    // Start Breezy and return an object to prepare the Redux store
    const breezy = start({
      initialPage: this.props.initialPage,
      baseUrl: this.props.baseUrl,
      path: this.props.path,
      // The max number of pages to keep in the store.
      // maxPages: 20
    })
    this.breezy = breezy

    // Build the store and pass Breezy's provided reducer to be combined with
    // your reducers located at `application_reducer.js`
    const {initialState, reducer} = breezy
    this.store = this.buildStore(initialState, reducer)

    // Fire initial events and populate the store
    breezy.prepareStore(this.store)

    // Build visit and remote thunks
    // Your modified `visit` and `remote` will get passed below to the
    // NavComponent then to your components through the provided
    // mapDispatchToProps.
    //
    // You can access them via `this.props.visit` or `this.props.remote`. In
    // your page components
    const {visit, remote} = buildVisitAndRemote(this.navigatorRef, this.store)
    this.visit = visit
    this.remote = remote
  }

  componentDidMount() {
    const { appEl } = this.props
    // Create the ujs event handlers. You can change the ujsAttributePrefix
    // in the event the data attribute conflicts with another.
    this.ujsHandlers = ujsHandlers({
      visit: this.visit,
      remote: this.remote,
      store: this.store,
      ujsAttributePrefix: 'data-bz'
    })
    const {onClick, onSubmit} = this.ujsHandlers

    appEl.addEventListener('click', onClick)
    appEl.addEventListener('submit', onSubmit)
  }

  componentWillUnmount() {
    const { appEl } = this.props
    const {onClick, onSubmit} = this.ujsHandlers

    appEl.removeEventListener('click', onClick)
    appEl.removeEventListener('submit', onSubmit)
  }

  buildStore(initialState, {breezy: breezyReducer, pages: pagesReducer}) {
    // Create the store
    // See `./reducer.js` for an explaination of the two included reducers
    const composeEnhancers = (this.hasWindow && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
    const reducer = this.wrapWithPersistReducer(
      reduceReducers(
        combineReducers({
          breezy: breezyReducer,
          pages: reduceReducers(pagesReducer, applicationPagesReducer),
        }),
        applicationRootReducer
      )
    )
    const store = createStore(
      reducer,
      initialState,
      composeEnhancers(applyMiddleware(thunk))
    )

    if(this.hasWindow) {
      // Persist the store using Redux-Persist
      persistStore(store)
    }

    return store
  }

  wrapWithPersistReducer(reducers) {
    // Redux Persist settings
    // The key is set to the stringified JS asset path to remove the need for
    // migrations when hydrating.
    if (!this.hasWindow) {
      return reducers
    }
    const prefix = 'breezy'
    const persistKey = prefix + this.props.initialPage.assets.filter( asset => asset.endsWith('.js')).join(",")
    const persistConfig = {
      key: persistKey,
      storage,
    }

    // Remove older storage items that were used by previous JS assets
    if (this.hasWindow) {
      const storedKeys = Object.keys(localStorage)
      storedKeys.forEach((key) => {
        if (key.startsWith(`persist:${prefix}`) && key !== persistKey) {
          localStorage.removeItem(key)
        }
      })
    }

    return persistReducer(persistConfig, reducers)
  }

  createHistory() {
    if(this.hasWindow) {
      // This is used for client side rendering
      return createBrowserHistory({})
    } else {
      // This is used for server side rendering
      return createMemoryHistory({})
    }
  }

  render() {
    const history = this.createHistory()

    // The Nav component is pretty bare and can be inherited from for custom
    // behavior or replaced with your own.
    return <Provider store={this.store}>
      <Nav
        store={this.store}
        ref={this.navigatorRef}
        visit={this.visit}
        remote={this.remote}
        mapping={this.identifierToComponentMapping}
        history={history}
        initialPageKey={this.breezy.initialPageKey}
      />
    </Provider>
  }
}
