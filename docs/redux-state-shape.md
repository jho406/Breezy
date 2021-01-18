# The store shape

Breezy occupies 2 nodes in your Redux state tree:

```javascript
{
  breezy: {
    csrfToken,
    currentPageKey,
    pathname,
    search,
    hash,
  },
  pages: {
    '/dashboard': { ..page received from `/dashboad`.. },
    '/posts?foo=123': {... page received from `/posrs?foo=123` },
  }
}
```


## The `breezy` node
The `breezy` node contains information about your application that you may find useful. You may read from this store, but do not write.

## The `pages` node
The `pages` is where rendered JSON templates live. Its a hash where the keys are the pathname + query of your url, known throughout the documentation as `pageKey`, and the values are received JSON responses.

The `pageKey` does not include the location hash of your URL. This is by design, Breezy ignores the location hash and fallsback to browser defaults. So while you can visit `/posts#foo` and `/posts` in the browser, Breezy will store both as `/posts`.

This shape differs from conventional Redux approaches where state is normalized into "tables". In Breezy, we work with denormalized UI state. In other words, Breezy prefers updating state in terms of "updating the user email at each page header", instead of "updating the email in the user model".

### why?

**There's less guess work.** Business logic is complex and diverse across industry verticals, but the presentational aspects remain largely unchanged. There will always be a header, a footer, a menu, a body with a list of items, etc. Breezy shapes its store with this observation in mind so that **any developer can look at a running application, easily guess the shape of the store, and make close-to-correct assumptions on how to update the store without looking at any code.**

**Its extremely productive with PropsTemplate.** A keypath in your thunk like so `remote(/dashboard?bzq=data.content.bar_chart)` is enough to query your content on the server-side, respond with a node, and graft it at the same location in your redux state.

## Cross cutting presentational fragments

The `pages` node also serves as a cache of your previous visits. That means there's a chance for some data in your Redux state to be out of date. For example, your most recent visit may have an updated header that your previous page does not have.

You will have to create your own reducers to update these fragments, but Breezy provides tooling to make it easier to update fragments. You can read more about updating fragments [here](./updating-fragments.md)

