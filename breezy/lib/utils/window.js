export function needsRefresh(prevAssets, newAssets) {
  if (prevAssets && newAssets) {
    const hasNewAssets = !newAssets.every((asset) =>
      prevAssets.includes(asset)
    )
    return hasNewAssets
  } else {
    return false
  }
}
