import { JSDOM } from 'jsdom'
import { start } from '../../lib/index'
import fetchMock from 'fetch-mock'
import * as rsp from '../fixtures'
import { render } from 'react-dom'
import thunk from 'redux-thunk'
import { combineReducers, createStore, applyMiddleware } from 'redux'
import { Provider, connect } from 'react-redux'
import React from 'react'
import { mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote } from '../../lib/utils/react'
import { createMemoryHistory } from 'history'
import Nav from '../../lib/components/NavComponent'
import { config } from '../../lib/config'

process.on('unhandledRejection', (r) => console.log(r))

const createScene = (html, url = 'http://localhost') => {
  const dom = new JSDOM(`${html}`, { runScripts: 'dangerously', url })
  return { dom, target: dom.window.document.body.firstElementChild }
}

class Home extends React.Component {
  constructor(props) {
    super(props)
    this.enhancedVisit = this.visit.bind(this)
  }

  visit() {
    this.props.visit('/foo').then(() => {
      this.props.navigateTo('/foo')
    })
  }

  render() {
    return (
      <div>
        Home Page, {this.props.heading}
        <button onClick={this.enhancedVisit}> click </button>
      </div>
    )
  }
}

class About extends React.Component {
  render() {
    return <h1>About Page, {this.props.heading}</h1>
  }
}

describe('start', () => {
  it('sets the stage', () => {
    const { dom, target } = createScene(`<div></div>`, 'http://localhost/bar')
    const initialPage = {
      data: {
        heading: 'this is page 1',
      },
      flash: {},
      componentIdentifier: 'home',
      assets: ['123.js', '123.css'],
      csrfToken: 'token'
    }

    const bz = start({
      initialPage,
      baseUrl: 'http://example.com/base/',
      path: 'http://example.com/bar?some=123#title',
    })
    const { reducer, initialState, initialPageKey } = bz
    const store = createStore(
      combineReducers(reducer),
      initialState,
      applyMiddleware(thunk)
    )

    bz.prepareStore(store)

    expect(config.baseUrl).toEqual("http://example.com/base/")
    expect(store.getState()).toEqual({
      breezy:{
        currentPageKey: '/bar?some=123',
        pathname: '/bar',
        search: '?some=123',
        hash: '#title',
        csrfToken: 'token',
        assets: [ '123.js', '123.css' ],
      },
      pages:{
        '/bar?some=123':{
          pageKey: '/bar?some=123',
          fragments: [],
          data: {
            heading: 'this is page 1',
          },
          flash: {},
          componentIdentifier: 'home',
          assets: [ '123.js', '123.css' ],
          csrfToken: 'token',
          savedAt: jasmine.any(Number),
        }
      }
    })
  })
})

function createBreezyApp({history, fetch} = {}) {
  history = history ? history : createMemoryHistory({})

  const { dom, target } = createScene(`<div></div>`, 'http://localhost/bar')
  const initialPage = {
    data: {
      heading: 'this is page 1',
    },
    flash: {},
    componentIdentifier: 'home',
    assets: ['123.js', '123.css'],
    csrfToken: 'token'
  }

  const bz = start({
    fetch,
    initialPage,
    history,
    baseUrl: '',
    path: '/bar',
  })
  const { reducer, initialState, initialPageKey } = bz
  const store = createStore(
    combineReducers(reducer),
    initialState,
    applyMiddleware(thunk)
  )
  bz.prepareStore(store)

  return {history, initialPageKey, store, dom, target}
}

fetchMock.mock()

