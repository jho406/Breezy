import React from 'react'
// import * as actionCreators from 'javascript/packs/action_creators'
// import {useDispatch} from 'react-redux'

export default function <%= plural_table_name.camelize %>Show({
  // visit,
  // remote,
  flash,
  <%- attributes_list_with_timestamps.select{|attr| attr != :id }.each do |attr| -%>
  <%=attr.camelize(:lower)%>,
  <%- end -%>
  edit<%= singular_table_name.camelize %>Path,
  <%= plural_table_name.camelize(:lower) %>Path
}) {
  return (
    <div>
      <p id="notice">{flash && flash.notice}</p>
      <%- attributes_list_with_timestamps.select{|attr| attr != :id }.each do |attr| -%>
      <p>
        <strong><%= attr.capitalize %>:</strong>
        {<%=attr.camelize(:lower)%>}
      </p>
      <%- end -%>
      <a href={ edit<%= singular_table_name.camelize %>Path } data-bz-visit={true}>Edit</a>
      <a href={ <%= plural_table_name.camelize(:lower) %>Path } data-bz-visit={true}>Back</a>
    </div>
  )
}
