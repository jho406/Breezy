import { JSDOM } from 'jsdom'
import { render } from 'react-dom'
import start from '../../lib/index'
import fetchMock from 'fetch-mock'
import * as rsp from '../fixtures'
import React from 'react'
import { mapStateToProps, mapDispatchToProps } from '../../lib/utils/react'
import { Provider, connect } from 'react-redux'
import { createMemoryHistory } from 'history'
import configureMockStore from 'redux-mock-store'
import Nav from '../../lib/components/NavComponent.js'

const createScene = (html) => {
  const dom = new JSDOM(`${html}`, { runScripts: 'dangerously' })
  return { dom, target: dom.window.document.body.firstElementChild }
}

class Home extends React.Component {
  constructor(props) {
    super(props)
    this.enhancedVisit = this.visit.bind(this)
  }

  visit() {
    this.props.navigateTo('/foo')
  }

  render() {
    return (
      <div>
        Home Page
        <button onClick={this.enhancedVisit}> click </button>
      </div>
    )
  }
}

class About extends React.Component {
  render() {
    return <h1>About Page</h1>
  }
}

describe('Nav', () => {
  describe('navigateTo', () => {
    it('navigates to the specified page', (done) => {
      const history = createMemoryHistory({})
      const { dom, target } = createScene('<div></div>')

      class ExampleAbout extends About {
        componentDidMount() {
          let expected = '<div><h1>About Page</h1></div>'
          expect(dom.window.document.body.innerHTML).toEqual(expected)
          done()
        }
      }

      const mockStore = configureMockStore()
      const store = mockStore({
        pages: {
          '/foo': { componentIdentifier: 'about' },
          '/bar': { componentIdentifier: 'home' },
        },
        breezy: {
          csrfToken: "abc"
        }
      })

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: Home, about: ExampleAbout }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>,
        target
      )
      target.getElementsByTagName('button')[0].click()
    })

    it('does not navigates to the specified page if the page is not in the store', (done) => {
      const history = createMemoryHistory({})
      const { dom, target } = createScene('<div></div>')

      class ExampleHome extends Home {
        visit() {
          expect(this.props.navigateTo('/foo')).toEqual(false)
          expect(history.length).toEqual(1)
          done()
        }
      }

      const mockStore = configureMockStore()
      const store = mockStore({
        pages: {
          '/bar': { componentIdentifier: 'home' },
        },
        breezy: {
          csrfToken: "abc"
        }
      })

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: ExampleHome, about: About }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>,
        target
      )
      target.getElementsByTagName('button')[0].click()
    })

    it('navigates to the specified page and calls the action when used with react-redux', (done) => {
      const history = createMemoryHistory({})
      const { dom, target } = createScene('<div></div>')

      const mockStore = configureMockStore()
      const store = mockStore({
        pages: {
          '/foo': { componentIdentifier: 'about' },
          '/bar': { componentIdentifier: 'home' },
        },
        breezy: {
          csrfToken: "abc"
        }
      })

      class ExampleAbout extends About {
        componentDidMount() {
          const expectedActions = [
            {
              type: '@@breezy/HISTORY_CHANGE',
              payload: {
                pathname: '/bar',
                search: '',
                hash: '',
              }
            },
            {
              type: '@@breezy/HISTORY_CHANGE',
              payload: {
                pathname: '/foo',
                search: '',
                hash: '',
              }
            },
          ]
          expect(store.getActions()).toEqual(expectedActions)
          done()
        }
      }

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: Home, about: ExampleAbout }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>,
        target
      )
      target.getElementsByTagName('button')[0].click()
    })

    it('navigates to the page when history changes', (done) => {
      const history = createMemoryHistory({})
      const { dom, target } = createScene('<div></div>')
      const mockStore = configureMockStore()
      const store = mockStore({
        pages: {
          '/bar': { componentIdentifier: 'home' },
          '/foo': { componentIdentifier: 'about' },
        },
        breezy: {
          csrfToken: "abc"
        }
      })

      let mountTimes = 0

      class ExampleHome extends Home {
        componentDidMount() {
          if (mountTimes == 1) {
            let expected =
              '<div><div>Home Page<button> click </button></div></div>'
            expect(dom.window.document.body.innerHTML).toEqual(expected)
            done()
          }
          mountTimes++
        }
      }

      class ExampleAbout extends About {
        componentDidMount() {
          history.goBack()
        }
      }

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: ExampleHome, about: ExampleAbout }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>,
        target
      )
      target.getElementsByTagName('button')[0].click()
    })
  })
})
