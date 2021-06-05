import React from 'react'
import RailsTag from '@jho406/breezy/components/RailsTag'
// import * as actionCreators from 'javascript/packs/action_creators'
// import {useDispatch} from 'react-redux'

export default function <%= plural_table_name.camelize %>Edit ({
  // visit,
  // remote,
  form,
  flash,
  <%= singular_table_name.camelize(:lower) %>Path,
  <%= plural_table_name.camelize(:lower) %>Path,
}) {
  const error = flash.form_error

  const messagesEl = error && (
    <div id="error_explanation">
      <h2>{ error.explanation }</h2>
      <ul>{ error.messages.map(({body})=> <li key={body}>{body}</li>) }</ul>
    </div>
  )

  return (
    <div>
      {messagesEl}
      <RailsTag {...form} data-bz-visit={true}/>
      <a href={<%= singular_table_name.camelize(:lower) %>Path} data-bz-visit={true}>Show</a>
      <a href={<%= plural_table_name.camelize(:lower) %>Path}  data-bz-visit={true}>Back</a>
    </div>
  )
}
