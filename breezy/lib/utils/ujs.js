import { withoutBusters, urlToPageKey } from './url'

export class HandlerBuilder {
  constructor({ ujsAttributePrefix, visit, remote }) {
    this.attributePrefix = ujsAttributePrefix
    this.isUJS = this.isUJS.bind(this)

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleClick = this.handleClick.bind(this)

    this.visit = visit
    this.remote = remote
    this.visitOrRemote = this.visitOrRemote.bind(this)
  }

  retrieveLink(target) {
    let link = target
    while (!!link.parentNode && link.nodeName.toLowerCase() !== 'a') {
      link = link.parentNode
    }

    if (
      link.nodeName.toLowerCase() === 'a' &&
      link.href.length !== 0
    ) {
      return link
    }
  }

  isNonStandardClick(event) {
    return (
      event.which > 1 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
  }

  isUJS(node) {
    const hasVisit = !!node.getAttribute(
      this.attributePrefix + '-visit'
    )
    const hasRemote = !!node.getAttribute(
      this.attributePrefix + '-remote'
    )

    return hasVisit || hasRemote
  }

  handleSubmit(event) {
    const form = event.target

    if (form.nodeName.toLowerCase() !== 'form' || !this.isUJS(form)) {
      return
    }

    event.preventDefault()

    let url = form.getAttribute('action')
    let method = (form.getAttribute('method') || 'POST').toUpperCase()
    url = withoutBusters(url)

    this.visitOrRemote(form, url, {
      method,
      headers: {
        'content-type': null,
      },
      body: new FormData(event.target),
    })
  }

  handleClick(event) {
    const link = this.retrieveLink(event.target)
    const isNonStandard = this.isNonStandardClick(event)
    if (!link || isNonStandard || !this.isUJS(link)) {
      return
    }

    event.preventDefault()
    let url = link.getAttribute('href')
    url = withoutBusters(url)

    const method =
      link.getAttribute(this.attributePrefix + '-method') || 'GET'
    this.visitOrRemote(link, url, { method })
  }

  visitOrRemote(linkOrForm, url, opts = {}) {
    let target

    if (linkOrForm.getAttribute(this.attributePrefix + '-visit')) {
      target = this.visit
      const placeholderKey = linkOrForm.getAttribute(
        this.attributePrefix + '-placeholder'
      )
      if (placeholderKey) {
        opts.placeholderKey = urlToPageKey(placeholderKey)
      }
    }

    if (linkOrForm.getAttribute(this.attributePrefix + '-remote')) {
      target = this.remote
    }

    if (!target) {
      return
    } else {
      return target(url, opts)
    }
  }

  handlers() {
    return {
      onClick: this.handleClick,
      onSubmit: this.handleSubmit,
    }
  }
}

export const ujsHandlers = ({
  navigatorRef,
  store,
  ujsAttributePrefix,
  visit,
  remote,
}) => {
  const builder = new HandlerBuilder({
    navigatorRef,
    store,
    visit,
    remote,
    ujsAttributePrefix,
  })

  return builder.handlers()
}
