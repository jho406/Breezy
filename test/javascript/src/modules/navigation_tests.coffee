QUnit.module "Navigation"

testWithSession "a successful visit", (assert) ->
  done = assert.async()

  breezyClickFired = requestFinished = requestStared = false
  @document.addEventListener 'breezy:click', =>
    assert.equal @$('meta[name="csrf-token"]').getAttribute('content'), 'token'
    breezyClickFired = true

  @document.addEventListener 'breezy:request-start', =>
    requestStared = true

  @document.addEventListener 'breezy:request-end', =>
    state = breezy: true, url: "#{location.protocol}//#{location.host}/app/session"
    assert.propEqual @history.state, state
    assert.ok breezyClickFired
    assert.ok requestStared
    requestFinished = true

  @document.addEventListener 'breezy:load', (event) =>
    assert.ok requestFinished
    assert.propEqual event.data.data, { heading: "Some heading 2" }
    state = breezy: true, url: "#{location.protocol}//#{location.host}/app/success"
    assert.propEqual @history.state, state
    assert.equal @location.href, state.url
    assert.equal @$('meta[name="csrf-token"]').getAttribute('content'), 'token'
    done()

  @Breezy.visit('/app/success')

testWithSession "visits to content with new assets generates a refresh", (assert) ->
  done = assert.async()
  @window.addEventListener 'unload', =>
    assert.ok true
    done()
  @Breezy.visit('/app/success_with_new_assets')

testWithSession "visits with an error response would redirect to that same errorpage", (assert) ->
  done = assert.async()

  unloadFired = false
  @window.addEventListener 'unload', =>
    unloadFired = true
    setTimeout =>
      try
        assert.equal @window.location.href, "#{@window.location.protocol}//#{@window.location.host}/app/does_not_exist"
      catch e
        throw e unless /denied/.test(e.message) # IE
      done()
    , 0
  @Breezy.visit('/app/does_not_exist')


testWithSession "visits with different-origin URL, forces a normal redirection", (assert) ->
  done = assert.async()
  @window.addEventListener 'unload', =>
    assert.ok true
    done()
  @Breezy.visit("http://example.com")

testWithSession "calling preventDefault on the before-change event cancels the visit", (assert) ->
  done = assert.async()
  @document.addEventListener 'breezy:click', (event) ->
    event.preventDefault()
    assert.ok true
    setTimeout (-> done?()), 0
  @document.addEventListener 'breezy:request-start', =>
    done new Error("visit wasn't cancelled")
    done = null
  @Breezy.visit('/app/success')

testWithSession "visits do not pushState when URL is the same", (assert) ->
  done = assert.async()
  # Get rid of history.back() sideeffect
  @history.pushState({}, "", "session");

  load = 0
  @document.addEventListener 'breezy:load', =>
    load += 1
    if load is 1
      assert.equal @history.length, @originalHistoryLength
      setTimeout (=> @Breezy.visit('/app/session#test')), 0
    else if load is 2
      setTimeout (=>
        assert.equal @history.length, @originalHistoryLength + 1
        done()
      ), 0
  @originalHistoryLength = @history.length
  @Breezy.visit('/app/session')

testWithSession "with #anchor and history.back()", (assert) ->
  #todo: revisit this test
  done = assert.async()
  hashchange = 0
  load = 0

  @window.addEventListener 'hashchange', =>
    hashchange += 1
  @document.addEventListener 'breezy:load', =>
    load += 1
    if load is 1
      assert.equal hashchange, 1
      setTimeout (=> @history.back()), 0
  @document.addEventListener 'breezy:restore', =>
    assert.equal hashchange, 1
    done()
  @location.href = "#{@location.href}#change"
  setTimeout (=> @Breezy.visit('/app/success#permanent')), 0

testWithSession "visits to content with Breezy.cache stores caches correctly", (assert) ->
  done = assert.async()
  @window.addEventListener 'breezy:load', (event) =>
    assert.equal(event.data.data.footer, 'some cached content')
    assert.equal(@Breezy.cache('cachekey'), 'some cached content')
    done()
  @Breezy.visit('/app/success_with_russian_doll')

testWithSession "visits with the async option allows request to run seperate from the main XHR", (assert) ->
  done = assert.async()
  @document.addEventListener 'breezy:load', =>
    assert.equal @Breezy.controller.http, null
    done()

  @Breezy.visit('/app/session', async: true)

testWithSession "multiple remote visits with async will use a parallel queue and block onLoads until the xhr ahead of it finishes first", (assert) ->
  sinon.stub(@Breezy.Utils, 'warn', ->{})
  done = assert.async()

  response = '''
    (function() {
      return {
        data: { heading: 'Some heading' },
        title: 'title',
        csrf_token: 'token',
        assets: ['application-123.js', 'application-123.js']
      };
    })();
  '''
  xhr = sinon.useFakeXMLHttpRequest()
  @window.XMLHttpRequest = xhr
  requests = []
  xhr.onCreate = (xhr) ->
    requests.push(xhr)

  @Breezy.visit('/app', async: true)
  @Breezy.visit('/app', async: true)
  assert.equal @Breezy.controller.pq.dll.length, 2
  requests[1].respond(200, { "Content-Type": "application/javascript" }, response)

  assert.equal @Breezy.controller.pq.dll.length, 2
  requests[0].respond(200, { "Content-Type": "application/javascript" }, response)

  assert.equal @Breezy.controller.pq.dll.length, 0
  xhr.restore()
  done()

testWithSession "multiple remote visits with async options will use a parallel queue that onLoads in order", (assert) ->
  sinon.stub(@Breezy.Utils, 'warn', ->{})
  done = assert.async()
  response = '''
    (function() {
      return {
        data: { heading: 'Some heading' },
        title: 'title',
        csrf_token: 'token',
        assets: ['application-123.js', 'application-123.js']
      };
    })();
  '''
  xhr = sinon.useFakeXMLHttpRequest()
  @window.XMLHttpRequest = xhr
  requests = []
  xhr.onCreate = (xhr) ->
    requests.push(xhr)

  @Breezy.visit('/app', async: true)
  @Breezy.visit('/app', async: true)
  assert.equal @Breezy.controller.pq.dll.length, 2
  requests[0].respond(200, { "Content-Type": "application/javascript" }, response)

  assert.equal @Breezy.controller.pq.dll.length, 1
  requests[1].respond(200, { "Content-Type": "application/javascript" }, response)

  assert.equal @Breezy.controller.pq.dll.length, 0
  xhr.restore()
  done()

testWithSession "visits to content with a Breezy.graft response will graft data appropriately", (assert) ->
  done = assert.async()
  @window.addEventListener 'breezy:load', (event) =>
    assert.propEqual event.data.data,
      address:
        zip: 91210
      heading: "Some heading"

    done()
  @Breezy.visit('/app/success_with_graft')

testWithSession "visits to content with an async Breezy.visit will kick off an async request for new content", (assert) ->
  done = assert.async()
  load = 0

  @window.addEventListener 'breezy:load', (event) =>
    if load == 0
      assert.propEqual event.data.data,
        address: {}
        heading: "Some heading 2"
      load += 1
    else if load == 1
      assert.propEqual event.data.data,
        address:
          zip: 91210
        heading: "Some heading 2"
      done()
  @Breezy.visit('/app/success_with_async_render')