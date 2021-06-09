import { isValidResponse, argsForFetch } from '../../../lib/utils/request'
import parse from 'url-parse'
import Headers from 'fetch-headers'

describe('isValidResponse', () => {
  it('returns true if valid', () => {
    const headers = new Headers([
      ['content-type', 'application/json'],
      ['content-disposition', 'inline'],
    ])

    const rsp = {
      headers,
    }

    expect(isValidResponse(rsp)).toBe(true)
  })

  it('returns false when disposition is attachment', () => {
    const headers = new Headers([
      ['content-type', 'text/javascript'],
      ['content-disposition', 'attachment'],
    ])

    const rsp = {
      headers,
    }

    expect(isValidResponse(rsp)).toBe(false)
  })

  it('returns false when content-type is not javascript', () => {
    const headers = new Headers([
      ['content-type', 'text/html'],
      ['content-disposition', 'inline'],
    ])

    const rsp = {
      headers,
    }

    expect(isValidResponse(rsp)).toBe(false)
  })
})

describe('argsForFetch', () => {
  it('returns fetch arguments', () => {
    const getState = () => {
      return {
        breezy: {},
      }
    }

    const args = argsForFetch(getState, '/foo')

    expect(args).toEqual([
      '/foo?__=0',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-breezy-request': true,
        },
        credentials: 'same-origin',
        signal: undefined,
      },
    ])
  })

  it('returns fetch arguments with passed signal for aborts', () => {
    const getState = () => {
      return {
        breezy: {},
      }
    }

    const { signal } = new AbortController

    const args = argsForFetch(getState, '/foo', { signal })

    expect(args).toEqual([
      '/foo?__=0',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-breezy-request': true,
        },
        signal,
        credentials: 'same-origin',
      },
    ])
  })


  it('returns fetch arguments with content-type json and method POST on non-GETs', () => {
    const getState = () => {
      return {
        breezy: {},
      }
    }

    const args = argsForFetch(getState, '/foo', { method: 'PUT' })

    expect(args).toEqual([
      '/foo?__=0',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-breezy-request': true,
          'content-type': 'application/json',
          'x-http-method-override': 'PUT',
        },
        signal: undefined,
        credentials: 'same-origin',
        body: '',
      },
    ])
  })

  it('returns fetch arguments x-xhr-referer when currentPageKey is set in state', () => {
    const getState = () => {
      return {
        breezy: {
          currentPageKey: '/some_current_url',
        },
      }
    }

    const args = argsForFetch(getState, '/foo')

    expect(args).toEqual([
      '/foo?__=0',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-breezy-request': true,
          'x-xhr-referer': '/some_current_url',
        },
        signal: undefined,
        credentials: 'same-origin',
      },
    ])
  })

  it('returns fetch args and ignores body on GET or HEAD', () => {
    const getState = () => {
      return {
        breezy: {},
      }
    }

    expect(argsForFetch(getState, '/foo', { body: 'ignored' })).toEqual([
      '/foo?__=0',
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-breezy-request': true,
        },
        signal: undefined,
        credentials: 'same-origin',
      },
    ])

    expect(
      argsForFetch(getState, '/foo', { method: 'HEAD', body: 'ignored' })
    ).toEqual([
      '/foo?__=0',
      {
        method: 'HEAD',
        headers: {
          accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'x-breezy-request': true,
        },
        signal: undefined,
        credentials: 'same-origin',
      },
    ])
  })
})
