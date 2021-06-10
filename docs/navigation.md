# Navigation

Navigation is [inspired by turbolinks](docs/concepts#inspired-by-turbolinks).

## Visit and Remote

Breezy comes with two thunks that wrap around fetch:

1. `visit` is used for page-to-page navigation, there can be only
[one visit](docs/react-redux.md#visit) at a time.
2. `remote` is used with urls that contain the `bzq` param for
partial page updates.

When [configuring](docs/getting-started#configuration) your application in
`application.js`, your page components would all recieve a `visit` and `remote`
function that will dispatch when called.

## `application_visit.js`

Out of the box, the `visit` thunk is bare, it doesn't navigate on success or
specify any behavior on error. We have to enhance it with sane defaults for the
web then inject it into your application to override the thunk.

If you've used the generators, this is done for you in `application_visit.js`
and the resulting `visit` is injected in `application.js`.

You can add customizations to `visit` or `remote` in `application_visit.js`.

## Single page navigation using `visit`

Single page navigation must be explicitly enabled using a [data
attribute](docs/react-redux#data-bz-visit):

```jsx
  <a href='/posts' data-bz-visit={true} />
```

or manually called using the `visit` thunk somewhere in your component:

```javascript
  this.props.visit("/posts", {...options})
    .then(...) #add navigateTo
```

Options passed to visit are passed to `fetch`, but there are two features worth
calling out that enables low effort interactivity.

### placeholders

The idea of placeholders is to optimistically copy the current page state over
to the next page's state before the request. This is handy if the next page
looks almost idential to the current page. Usecases include:

1. Modals
2. Providing content for manual deferments

Example:

```jsx
  <a
    href='/posts/new?bzq=data.body.modal'
    data-bz-visit={true}
    data-bz-placeholder="/new"
  />
```

or

```javascript
  this.props
    .visit("/posts/new?bzq=data.body.modal", { placeholderKey: "/new"})
    .then(...) #add navigateTo
```

### `beforeSave`

You can provide a callback that will modify the page before it gets saved to
the Redux store. Very handy for chat applications that need to merge the
current page's messages with the next one.

Example:

```javascript
  const beforeSave = (prevPage, nextPage) => {
    nextPage.data.messages = [
      prevPage.data.messages,
      ... nextPage.data.messages
    ]

    return nextPage
  }

  this.props.visit("/posts", {beforeSave}).then(...) #add navigateTo
```

## Partial page updates with `remote`

`remote` combined with the `bzq` parameter can update any part of the Redux
store in the background. Most of the time, you would be using this thunk to
update the current page the user is seeing. Like `visit`, you can
provide a `beforeSave` callback to modify content before it gets saved to the
store.

```javascript
  const beforeSave = (prevPage, nextPage) => {
    nextPage.data.messages = [
      prevPage.data.messages,
      ... nextPage.data.messages
    ]

    return nextPage
  }


  this.props.remote("/posts?bzq=data.header", {beforeSave})
```

You may also [specify](./react-redux.md#remote) a `pageKey` param to tell
Breezy where to store the results. If you're using the thunk through a
connected component, this will be set to the key of the current page for you.

# Deferments

Deferments are a low effort way to load content in async fashion, both
automatically and manually.

## `auto`

```ruby
  json.metrics(defer: [:auto, placeholder: {total_visitors: 0}]) do
    sleep 10 # expensive operation
    json.total_visitors 30
  end
```

When visiting the above, PropsTemplate will render with

```
{
  metrics: {
    total_visitors: 0
  }
}
```

Then make a `remote("/dashboard?bzq=data.metrics")` call and 10 seconds later,
`{total_visitors: 30}` will be immutably grafted into the same position on the
Redux store and React will rerender. For more control you may providing a
`success_action` or `fail_action`, and Breezy will dispatch these actions when
the promise resolves successfully or fails.

```ruby
json.metrics(defer: [:auto, placeholder: {total_visitors: 0}, success_action: "SUCCESS", fail_action: "FAIL"]) do
  sleep 10 # expensive operation
  json.total_visitors 30
end
```

## `manual`
Using `manual` with deferment means that a `remote` call will not
take place, its up to you to fetch the node using `remote` yourself.

```ruby
json.metrics(defer: [:manual, placeholder: {total_visitors: 0}]) do
  sleep 10 # expensive operation
  json.total_visitors 30
end
```

See [recipes](./recipes.md#loading-content-later) for more examples.
