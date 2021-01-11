import { visit, remote } from '@jho406/breezy/action_creators'

export function buildVisitAndRemote(ref, store) {
  const appRemote = (...args) => {
    return store.dispatch(remote(...args))
  }

  const appVisit = (...args) => {
    // Do something before
    // e.g, show loading state, you can access the current pageKey
    // via store.getState().breezy.currentPageKey
    return store
      .dispatch(visit(...args))
      .then((meta) => {
        // The assets fingerprints changed, instead of transitioning
        // just go to the URL directly to retrieve new assets
        if (meta.needsRefresh) {
          window.location = meta.url
          return
        }

        ref.current.navigateTo(meta.pageKey, {
          action: meta.suggestedAction,
        })
      })
      .finally(() => {
        // Do something after
        // e.g, hide loading state, you can access the changed pageKey
        // via getState().breezy.currentPageKey
      })
      .catch((err) => {
        const response = err.response

        if (!response) {
          console.error(err)
          return
        }

        if (response.ok) {
          // err gets thrown, but if the response is ok,
          // it must be an html body that
          // breezy can't parse, just go to the location
          window.location = response.url
        } else {
          if (response.status >= 400 && response.status < 500) {
            window.location = '/400.html'
            return
          }

          if (response.status >= 500) {
            window.location = '/500.html'
            return
          }
        }
      })
  }

  return { visit: appVisit, remote: appRemote }
}

