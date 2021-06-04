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
  const { data, flash } = state.pages[pageKey] || {
    data: {},
    flash: {},
  }
  return { ...data, ...params, pageKey, csrfToken, flash }
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
