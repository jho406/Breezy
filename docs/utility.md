# Utility

## API

### enhanceVisitWithBrowserBehavior

Enhances `visit` with navigation behavior on the returned Promises. For example, if the request `500`s, Breezy will navigate to '/500.html'. You can read the full behavior [here](https://github.com/jho406/Breezy/blob/master/breezy/lib/utils/react.js#L131).

```javascript
  import {enhanceVisitWithBrowserBehavior} from '@jho406/breezy'

  constructor (props) {
    const visit = enhanceVisitWithBrowserBehavior(props.visit)
    this.enhancedVisit = visit.bind(this)
  }
```

| Arguments | Type | Notes |
| :--- | :--- | :--- |
| visit | `Function` | The visit function injected by `mapDispatchToProps` |
| remote | `Function` | The remote function injected by `mapDispatchToProps`. The wrapped `remote` function will add the `pageKey` argument automatically for you. |

### getIn
```javascript
  import {getIn} from '@jho406/breezy'

```

| Arguments | Type | Notes |
| :--- | :--- | :--- |
| obj | `Object` | Typically the redux state.
| path | `String ` | A keypath to the node in your state, `posts.post_id=1.comment.0.body`

Traverses to the node using a keypath. For example, given a page that looks like this:

```text
'/posts': {
  data: {
    posts: [
    {
      post_id: 1
      title: 'hello world'
      comments: [
        {
          comment_id: 1,
          body: 'Here's a comment
        }
      ]
    }
    ]
  }
}
```

To reach the comment body you could do this:

```javascript
getIn(state, '/posts.data.posts.0.comment.0.body')
```

or find first by its attribute and value

```javascript
getIn(state, '/posts.data.postId=0.comment.0.body')
```

The above would find the first occurance where `postId=1` before continuing traversing.

