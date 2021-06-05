import React from 'react'
// import * as actionCreators from 'javascript/packs/action_creators'
// import {useDispatch} from 'react-redux'

export default function <%= plural_table_name.camelize %>Index({
  // visit,
  // remote,
  flash,
  new<%= singular_table_name.camelize %>Path,
  <%= plural_table_name.camelize(:lower) %> = [],
}) {
  const <%= singular_table_name.camelize(:lower) %>Items = <%= plural_table_name.camelize(:lower) %>.map((<%= singular_table_name.camelize(:lower) %>, key) => {
    return (
      <tr key={<%= singular_table_name.camelize(:lower) %>.id}>
        <%- attributes_list.select{|attr| attr != :id }.each do |attr| -%>
        <td>{<%=singular_table_name.camelize(:lower)%>.<%=attr.camelize(:lower)%>}</td>
        <%- end -%>
        <td><a href={ <%=singular_table_name%>.<%=singular_table_name.camelize(:lower)%>Path } data-bz-visit={true}>Show</a></td>
        <td><a href={ <%=singular_table_name%>.edit<%=singular_table_name.camelize%>Path } data-bz-visit={true}>Edit</a></td>
        <td><a href={ <%=singular_table_name%>.delete<%=singular_table_name.camelize%>Path }data-bz-visit={true} data-bz-method={"DELETE"}>Delete</a></td>
      </tr>
    )
  })

  return (
    <div>
      <p id="notice">{flash.notice}</p>

      <h1><%= plural_table_name.capitalize %></h1>

      <table>
        <thead>
          <%- attributes_list.select{|attr| attr != :id }.each do |attr| -%>
          <tr><th><%=attr.capitalize%></th></tr>
          <%- end -%>
          <tr>
            <th colSpan="3"></th>
          </tr>
        </thead>

        <tbody>
          {<%= singular_table_name %>Items}
        </tbody>
      </table>
      <br />
      <a href={new<%= singular_table_name.camelize %>Path} data-bz-visit={true}>New <%= singular_table_name.capitalize %></a>
    </div>
  )
}
