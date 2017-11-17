module Breezy
  module Render
    def default_render(*args)
      if @_use_breezy_html
        render(*args)
      else
        super
      end
    end

    def render(*args, &block)
      render_options = args.extract_options!
      breezy = render_options.delete(:breezy)
      breezy = {} if breezy == true || @_use_breezy_html

      if breezy
        view_parts = _prefixes.reverse.push(action_name)[1..-1]
        view_name = view_parts.map(&:camelize).join

        breezy[:screen] ||= view_name
        render_options[:locals] ||= {}
        render_options[:locals][:breezy] = breezy
      end

      if @_use_breezy_html && request.format == :html
         original_formats = self.formats

         @breezy = render_to_string(*args, render_options.merge(formats: [:js]))
         self.formats = original_formats
         render_options.reverse_merge!(formats: original_formats, template: 'breezy/response')
      end

      super(*args, render_options, &block)
    end
  end
end
