import parse from 'url-parse'

const uniqueId = () => Math.random().toString(36).substring(2, 10)

export function pathQuery(url) {
  const { pathname, query } = new parse(url, {})

  return pathname + query
}

export function pathQueryHash(url) {
  const { pathname, query, hash } = new parse(url, {})

  return pathname + query + hash
}

export function hasBzq(url) {
  url = new parse(url, {}, true)
  let query = url.query

  return !!query['bzq']
}

export function withAntiCache(url) {
  url = new parse(url, {}, true)

  if (Object.prototype.hasOwnProperty.call(url.query, '_')) {
    return url.toString()
  } else {
    url.query['_'] = uniqueId()
    return url.toString()
  }
}

export function withMimeBust(url) {
  url = new parse(url, {}, true)
  if (Object.prototype.hasOwnProperty.call(url.query, '__')) {
    return url.toString()
  } else {
    url.query['__'] = '0'
    return url.toString()
  }
}

export function withoutBusters(url) {
  url = new parse(url, {}, true)
  let query = url.query
  delete query['__']
  delete query['_']
  url.query = query
  return pathQuery(url.toString())
}

export function pathWithoutBZParams(url) {
  url = new parse(url, {}, true)
  let query = url.query

  delete query['__']
  delete query['_']
  delete query['bzq']
  url.query = query

  return pathQueryHash(url.toString())
}

export function removeBzq(url) {
  url = new parse(url, {}, true)
  let query = url.query

  delete query['bzq']
  url.query = query

  return url.toString()
}

export function urlToPageKey(url) {
  url = new parse(url, {}, true)
  let query = url.query

  delete query['__']
  delete query['_']
  delete query['bzq']
  url.query = query

  return pathQuery(url.toString())
}

export function withoutHash(url) {
  url = new parse(url, {}, true)
  url.hash = ''
  return url.toString()
}

export function formatForXHR(url, opts = {}) {
  let formats = [withMimeBust, withoutHash]

  if (opts.cacheRequest) {
    formats.push(withAntiCache)
  }

  return formats.reduce((memo, f) => f(memo), url)
}
