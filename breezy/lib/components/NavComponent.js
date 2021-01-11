import React from 'react'
import {
  urlToPageKey,
  pathWithoutBZParams,
  argsForHistory,
} from '../utils'
import parse from 'url-parse'
import { REMOVE_PAGE, HISTORY_CHANGE } from '../actions'

function argsForNavInitialState(url) {
  return {
    pageKey: urlToPageKey(url),
    ownProps: {},
  }
}

class Nav extends React.Component {
  constructor(props) {
    super(props)
    const { history, initialPageKey } = this.props

    this.history = history
    this.navigateTo = this.navigateTo.bind(this)
    this.onHistoryChange = this.onHistoryChange.bind(this)
    this.state = argsForNavInitialState(initialPageKey)
  }

  componentDidMount() {
    const { initialPageKey } = this.props

    this.unsubscribeHistory = this.history.listen(
      this.onHistoryChange
    )
    this.history.replace(...argsForHistory(initialPageKey))
  }

  componentWillUnmount() {
    this.unsubscribeHistory()
  }

  navigateTo(
    path,
    { action, ownProps } = { action: 'push', ownProps: {} }
  ) {
    path = pathWithoutBZParams(path)
    const nextPageKey = urlToPageKey(path)
    const { store } = this.props
    const hasPage = !!store.getState().pages[nextPageKey]

    if (hasPage) {
      const prevPageKey = this.history.location.state.pageKey
      const historyArgs = [
        path,
        {
          pageKey: nextPageKey,
          breezy: true,
        },
      ]

      if (action === 'push') {
        this.history.push(...historyArgs)
      }

      if (action === 'replace') {
        this.history.replace(...historyArgs)
      }

      this.setState({ pageKey: nextPageKey, ownProps })

      if (
        action === 'replace' &&
        prevPageKey &&
        prevPageKey !== nextPageKey
      ) {
        store.dispatch({
          type: REMOVE_PAGE,
          payload: {
            pageKey: prevPageKey,
          },
        })
      }

      return true
    } else {
      console.warn(
        `\`navigateTo\` was called , but could not find.
        the pageKey in the store. This may happen when the wrong
        content_location was set in your non-get controller action.
        No navigation will take place`
      )
      return false
    }
  }

  onHistoryChange(location, action) {
    const { store } = this.props
    const { pathname, search, hash, state } = location

    if (state && state.breezy) {
      store.dispatch({
        type: HISTORY_CHANGE,
        payload: { pathname, search, hash },
      })

      const { pageKey } = state
      const containsKey = !!store.getState().pages[pageKey]

      if (containsKey) {
        this.setState({ pageKey })
      } else {
        this.reloadPage()
      }
    }
  }

  reloadPage() {
    window.location.reload()
  }

  notFound(identifier) {
    const { store } = this.props
    let reminder = ''
    if (!identifier) {
      reminder =
        'Did you forget to add `json.component_identifier` in your application.json.props layout?'
    }

    const error = new Error(
      `Breezy Nav component was looking for ${identifier} but could not find it in your mapping. ${reminder}`
    )

    throw error
  }

  render() {
    const { mapping, store, visit, remote } = this.props

    const { pageKey, ownProps } = this.state
    const { componentIdentifier } = store.getState().pages[pageKey]
    const Component = mapping[componentIdentifier]

    if (Component) {
      return (
        <Component
          pageKey={pageKey}
          navigateTo={this.navigateTo}
          visit={visit}
          remote={remote}
          {...ownProps}
        />
      )
    } else {
      this.notFound(componentIdentifier)
    }
  }
}

export default Nav
