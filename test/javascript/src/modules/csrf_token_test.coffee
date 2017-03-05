QUnit.module "CSRF Token"

createTarget = (html) ->
  testDiv = @document.createElement('div')
  testDiv.innerHTML = html
  return testDiv.firstChild

testWithSession "#get returns the current CSRF token", (assert) ->
  tokenTag = @document.querySelector 'meta[name="csrf-token"]'
  tokenTag.setAttribute 'content', 'someToken123'

  token = @Breezy.CSRFToken.get(@document).token
  assert.equal token, 'someToken123'

testWithSession "#update sets a new CSRF token on the page", (assert) ->
  tokenTag = @document.querySelector 'meta[name="csrf-token"]'
  tokenTag.setAttribute 'content', 'someToken123'

  csrf = new @Breezy.CSRFToken
  token = @Breezy.CSRFToken.get(@document).token
  assert.equal token, 'someToken123'

  @Breezy.CSRFToken.update('newToken123')
  token = @Breezy.CSRFToken.get(@document).token
  assert.equal token, 'newToken123'
