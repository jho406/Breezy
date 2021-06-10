# Getting started

## Installation

Ensure you have Webpacker and React installed. Add the following to your
Gemfile and run bundle

```ruby
# Gemfile
gem 'breezy'
```

Run the installation generator

```text
rails breezy:install:web
```

Generate a scaffold

```text
rails generate scaffold post body:string --force --no-template-engine --breezy
```

## Configuration

The `rails breezy:install:web` step adds a
[preconfigured entry point](https://github.com/thoughtbot/Breezy/blob/master/breezy_rails/lib/install/templates/web/application.js)
in `app/javascript/packs/application.js`.

## Custom Reducers
The generator will also add a `reducer.js` file for any custom reducer you'd
like to add. Included in the reducer is a `pagesReducer` for any cross page
updates, and a `applicationRootReducer` for the entire store. The latter is used
for Redux-Persist, which you can customize to your needs.

## Custom Visit and Remote

The `visit` and `remote` thunks can be customized in the provided
`application_visit.js` file. Functionality like loading indicators can be added
here.

## Configuring Reloads

Breezy will do a hard reload whenever a successful response returns new asset
fingerprints. Add an initializer to control how Breezy tracks sprockets and
webpack assets:

```ruby
# defaults
Breezy.configure do |config|
  config.track_sprockets_assets = ['application.js', 'application.css']
  config.track_pack_assets = ['application.js']
end
```


