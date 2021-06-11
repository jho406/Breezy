import {
  visit,
  remote,
  saveAndProcessPage,
  copyPage,
} from '../action_creators'
import { urlToPageKey } from './url'

export function mapStateToProps(
  state = { pages: {}, breezy: {} },
  ownProps
) {
  let pageKey = ownProps.pageKey
  let params = ownProps
  const csrfToken = state.breezy.csrfToken
  pageKey = urlToPageKey(pageKey)
  const { data, flash, fragments } = state.pages[pageKey] || {
    data: {},
    flash: {},
    fragments: [],
  }
  return { ...data, ...params, pageKey, csrfToken, flash, fragments }
}

export const mapDispatchToProps = {
  saveAndProcessPage,
  copyPage,
}

export const mapDispatchToPropsIncludingVisitAndRemote = {
  visit,
  remote,
  saveAndProcessPage,
  copyPage,
}
