# Solving Problems

## Loading content later

When parts of your page become slow, for example, a metrics table that takes a long time to generate because of some expensive operation:

```ruby
# /dashboard.json.props
json.header do
 ...
end

json.metrics do
  sleep 10 # expensive operation
  json.total_visitors 30
end
```

A common approach is to load content in async fashion by building out another set of routes, controllers, tests, with more work on the frontend to manage state, call fetch, etc. With Breezy, we can load async content in a single setting.

```ruby
json.metrics(defer: :auto) do
  sleep 10 # expensive operation
  json.total_visitors 30
end
```

With `defer: :auto`, PropsTemplate will render `order.json.props` as usual, but without `json.metrics`, then when the content is received by the client, Breezy will automatically make an `remote` request for anything that was skipped:

```javascript
remote('/dashboard?bzq=data.metrics')
```

It is up to you to handle the case when `metrics` starts out empty. For example:

```javascript
// orders.jsx
//...in your component

  render() {
    return (
      <div>
        {_.isEmpty(this.props.metrics) ? this.renderLoading() : this.renderDashboard()}
      </div>
    )
  }
```

Note that you can add a placeholder like so:

```ruby
json.metrics(defer: [:auto, placeholder: {}]) do
  sleep 10 # expensive operation
  json.total_visitors 30
end
```

## Loading tab content `onClick`

Your UI has two tabs, the first tabs loads fine,but the second tab takes a bit of time to load. Since the 2nd tab is inactive on the first visit, you decided to load the 2nd tab only when a user clicks it.

```ruby
# /posts.json.props

json.posts do
  json.all do
  end

  json.pending(defer: :manual) do
  end
end
```

```javascript
//...in your component
  render() {
    return (
      <ol className='tabs'>
        <li> tab1 </li>
        <li> <a href="/posts?bzq=data.posts.pending" data-bz-remote={true}>tab2</a> </li>
      <ol>
      ....
    )
  }
```

In this example, `defer: :manual` is used on the node. PropsTemplate will render without that node, and you need to manually request it using [traversals](docs/traversal-guide.md) like the example above.

## Shopping cart

You want to update a cart count located in the header when a user clicks on 'Add to cart' on a product listing

```javascript
//...in your submit handler
<form action='/add_to_cart?bzq=data.header.cart' method='POST' data-bz-remote={true}>
```

```ruby
def create
  redirect_back_with_bzq fallback_url: '/'
end
```

Recall that since Breezy makes an immutable update to the store, your component will update as appropriate.

## Chat app (Short-polling)

Say you have a list of chat messages that you want to periodically update. Here's a simple way to do that with a simple `setTimeout`:

```javascript
  componentDidMount() {
    this.polling = setInterval(() => {
      this.props.remote('/messages?bzq=data.messages')
    })
  }
```

And corresponding  `messages/index.json.props`

```ruby
json.data(search: params['bzq'])
  json.header do
  ...
  end

  json.messages do
    json.array! @messages do |msg|
      json.body msg.body
    end
  end
end
```

## Chat app (Long-polling)

You can use a combination of Rails 5 renderers, ActionCable, PropsTemplate  [fragments](https://github.com/thoughtbot/props_template#partial-fragments) and preloading to stream updates to your users without much effort.

For example, if you already have a ActionCable channel setup, simply render the props and send it over the wire:

```ruby
renderer = PostsController.renderer.new(
  "action_dispatch.request.parameters"=>{bzq: 'data.posts.0'},
  "action_dispatch.request.formats"=>[Mime[:json]]
)

msg = renderer.render(:index)

ActionCable.server.broadcast('web_notifications_channel', message: msg)
```

```javascript
window.App.cable.subscriptions.create("WebNotificationsChannel", {
  received: function({message}) {
    this.props.dispatch({
      type: "UPDATE_POST_FOOBAR",
      payload: message.data
    })
  }
})
```

```ruby
  json.data(search: params[:bzq]) do
    json.posts do
      json.array! @posts, partial: ['post', fragment: true] do
      end
    end
  end
```

## Replicating Turbolinks behavior

With `visit`, Breezy will always wait for a response before a navigation transition. Turbolink's behavior is to transition first if possible while waiting for the response. To replicate this behavior:

In your `application_visit.js` file:

```javascript

import { urlToPageKey } from '@jho406/breezy/utils/url'

const appVisit = (...args) => {
  // Do something before
  // e.g, show loading state, you can access the current pageKey
  // via store.getState().breezy.currentPageKey

  const pageKey = urlToPageKey(args[0])
  this.ref.current.navigateTo(pageKey)
```

## Server Side Rendering
Breezy does not include server side rendering out of the box, but you can add it with (react-rails)[https://github.com/reactjs/react-rails].

1) Add react-rails and mini_racer to your Gemfile
```
gem 'react-rails'
gem 'mini_racer'
```
2) Run the install

