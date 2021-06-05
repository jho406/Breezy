require "webpacker/configuration"

babel_config = Rails.root.join("babel.config.js")

def add_member_methods
  inject_into_file "app/models/application_record.rb", after: "class ApplicationRecord < ActiveRecord::Base\n" do
    <<-RUBY
  def self.member_at(index)
    offset(index).limit(1).first
  end

  def self.member_by(attr, value)
    find_by(Hash[attr, value])
  end
    RUBY
  end
end

say "Copying module-resolver preset to your babel.config.js"
resolver_snippet = <<~JAVASCRIPT
  [
    require('babel-plugin-module-resolver').default, {
      "root": ["./app"],
      "alias": {
        "views": "./app/views",
        "components": "./app/components",
        "javascript": "./app/javascript"
      }
    }
  ],
JAVASCRIPT
insert_into_file "babel.config.js", resolver_snippet, after: /plugins: \[\n/

say "Copying application.js file to #{Webpacker.config.source_entry_path}"
copy_file "#{__dir__}/templates/web/application.js", "#{Webpacker.config.source_entry_path}/application.js"

say "Copying reducer.js file to #{Webpacker.config.source_entry_path}"
copy_file "#{__dir__}/templates/web/reducer.js", "#{Webpacker.config.source_entry_path}/reducer.js"

say "Copying action_creators.js file to #{Webpacker.config.source_entry_path}"
copy_file "#{__dir__}/templates/web/action_creators.js", "#{Webpacker.config.source_entry_path}/action_creators.js"

say "Copying actions.js file to #{Webpacker.config.source_entry_path}"
copy_file "#{__dir__}/templates/web/actions.js", "#{Webpacker.config.source_entry_path}/actions.js"

say "Copying application_visit.js file to #{Webpacker.config.source_entry_path}"
copy_file "#{__dir__}/templates/web/application_visit.js", "#{Webpacker.config.source_entry_path}/application_visit.js"

say "Copying Breezy initializer"
copy_file "#{__dir__}/templates/web/initializer.rb", "config/initializers/breezy.rb"

say "Copying application.json.props"
copy_file "#{__dir__}/templates/web/application.json.props", "app/views/layouts/application.json.props"

say "Adding required member methods to ApplicationRecord"
add_member_methods

say "Installing React, Redux, and Breezy"
run "yarn add babel-plugin-module-resolver history@\"^4\" html-react-parser@\"^0.13\" react-redux redux-thunk redux redux-persist reduce-reducers immer @jho406/breezy --save"

say "Updating webpack config to include .jsx file extension and resolved_paths"
insert_into_file Webpacker.config.config_path, "    - .jsx\n", after: /\bextensions:\n/
# For newer webpacker
insert_into_file Webpacker.config.config_path, "'app/views', 'app/components'", after: /additional_paths: \[/
# For older webpacker
insert_into_file Webpacker.config.config_path, "'app/views', 'app/components'", after: /resolved_paths: \[/

say "Webpacker now supports breezy.js 🎉", :green
