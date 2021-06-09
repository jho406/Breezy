import {
  pageReducer,
  metaReducer,
  graftNodeOntoPage,
  updateSameFragmentsOnPage,
  appendReceivedFragmentsOntoPage,
  handleGraft,
} from '../../lib/reducers'

describe('reducers', () => {
  describe('meta reducer', () => {
    describe('BREEZY_HISTORY_CHANGE', () => {
      it('sets the currentPageKey', () => {
        const prevState = { foo: 'bar' }
        const action = {
          type: '@@breezy/HISTORY_CHANGE',
          payload: {
            pathname: '/some_url',
            search: '?foo=123',
            hash: '#title',
          },
        }
        const nextState = metaReducer(prevState, action)

        expect(nextState).toEqual({
          foo: 'bar',
          pathname: '/some_url',
          search: '?foo=123',
          hash: '#title',
          currentPageKey: '/some_url?foo=123',
        })
      })
    })

    describe('BREEZY_SAVE_RESPONSE', () => {
      it('saves the response csrfToken', () => {
        const prevState = { foo: 'bar' }
        const action = {
          type: '@@breezy/SAVE_RESPONSE',
          payload: {
            page: {
              csrfToken: 'some_token',
              assets: ['abc123.js']
            },
          },
        }
        const nextState = metaReducer(prevState, action)

        expect(nextState).toEqual({
          foo: 'bar',
          csrfToken: 'some_token',
          assets: ['abc123.js']
        })
      })
    })

    describe('BREEZY_SET_CSRF_TOKEN', () => {
      it('sets the initial CSRF token', () => {
        const prevState = { foo: 'bar' }
        const action = {
          type: '@@breezy/SET_CSRF_TOKEN',
          payload: {
            csrfToken: 'some_token',
          },
        }
        const nextState = metaReducer(prevState, action)

        expect(nextState).toEqual({
          foo: 'bar',
          csrfToken: 'some_token',
        })
      })
    })
  })

  describe('page reducer', () => {
    describe('BREEZY_HANDLE_GRAFT', () => {
      describe('when receiving a page with fragments to append', () => {
        it('pushes new fragments into the current pages empty fragment', () => {
          const prevState = {
            '/foo': {
              data: {
                a: { b: { c: {} } },
              },
              fragments: [],
              flash: {},
            },
          }

          const receivedPage = {
            data: {},
            path: 'data.a.b.c',
            fragments: [
              {type: 'header', partial: 'header', path: 'data.a.b.c'}
            ],
            flash: {},
          }

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })

          expect(nextState).toEqual({
            '/foo': {
              data: {
                a: { b: { c: {} } },
              },
              fragments: [
                {type: 'header', partial: 'header', path: 'data.a.b.c'}
              ],
              flash: {},
            },
          })
        })

        it('ignore duplicates when pushing a new fragment', () => {
          const prevState = {
            '/foo': {
              data: {
                a: { b: { c: {} } },
              },
              fragments: [
                {type: 'header', partial: 'header', path: 'data.a.b.c'}
              ],
              flash: {},
            },
          }
          const receivedPage = {
            data: {},
            path: 'data.a.b.c',
            fragments: [
              {type: 'header', partial: 'header', path: 'data.a.b.c'}
            ],
            flash: {},
          }

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })

          expect(nextState).toEqual({
            '/foo': {
              data: {
                a: { b: { c: {} } },
              },
              fragments: [
                {type: 'header', partial: 'header', path: 'data.a.b.c'}
              ],
              flash: {}
            },
          })
        })
      })

      describe('Updating fragments on the current page with the same name as the received page', () => {
        it('does no additional update if there is no fragments in the current page', () => {
          const prevState = {
            '/foo': {
              data: {
                a: { b: { c: {} } },
                d: { e: { f: {} } },
              },
              fragments: [],
              flash: {},
            },
          }

          const receivedPage = {
            data: {},
            path: 'data.d.e.f',
            fragments: [
              {type: 'header', partial: 'header', path: 'data.d.e.f'}
            ],
            flash: {},
          }

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })

          expect(nextState).toEqual({
            '/foo': {
              data: {
                a: { b: { c: {} } },
                d: { e: { f: {} } },
              },
              fragments: [
                {type: 'header', partial: 'header', path: 'data.d.e.f'}
              ],
              flash: {}
            },
          })
        })

        it('updates no fragment when there is no new fragment in the received graft', () => {
          const prevState = {
            '/foo': {
              data: {
                a: { b: { c: {} } },
                d: { e: { f: {} } },
              },
              fragments: [
                {type: 'header', partial: 'header', path: 'data.d.e.f'}
              ],
              flash: {}
            },
          }

          const receivedPage = {
            data: {},
            path: 'data.a.b.c',
            fragments: [],
            flash: {}
          }

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })

          expect(nextState).toEqual(nextState)
        })
      })

      describe('grafting a received node onto the page', () => {
        it('returns the state when pathToNode is empty', () => {
          const prevState = {
            '/foo': {
              data: { a: { b: { c: {} } } },
              fragments: [],
              flash: {},
            },
          }
          const receivedPage = {
            data: { foo: 1 },
            fragments: [],
            flash: {},
          }
          const pageKey = '/foo'

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })
          expect(nextState).toEqual(prevState)
        })

        it('grafts a received node onto the current page', () => {
          const pageKey = '/foo'
          const prevState = {
            '/foo': {
              data: { a: { b: { c: {} } } },
              fragments: [],
              flash: {},
            },
          }

          const receivedPage = {
            data: { foo: 1 },
            path: 'data.a.b.c',
            fragments: [],
            flash: {},
          }

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })

          expect(nextState).toEqual({
            '/foo': {
              data: { a: { b: { c: { foo: 1 } } } },
              fragments: [],
              flash: {}
            },
          })
        })

        it('throws cant find page if the page does not exist for grafting', () => {
          const prevState = {}

          const receivedPage = {
            data: { foo: 1 },
            path: 'data.a.b.c',
          }

          expect(() => {
            pageReducer(prevState, {
              type: '@@breezy/HANDLE_GRAFT',
              payload: {
                pageKey: '/foo',
                page: receivedPage,
              },
            })
          }).toThrow(
            new Error(
              'Breezy was looking for /foo in your state, but could not find it in your mapping. Did you forget to pass in a valid pageKey to this.props.remote or this.props.visit?'
            )
          )
        })

        it('does not mutate the state when search results are empty', () => {
          jest.spyOn(console, 'warn')

          const prevState = {
            '/foo': {
              data: { a: { b: { c: {} } } },
              fragments: [],
              flash: {},
            },
          }

          const receivedPage = {
            path: 'data.a.b.c',
            flash: {},
          }

          const nextState = pageReducer(prevState, {
            type: '@@breezy/HANDLE_GRAFT',
            payload: {
              pageKey: '/foo',
              page: receivedPage,
            },
          })

          expect(console.warn).toHaveBeenCalledWith(
            'There was no node returned in the response. Do you have the correct key path in your bzq?'
          )
          expect(nextState).toEqual(prevState)
        })
      })
    })

    describe('BREEZY_SAVE_RESPONSE', () => {
      it('saves page', () => {
        const prevState = {}
        const nextState = pageReducer(prevState, {
          type: '@@breezy/SAVE_RESPONSE',
          payload: {
            pageKey: '/foo',
            page: {
              data: {},
              csrfToken: 'token',
              assets: ['application-123.js'],
            },
          },
        })

        expect(nextState['/foo']).toEqual(
          expect.objectContaining({
            data: {},
            csrfToken: 'token',
            assets: ['application-123.js'],
            pageKey: '/foo',
            fragments: [],
          })
        )
      })

      it('saves a maximum of 20 pages', () => {
        const prevState = {}

        for (var i = 0; i < 20; i++) {
          prevState[`/foo${i}`] = {
            data: {},
            csrfToken: 'token',
            assets: ['application-123.js'],
            pageKey: '/foo',
            fragments: [],
            savedAt: i,
          }
        }

        const nextState = pageReducer(prevState, {
          type: '@@breezy/SAVE_RESPONSE',
          payload: {
            pageKey: '/foo21',
            page: {
              data: {},
              csrfToken: 'token',
              assets: ['application-123.js'],
            },
          },
        })

        expect(Object.keys(nextState).length).toEqual(20)
        expect(nextState.hasOwnProperty('/foo21')).toEqual(true)
        expect(nextState.hasOwnProperty('/foo0')).toEqual(false)
      })

      it('uses existing deferred nodes as placeholders when there is already a page in the store', () => {
        const prevState = {
          '/foo': {
            data: {
              foo: {
                bar: {
                  greetings: 'hello world',
                },
              },
            },
            pageKey: '/foo',
            defers: [{ url: '/foo?bzq=data.foo.bar', path: 'data.foo.bar' }],
            fragments: [],
          },
        }

        const receivedPage = {
          data: {
            foo: {
              baz: { name: 'john' },
              bar: {},
            },
          },
          defers: [{ url: '/foo?bzq=data.foo.bar', path: 'data.foo.bar' }],
          fragments: [],
        }

        const nextState = pageReducer(prevState, {
          type: '@@breezy/SAVE_RESPONSE',
          payload: {
            pageKey: '/foo',
            page: receivedPage,
          },
        })

        expect(nextState['/foo']).toEqual({
          data: {
            foo: {
              baz: { name: 'john' },
              bar: {
                greetings: 'hello world',
              },
            },
          },
          pageKey: '/foo',
          defers: [{ url: '/foo?bzq=data.foo.bar', path: 'data.foo.bar' }],
          fragments: [],
          savedAt: expect.any(Number),
        })
      })

      it('uses existing fragment nodes as placeholders for deferred fragments', () => {
        const prevState = {
          '/bar': {
            data: {
              foo: {
                bar: {
                  greetings: 'prev greeting',
                },
              },
            },
            pageKey: '/bar',
            defers: [{ url: '/bar?bzq=data.foo.bar', path: 'data.foo.bar' }],
            fragments: [
              { type: 'info', partial: 'info', path: 'data.foo.bar' }
            ],
          },
        }

        const receivedPage = {
          data: {
            foo: {
              bar: {},
            },
            baz: 'received',
          },
          defers: [{ url: '/bar?bzq=data.foo.bar', path: 'data.foo.bar' }],
          fragments: [
            { type: 'info', partial: 'info', path: 'data.foo.bar' }
          ],
        }

        const nextState = pageReducer(prevState, {
          type: '@@breezy/SAVE_RESPONSE',
          payload: {
            pageKey: '/bar',
            page: receivedPage,
          },
        })

        expect(nextState['/bar']).toEqual({
          data: {
            foo: {
              bar: {
                greetings: 'prev greeting',
              },
            },
            baz: 'received',
          },
          pageKey: '/bar',
          defers: [{ url: '/bar?bzq=data.foo.bar', path: 'data.foo.bar' }],
          fragments: [
            { type: 'info', partial: 'info', path: 'data.foo.bar' }
          ],
          savedAt: expect.any(Number),
        })
      })

      it('does nothing when there are no prev fragments to use as placeholder', () => {
        const prevState = {
          '/bar': {
            data: {
              foo: {
                bar: {
                  greetings: 'hello world',
                },
              },
            },
            pageKey: '/bar',
            defers: [{ url: '/bar?bzq=data.foo.bar', path: 'data.foo.bar' }],
            fragments: [],
          },
        }

        const receivedPage = {
          data: {
            foo: {
              bar: {},
            },
          },
          defers: [{ url: '/foo?bzq=data.foo.bar', path: 'data.foo.bar' }],
          fragments: [
            { type: 'info', partial: 'info', path: 'data.foo.bar' }
          ],
        }

        const nextState = pageReducer(prevState, {
          type: '@@breezy/SAVE_RESPONSE',
          payload: {
            pageKey: '/foo',
            page: receivedPage,
          },
        })

        expect(nextState['/foo']).toEqual({
          data: {
            foo: {
              bar: {},
            },
          },
          pageKey: '/foo',
          defers: [{ url: '/foo?bzq=data.foo.bar', path: 'data.foo.bar' }],
          fragments: [
            { type: 'info', partial: 'info', path: 'data.foo.bar' }
          ],
          savedAt: expect.any(Number),
        })
      })
    })
  })
})