describe('navigation', () => {
  beforeEach(() => {
    fetchMock.restore()
  })

  describe('when an action pushes history', () => {
    it('saves the page and updates history', (done) => {
      const {
        store,
        history,
        initialPageKey,
        target
      } = createBreezyApp({fetch})

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(Home)

      class ExampleAbout extends About {
        componentDidMount() {
          const state = store.getState()
          expect(state.pages['/foo']).toEqual(pageState)
          expect(history.location.pathname).toEqual('/foo')
          expect(history.location.search).toEqual('')
          expect(history.location.hash).toEqual('')
          done()
        }
      }

      const VisibleAbout = connect(
        mapStateToProps,
        mapDispatchToPropsIncludingVisitAndRemote
      )(ExampleAbout)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: VisibleHome, about: VisibleAbout }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )

      const mockResponse = rsp.visitSuccess()
      mockResponse.headers['x-response-url'] = '/foo'
      fetchMock.mock('/foo?__=0', mockResponse)

      const pageState = {
        data: { heading: 'Some heading 2' },
        flash: {},
        csrfToken: 'token',
        assets: ['application-123.js', 'application-123.js'],
        componentIdentifier: 'about',
        pageKey: '/foo',
        fragments: [],
        savedAt: jasmine.any(Number),
      }

      target.getElementsByTagName('button')[0].click()
    })

    it('saves the page and updates history with hash', (done) => {
      const {
        store,
        history,
        initialPageKey,
        target
      } = createBreezyApp({fetch})

      class ExampleHome extends Home {
        visit() {
          this.props.visit('/foo#title').then(() => this.props.navigateTo('/foo#title'))
        }
      }

      class ExampleAbout extends About {
        componentDidMount() {
          const state = store.getState()
          expect(state.pages['/foo']).toEqual(pageState)
          expect(history.location.pathname).toEqual('/foo')
          expect(history.location.search).toEqual('')
          expect(history.location.hash).toEqual('#title')
          done()
        }
      }

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)
      const VisibleAbout = connect(
        mapStateToProps,
        mapDispatchToPropsIncludingVisitAndRemote
      )(ExampleAbout)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: VisibleHome, about: VisibleAbout }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )

      const mockResponse = rsp.visitSuccess()
      mockResponse.headers['x-response-url'] = '/foo'
      fetchMock.mock('/foo?__=0', mockResponse)

      const pageState = {
        data: { heading: 'Some heading 2' },
        flash: {},
        csrfToken: 'token',
        assets: ['application-123.js', 'application-123.js'],
        componentIdentifier: 'about',
        pageKey: '/foo',
        fragments: [],
        savedAt: jasmine.any(Number),
      }

      target.getElementsByTagName('button')[0].click()
    })

    describe('and the action is to a non-breezy app', () => {
      it('does nothing to the store', (done) => {
        const {
          store,
          history,
          initialPageKey,
          target
        } = createBreezyApp()
        const navigatorRef = React.createRef()

        history.listen(({pathname}) => {
          if (pathname == '/some_html_page') {
            const state = store.getState()
            expect(state.breezy.currentPageKey).toEqual('/bar')
            expect(navigatorRef.current.state.pageKey).toEqual('/bar')
            expect(pathname).toEqual('/some_html_page')
            done()
          }
        })

        class ExampleHome extends Home {
          componentDidMount() {
            process.nextTick(() => history.push('/some_html_page'))
          }
        }

        const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)
        render(
          <Provider store={store}>
            <Nav
              store={store}
              ref={navigatorRef}
              mapping={{ home: VisibleHome }}
              history={history}
              initialPageKey={initialPageKey}
            />
          </Provider>,
          target
        )
      })
    })
  })

  describe('when an action replaces history', ()=> {
    it('removes the previous page in the store', (done)=> {
      const {
        store,
        history,
        initialPageKey,
        target
      } = createBreezyApp({fetch})
      const navigatorRef = React.createRef()

      class ExampleHome extends Home {
        visit() {
          this.props.visit('/foo').then(() => {
            this.props.navigateTo('/foo', { action: 'replace' })
          })
        }
      }

      class ExampleAbout extends About {
        componentDidMount() {
          process.nextTick(() => {
            const state = store.getState()
            expect(Object.keys(state.pages)).toEqual(['/foo'])
            expect(state.breezy.currentPageKey).toEqual('/foo')
            expect(history.location.pathname).toEqual('/foo')
            expect(history.location.search).toEqual('')
            expect(history.location.hash).toEqual('')
            expect(navigatorRef.current.state.pageKey).toEqual('/foo')

            done()
          })
        }
      }

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)
      const VisibleAbout = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleAbout)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            ref={navigatorRef}
            mapping={{ home: VisibleHome, about: VisibleAbout }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )

      const mockResponse = rsp.visitSuccess()
      mockResponse.headers['x-response-url'] = '/foo'
      fetchMock.mock('/foo?__=0', mockResponse)

      target.getElementsByTagName('button')[0].click()
    })

    it('does nothing when we replace the same page', (done)=> {
      const {
        store,
        history,
        initialPageKey,
        target
      } = createBreezyApp({fetch})
      const navigatorRef = React.createRef()

      class ExampleHome extends Home {
        visit() {
          this.props.navigateTo('/bar', { action: 'replace' })
        }

        componentDidMount() {
          process.nextTick(() => {
            const state = store.getState()
            expect(Object.keys(state.pages)).toEqual(['/bar'])
            expect(state.breezy.currentPageKey).toEqual('/bar')
            expect(history.location.pathname).toEqual('/bar')
            expect(history.location.search).toEqual('')
            expect(history.location.hash).toEqual('')
            expect(navigatorRef.current.state.pageKey).toEqual('/bar')

            done()
          })
        }
      }

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            ref={navigatorRef}
            mapping={{ home: VisibleHome }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )

      const mockResponse = rsp.visitSuccess()
      mockResponse.headers['x-response-url'] = '/foo'
      fetchMock.mock('/foo?__=0', mockResponse)

      target.getElementsByTagName('button')[0].click()
    })
  })

  describe('when an action pops history', () => {
    it('loads the page from the store', (done) => {
      const {
        store,
        history,
        initialPageKey,
        target
      } = createBreezyApp({fetch})
      let mountNum = 0
      const navigatorRef = React.createRef()

      class ExampleHome extends Home {
        componentDidMount() {
          if(mountNum == 1) {
            const state = store.getState()
            expect(state.breezy.currentPageKey).toEqual('/bar')
            expect(history.location.pathname).toEqual('/bar')
            expect(history.location.search).toEqual('')
            expect(history.location.hash).toEqual('')
            expect(navigatorRef.current.state.pageKey).toEqual('/bar')

            done()
          }
          mountNum ++
        }
      }

      class ExampleAbout extends About {
        componentDidMount() {
          process.nextTick(() => history.goBack() )
        }
      }

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)
      const VisibleAbout = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleAbout)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            ref={navigatorRef}
            mapping={{ home: VisibleHome, about: VisibleAbout }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )

      const mockResponse = rsp.visitSuccess()
      mockResponse.headers['x-response-url'] = '/foo'
      fetchMock.mock('/foo?__=0', mockResponse)

      target.getElementsByTagName('button')[0].click()
    })

    it('does not change current page when the hash changes', (done) => {
      const existingHistory = createMemoryHistory({})
      existingHistory.push("/bar#title", {
        breezy: true,
        pageKey: '/bar',
      })
      existingHistory.push("/bar") // Gets replaced on Breezy.start

      const {
        store,
        history,
        initialPageKey,
        target
      } = createBreezyApp({history: existingHistory})

      const navigatorRef = React.createRef()

      history.listen(({pathname, hash}) => {
        if (hash === '#title') {
          const state = store.getState()
          expect(state.breezy.currentPageKey).toEqual('/bar')
          expect(navigatorRef.current.state.pageKey).toEqual('/bar')
          expect(pathname).toEqual('/bar')
          expect(hash).toEqual('#title')
          done()
        }
      })

      class ExampleHome extends Home {
        componentDidMount() {
          process.nextTick(() => history.goBack())
        }
      }

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            ref={navigatorRef}
            mapping={{ home: VisibleHome }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )
    })

    it('refreshes when the page has been evicted', (done) => {
      const existingHistory = createMemoryHistory({})
      existingHistory.push("/evicited", {
        breezy: true,
        pageKey: '/no_longer_exist',
      })
      existingHistory.push("/bar") // Gets replaced on Breezy.start

      const {
        store,
        history,
        initialPageKey,
        target,
        dom
      } = createBreezyApp({history: existingHistory})
      const navigatorRef = React.createRef()

      class ExampleHome extends Home {
        componentDidMount() {
          history.listen(({pathname, hash}) => {
            process.nextTick(() => {
              expect(Nav.prototype.reloadPage).toHaveBeenCalled()
              done()
            })
          })

          process.nextTick(() => history.goBack())
        }
      }

      spyOn(Nav.prototype, 'reloadPage')

      const VisibleHome = connect(mapStateToProps, mapDispatchToPropsIncludingVisitAndRemote)(ExampleHome)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            ref={navigatorRef}
            mapping={{ home: VisibleHome }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )
    })
  })

  describe('when an action results in a graft', () => {
    it('grafts the node', (done) => {
      let history = createMemoryHistory({})
      let { dom, target } = createScene(`<div></div>`, 'http://localhost/foo')

      let initialPage = {
        data: {
          heading: 'this is page 1',
          address: undefined,
        },
        flash: {},
        componentIdentifier: 'home',
      }

      const bz = start({
        fetch,
        initialPage,
        history,
        baseUrl: '',
        path: '/foo',
      })

      const { reducer, initialState, initialPageKey } = bz
      const store = createStore(
        combineReducers(reducer),
        initialState,
        applyMiddleware(thunk)
      )

      bz.prepareStore(store)

      class ExampleHome extends Home {
        visit() {
          this.props.remote('/foo?bzq=address')
        }

        componentDidUpdate() {
          const state = store.getState()
          expect(state.pages['/foo'].data.address).toEqual({ zip: 91210 })
          done()
        }
      }

      const VisibleHome = connect(
        mapStateToProps,
        mapDispatchToPropsIncludingVisitAndRemote
      )(ExampleHome)

      render(
        <Provider store={store}>
          <Nav
            store={store}
            mapping={{ home: VisibleHome }}
            history={history}
            initialPageKey={initialPageKey}
          />
        </Provider>,
        target
      )

      const mockResponse = rsp.graftSuccessWithNewZip()
      mockResponse.headers['x-response-url'] = '/foo'
      fetchMock.mock('/foo?bzq=address&__=0', mockResponse)

      target.getElementsByTagName('button')[0].click()
    })
  })
})
