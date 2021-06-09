// import '../helpers/jsdom.js'
import React from 'react'
import RailsTag from '../../lib/components/RailsTag'
import { mount } from 'enzyme';

describe('RailsTag', () => {
  it('renders nothing', () => {
    const component = mount(<RailsTag html={''}/>);

    expect(component.isEmptyRender()).toBe(true)
  })

  it('renders HTML', () => {
    const component = mount(
      <RailsTag html={'<a id="ok"><span>hello</span></a>'}/>
    )
    expect(component.isEmptyRender()).toBe(false)
  })

  it('passes other props to the HTML', () => {
    const component = mount(
      <RailsTag className="hello" html={'<a id="ok"><span>hello</span></a>'}/>
    )
    expect(component.html()).toContain('<a class="hello" id="ok"><span>hello</span></a>')
  })

  it('passes handlers', () => {
    const handler = jest.fn()
    const component = mount(
      <RailsTag onClick={handler} html={'<a id="ok"><span>hello</span></a>'}/>,
    )
    const target = component.find('a')
    target.simulate('click')
    expect(handler).toHaveBeenCalled()
  })
})