```
$ bundle install
$ rails generate react:install
```

3) Remove the appended lines from `application.js`.

You don't need these lines because Breezy's `application.js` already does the job of mounting React to the DOM. If you decide to use react-rails instead, you are welcomed to modify `application.js` as you see fit.

4) Modify `app/javascript/packs/server_rendering.js`

```
// Notice we use `packs` instead of the react-rails defaults of `components`
var componentRequireContext = require.context("packs", true);
var ReactRailsUJS = require("react_ujs");
ReactRailsUJS.useContext(componentRequireContext);
```

4) Modify your webpack config
React-Rails uses ExecJS which uses a stripped down Javascript runtime. Your code won't have access to browser methods and the Node API. For some packages, you have to selectively choose which `index.js` to use. For example:

```
process.env.NODE_ENV = process.env.NODE_ENV || 'development'
const environment = require('./environment')
const path = require('path')
const ConfigObject = require('@rails/webpacker/package/config_types/config_object')

const webConfig = environment.toWebpackConfig()
const ssrConfig = new ConfigObject(webConfig.toObject())

ssrConfig.delete('entry')
ssrConfig.merge({
  entry: {
    server_rendering: webConfig.entry.server_rendering
  },
  resolve: {
    alias: {
      'html-dom-parser': path.resolve(__dirname, '../../node_modules/html-dom-parser/lib/html-to-dom-server')
    }
  }
})

delete webConfig.entry.server_rendering

module.exports = [ssrConfig, webConfig]
```

5) Replace `<div id="app">` in your ERB templates with:

```
<%
  props = "{\"initialPage\":#{initial_state}, \"href\":\"#{request.original_url}\"}"
%>
<%= react_component("application", props, prerender: true, id: :app) %>
```

6) Use ReactDOM.hydrate
In `application.js` change this:
```
import { render } from 'react-dom'
```
to this

```
import { hydrate } from 'react-dom'
```

and change the rest of `application.js` accordingly.

## Usage with Kaminari

SPA pagination is pretty easy to add with Kaminari and any component library you wish to use. Lets use [antd](https://ant.design/components/pagination/) as an example:

```ruby
# index.json.props
page_num = params[:page_num]
items_per_page = 20

json.posts do
  paged_posts = @posts
    .page(page_num)
    .per(items_per_page)
    .order(created_at: :desc)

  json.list do
    json.array! paged_posts do |post|
      json.id post.id
      json.body post.body
      json.edit_post_path edit_post_path(post)
    end
  end

  json.pagination_path posts_path
  json.current paged_posts.current_page
  json.total @posts.count
  json.page_size items_per_page
end

```

Let's grab one of those fancy pagination components from [antd](https://ant.design/components/pagination/) and some helpers

```text
yarn add antd url-parse
```

Then in your component

```javascript
import {
  mapStateToProps,
  mapDispatchToProps,
} from '@jho406/breezy'
import { Pagination } from 'antd'
import parse from 'url-parse'

class PostsIndex extends React.Component {
  onPaginateChange = (page) => {
    const pagination_path = this.props.posts
    let url = new parse(pagination_path, true)
    url.query.page_num = page
    url.query.bzq = 'shoots'

    this.props.visit(pagination_path)
  }

  render () {
    const {list, current, total} = this.props.posts

    return (
      <ul>
        {list.map(function(post){
          return <li>{post.body}</li>
        })}
        <Pagination
          showQuickJumper
          current={current}
          total={total}
          onChange={this.onPaginateChange}
        />
      </ul>
    )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PostsIndex)

```

## Custom reducers
Breezy generators will `yarn add reduce-reducers` and set up a `reducers.js`. If you find yourself needing additional functionality beyond what the generated reducers provide, just add your own reducers:

```javascript
....
import reduceReducers from 'reduce-reducers'
import {getIn} from '@jho406/breezy'
import produce from "immer"

function myCustomReducer(state = {}, action) {
  ....
}

...

const store = createStore(
  combineReducers({
    breezy: breezyReducer,
    pages: reduceReducers(pagesReducer, applicationReducer),
    additionalFoobar: myCustomReducer
  }),
  initialState,
  applyMiddleware(thunk)
)
```
