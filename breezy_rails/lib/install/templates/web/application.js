import React from 'react';
import { combineReducers, createStore, applyMiddleware, compose } from 'redux';
import reduceReducers from 'reduce-reducers';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { render } from 'react-dom';
import { ApplicationBase } from '@jho406/breezy';
import Nav from '@jho406/breezy/components/NavComponent';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { applicationRootReducer, applicationPagesReducer } from './reducer';
import { buildVisitAndRemote } from './application_visit';

// Mapping between your props template to Component, you must add to this
// to register any new page level component you create. If you are using the
// scaffold, it will auto append the identifers for you.
//
// e.g {'posts/new': PostNew}
const identifierToComponentMapping = {
};

if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    const appEl = document.getElementById("app");
    const location = window.location;

    if (appEl) {
      render(
        <Application
          appEl={appEl}
          // The base url prefixed to all calls made by the `visit`
          // and `remote` thunks.
          baseUrl={location.origin}
          // The global var BREEZY_INITIAL_PAGE_STATE is set by your erb
          // template, e.g., index.html.erb
          initialPage={window.BREEZY_INITIAL_PAGE_STATE}
          // The initial path of the page, e.g., /foobar
          path={location.pathname + location.search + location.hash}
          buildVisitAndRemote={buildVisitAndRemote}
        />,
        appEl
      );
    }
  });
}

export default class Application extends ApplicationBase {
  mapping() {
    return identifierToComponentMapping;
  }

  visitAndRemote(navRef, store) {
    return buildVisitAndRemote(navRef, store);
  }

  buildStore(initialState, { breezy: breezyReducer, pages: pagesReducer }) {
    // Create the store
    // See `./reducer.js` for an explaination of the two included reducers
    const composeEnhancers =
      (this.hasWindow && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
      compose;
    const reducer = this.wrapWithPersistReducer(
      reduceReducers(
        combineReducers({
          breezy: breezyReducer,
          pages: reduceReducers(pagesReducer, applicationPagesReducer),
        }),
        applicationRootReducer
      )
    );
    const store = createStore(
      reducer,
      initialState,
      composeEnhancers(applyMiddleware(thunk))
    );

    if (this.hasWindow) {
      // Persist the store using Redux-Persist
      persistStore(store);
    }

    return store;
  }

  wrapWithPersistReducer(reducers) {
    // Redux Persist settings
    // The key is set to the stringified JS asset path to remove the need for
    // migrations when hydrating.
    if (!this.hasWindow) {
      return reducers;
    }
    const prefix = "breezy";
    const persistKey =
      prefix +
      this.props.initialPage.assets
        .filter((asset) => asset.endsWith(".js"))
        .join(",");
    const persistConfig = {
      key: persistKey,
      storage,
    };

    // Remove older storage items that were used by previous JS assets
    if (this.hasWindow) {
      const storedKeys = Object.keys(localStorage);
      storedKeys.forEach((key) => {
        if (key.startsWith(`persist:${prefix}`) && key !== persistKey) {
          localStorage.removeItem(key);
        }
      });
    }

    return persistReducer(persistConfig, reducers);
  }
}
