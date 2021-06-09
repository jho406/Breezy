import {
  withAntiCache,
  withMimeBust,
  withoutHash,
  removeBzq,
  pathQuery,
  pathQueryHash,
  hasBzq,
} from '../../../lib/utils/url'
import parse from 'url-parse'

describe('.withAntiCache', () => {
  it('take a url and adds an cache busting param', () => {
    const url = withAntiCache('http://www.github.com')
    const url2 = withAntiCache('http://www.github.com')
    const urlHost = parse(url).host
    const urlHost2 = parse(url).host

    expect(url).not.toEqual(url2)
    expect(urlHost).toEqual(urlHost2)
  })
})

describe('.withMimeBust', () => {
  it('take a url and adds mime busting param, browsers will cache same urls even if mime type is different', () => {
    const url = withMimeBust('http://www.github.com')

    expect(url).toEqual('http://www.github.com/?__=0')
  })
})

describe('.withoutHash', () => {
  it('take a url and removes the hash', () => {
    const url = withoutHash('http://www.github.com#abc')

    expect(url).toEqual('http://www.github.com/')
  })

  it('takes a blank and returns blank', () => {
    const url = withoutHash('http://www.github.com#abc')

    expect(url).toEqual('http://www.github.com/')
  })
})

describe('.removeBzq', () => {
  it('take a url and removes the bzq param', () => {
    const url = removeBzq('http://www.github.com?bzq=hello')

    expect(url).toEqual('http://www.github.com/')
  })

  it('take a blank url and returns blank', () => {
    const url = removeBzq('')

    expect(url).toEqual('')
  })
})

describe('.pathQuery', () => {
  it('take a url and returns a url with a query and pathname only', () => {
    const url = pathQuery('http://www.github.com/path?bzq=hello#fooo')

    expect(url).toEqual('/path?bzq=hello')
  })

  it('take a blank url and returns blank', () => {
    const url = pathQuery('')

    expect(url).toEqual('')
  })
})

describe('.pathQueryHash', () => {
  it('take a url and returns a url with a query, pathname, and hash only', () => {
    const url = pathQueryHash('http://www.github.com?bzq=hello#fooo')

    expect(url).toEqual('/?bzq=hello#fooo')
  })

  it('take a blank url and returns blank', () => {
    const url = pathQueryHash('')

    expect(url).toEqual('')
  })
})

describe('hasBzq', () => {
  it('takes a url and returns true if bzq is a param', () => {
    const bzq = hasBzq('http://www.github.com?bzq=hello')

    expect(bzq).toEqual(true)
  })

  it('takes a url and returns false if bzq is not a param', () => {
    let bzq = hasBzq('http://www.github.com')
    expect(bzq).toEqual(false)

    bzq = hasBzq('')
    expect(bzq).toEqual(false)
  })
})
