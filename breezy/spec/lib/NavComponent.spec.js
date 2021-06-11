import React from 'react'
import fetchMock from 'fetch-mock'
import * as rsp from '../fixtures'
import { Provider } from 'react-redux'
import { createMemoryHistory } from 'history'
import configureMockStore from 'redux-mock-store'
import Nav from '../../lib/components/Nav'
import { mount } from 'enzyme'

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
    it('navigates to the specified page', () => {
      const history = createMemoryHistory({})
      history.push("/bar", {
        breezy: true,
        pageKey: '/bar',
      })
      let expected = '<div><h1>About Page</h1></div>'

      class ExampleAbout extends About {
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

      const component = mount(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: Home, about: About }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>
      )
      expect(component.find(Home).exists()).toBe(true)
      expect(component.find(About).exists()).toBe(false)

      component.find('button').simulate('click')

      expect(component.find(Home).exists()).toBe(false)
      expect(component.find(About).exists()).toBe(true)
    })

    it('does not navigate to the specified page if the page is not in the store', () => {
      const history = createMemoryHistory({})
      const mockStore = configureMockStore()
      const store = mockStore({
        pages: {
          '/bar': { componentIdentifier: 'home' },
        },
        breezy: {
          csrfToken: "abc"
        }
      })

      const component = mount(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: Home, about: About }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>
      )

      expect(component.find(Home).exists()).toBe(true)
      expect(component.find(About).exists()).toBe(false)

      component.find('button').simulate('click')

      expect(component.find(Home).exists()).toBe(true)
      expect(component.find(About).exists()).toBe(false)
    })

    it('navigates to the specified page and calls the action when used with react-redux', () => {
      const history = createMemoryHistory({})
      history.push("/bar", {
        breezy: true,
        pageKey: '/bar',
      })
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

      const component = mount(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: Home, about: About }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>
      )
      component.find('button').simulate('click')
      expect(component.find(Home).exists()).toBe(false)
      expect(component.find(About).exists()).toBe(true)

      const expectedActions = [
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
    })

    it('navigates to the page when history changes', () => {
      const history = createMemoryHistory({})
      history.push("/bar", {
        breezy: true,
        pageKey: '/bar',
      })
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
      let visitedAbout = false
      let returnedHome = false

      class ExampleHome extends Home {
        componentDidMount() {
          if (mountTimes == 1) {
            returnedHome = true
          }
          mountTimes++
        }
      }

      class ExampleAbout extends About {
        componentDidMount() {
          visitedAbout = true
          history.goBack()
        }
      }

      const component = mount(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: ExampleHome, about: ExampleAbout }}
            initialPageKey={'/bar'}
            history={history}
          />
        </Provider>
      )

      component.find('button').simulate('click')
      expect(visitedAbout).toBe(true)
      expect(returnedHome).toBe(true)
    })
  })
})
