import React from 'react'
import { urlToPageKey, pathWithoutBZParams } from '../utils'
import { REMOVE_PAGE, HISTORY_CHANGE } from '../actions'
import PropTypes from 'prop-types'

class Nav extends React.Component {
  constructor(props) {
    super(props)
    const { history, initialPageKey } = this.props
    this.history = history
    this.navigateTo = this.navigateTo.bind(this)
    this.onHistoryChange = this.onHistoryChange.bind(this)
    this.state = {
      pageKey: initialPageKey,
      ownProps: {},
    }
  }

  componentDidMount() {
    this.unsubscribeHistory = this.history.listen(
      this.onHistoryChange
    )
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

  onHistoryChange(location) {
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
    const { store, visit, remote } = this.props
    const { pageKey, ownProps } = this.state
    const { componentIdentifier } = store.getState().pages[pageKey]
    const Component = this.props.mapping[componentIdentifier]

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

Nav.propTypes = {
  store: PropTypes.object,
  history: PropTypes.object,
  mapping: PropTypes.object,
  visit: PropTypes.func,
  remote: PropTypes.func,
  initialPageKey: PropTypes.string,
}

export default Nav
