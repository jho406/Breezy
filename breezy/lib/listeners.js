import {getWindow, hasWindow} from './window'
import {isValid, toOptions} from './utils/anchor_and_form'
import {remote} from './action_creators'
import {store} from './connector'

let navigator = null

const clickHandler = (ev) => {
  let {target} = ev
  const {document} = getWindow()
  while ((target !== document) && (target != null)) {
    if (target.nodeName === 'A') {
      const isNodeDisabled = target.getAttribute('disabled')
      if (target.getAttribute('disabled')) { ev.preventDefault() }
      if (!isNodeDisabled) {
        remoteHandler(ev, store)
        return
      }
    }

    target = target.parentNode
  }
}

const addListeners = (document) => {
  document.addEventListener('click', clickHandler)
  document.addEventListener('submit', remoteHandler)
}

const removeListeners = (document) => {
  document.removeEventListener('click', clickHandler, false)
  document.removeEventListener('submit', remoteHandler, false)
}

export const remoteHandler = function(ev, store) {
  const {target} = ev
  if (!isValid(target)) { return }
  ev.preventDefault()

  const options = toOptions(target)
  return store.dispatch(remote(options)).then((rsp) => {
    navigator.navigateTo(options.url, rsp.container)
  })
}

export const setNavAndListen = function(nav) {
  navigator = nav

  const {document} = getWindow()
  if (document) {
    addListeners(document)
  }
}

export const unsetNavAndUnlisten = function() {
  navigator = null
  if (hasWindow()) {
    const {document} = getWindow()
    removeListeners(document)
  }
}

