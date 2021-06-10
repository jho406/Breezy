# Utility

## API

### getIn
```javascript
  import {getIn} from '@jho406/breezy'
```

| Arguments | Type | Notes |
| :--- | :--- | :--- |
| obj | `Object` | Typically the redux state.
| path | `String ` | A keypath to the node in your state, `posts.post_id=1.comment.0.body`

Traverses to the node using a keypath. For example, given a page that looks
like this:

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
getIn(state, '/posts.data.post_id=0.comment.0.body')
```

The above would find the first occurrence where `post_id=1` before continuing
traversing.



