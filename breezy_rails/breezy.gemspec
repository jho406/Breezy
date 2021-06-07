version = File.read(File.expand_path("../VERSION", __dir__)).strip

Gem::Specification.new do |s|
  s.name     = 'breezy'
  s.version  = version
  s.author   = 'Johny Ho'
  s.email    = 'jho406@gmail.com'
  s.license  = 'MIT'
  s.homepage = 'https://github.com/jho406/breezy/'
  s.summary  = 'Rails integration for BreezyJS'
  s.description = s.summary
  s.files    =   Dir['MIT-LICENSE', 'README.md', 'lib/**/*', 'app/**/*']
  s.test_files = Dir["test/*"]

  s.add_dependency 'actionpack', '>= 6.0.0'
  s.add_dependency 'props_template', '>= 0.20.0'
  s.add_dependency 'webpacker', '>= 3.0'

  s.add_development_dependency 'activerecord', '>= 6.0'
  s.add_development_dependency 'rake', ' ~> 12.0'
  s.add_development_dependency 'byebug', '~> 9.0'
  s.add_development_dependency 'sqlite3', '~> 1.3'
  s.add_development_dependency 'minitest', '~> 5.10'
  s.add_development_dependency 'capybara', '~> 3.0'
  s.add_development_dependency 'selenium-webdriver', '~> 3.11'
end
