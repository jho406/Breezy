# Concepts

## Inspired by Turbolinks

Breezy is inspired by Turbolinks. When you click on a link like this:
`<a href='/posts' data-bz-visit={true} />`, Breezy fetches the next page's full
content in JSON, swaps the current page JSON with the next page JSON, and hands
it off to the your next React page component.

## Pages

Breezy comes with a simple and denormalized Redux state. Each node in the store
is a copy of your recently visited page in full JSON. This concept is very
similar to Turbolink's [page cache](https://github.com/turbolinks/turbolinks#understanding-caching),
but Breezy exposes the pages to your Redux reducers to allow you to
make optimistic updates.

For example, we can edit the header on the current and all previous pages to
ensure that all headers are updated:

```javascript
const applicationPagesReducer = (state = {}, action) => {
  switch(action.type) {

  case UPDATE_USER_HEADERS: {
    const nextPages = { ...state }
    const { email } = action.payload

    for (const key in nextPages) {
      if (nextPages[key].email) {
        nextPages[key].email = email
      }
    }

    return nextPages
  }

  default:
    return state
  }
}
```

## No APIs
There are no APIs to build. Instead, Breezy leans on Rail's ability to render
different mime types on the same route.

In a Breezy application, you write your page's content in JSON
using the [PropsTemplate](https://github.com/thoughtbot/props_template), inject
that state in HTML, and write your markup in JSX.

Here's how that looks:

```
MyRailsApp/
  app/
  views/
  dashboard/
    index.html.erb <- where index.json.props gets rendered as initial state
    index.jsx <- Gets packaged with application.js
    index.json.props <- will also respond to `.json` requests
```

The routes remain simple:

```ruby
  resources :posts
```

When a user clicks on a link enabled with Breezy's UJS:

```jsx
  <a href='/posts' data-bz-visit={true} />
```

Breezy will specify the request's mime type as JSON, causing Rails to render
`index.json.props`, and respond with the full page's JSON for your next
page component to consume.

## Querying the template

Any part of your page can be easily updated in as little as a singe line of
code.

For example, here's hows to refresh a chart with a button without any APIs:

```jsx
  <a href='/posts?bzq=data.dashboard.key_metrics_chart' data-bz-remote={true} />
```

PropsTemplate powers this interaction. Any template you build with
PropsTemplate is queryable using a param that you pass to the root node in your
`layout/application.json.props`:

```ruby
json.data(search: params[:bzq]) do
  json.side_bar do
    # gets skipped
  end
  json.dashboard do
    json.key_metrics_chart do
      #gets rendered
    end
  end
end
```

When the server receives a request, it will query your template and fetch ONLY
the `data.dashboard.key_metrics_chart` node without executing other nodes in
your template.

Finally Breezy on the client side will receive the node, immutably graft it
into your Redux state in the same exact path and hand it over to your
component to render.

The syntax of `bzq` is a keypath, here's another example using an array:

```jsx
  <a href='/posts?bzq=data.post_list.0.title' data-bz-remote={true} />
```

Read more about this in the [traversal guide](./traversal-guide.md)

## Embrace UJS

You may have noticed that we've been using `data-bz-remote` or `data-bz-visit`
in the examples.

```jsx
  <a href='/posts?bzq=data.dashboard.key_metrics_chart' data-bz-visit={true} />
```

Breezy embraces Unobtrusive Javascript. Any link or form with a `data-bz`
attribute receives super powers inspired by Rails data attributes.

For more advanced usecases, an action creator is passed to all your connected
components when using the included [React](docs/react-redux.md) helpers

For example:

```jsx
  this.props.visit('/posts?bzq=data.dashboard.key_metrics_chart')
  .then....
```
