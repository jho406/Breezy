import React from 'react'
import parse, { domToReact } from 'html-react-parser'
import attributesToProps from 'html-react-parser/lib/attributes-to-props'
import PropTypes from 'prop-types'

export default class RailsTag extends React.Component {
  constructor(props) {
    super(props)
    this.replace = this.replace.bind(this)
  }

  shouldComponentUpdate(nextProps) {
    return this.props.html !== nextProps.html
  }

  replace(domNode) {
    const { parent, type, name, attribs, children } = domNode

    if (!parent && type === 'tag') {
      const nextProps = {
        ...this.props,
        ...attributesToProps(attribs),
        children: domToReact(children),
      }

      delete nextProps.html
      return React.createElement(name, nextProps)
    }
  }

  render() {
    return parse(this.props.html, {
      replace: this.replace,
    })
  }
}

RailsTag.propTypes = {
  html: PropTypes.string,
}
