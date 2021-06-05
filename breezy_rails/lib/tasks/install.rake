namespace :breezy do
  desc "Verifies if any version of Yarn is installed"
  task :verify_yarn do
    begin
      yarn_version = `yarn --version`
      raise Errno::ENOENT if yarn_version.blank?
    rescue Errno::ENOENT
      $stderr.puts "Yarn not installed. Please download and install Yarn from https://yarnpkg.com/lang/en/docs/install/"
      $stderr.puts "Exiting!" && exit!
    end
  end

  desc "Verifies if any version of react is in package.json"
  task :verify_react do
    package_json = JSON.parse(File.read(Rails.root.join("package.json")))

    if package_json['dependencies']['react'].nil?
      $stderr.puts "React not installed. Did you install React? https://github.com/rails/webpacker#react"
      $stderr.puts "Exiting!" && exit!
    end
  end

  desc "Verifies webpacker has been installed"
  task "verify_webpacker" do
    begin
      require "webpacker/configuration"
    rescue LoadError
      $stderr.puts "Breezy's web install requires webpacker!"
      $stderr.puts "https://github.com/rails/webpacker#installation"
      $stderr.puts "Exiting!" && exit!
    end
  end

  namespace :install do
    desc "Install everything needed for breezy web"
    task 'web' => ["breezy:verify_webpacker", "webpacker:verify_install", "breezy:verify_react"] do
      template = File.expand_path("../install/web.rb", __dir__)
      exec "#{RbConfig.ruby} ./bin/rails app:template LOCATION=#{template}"
    end
  end
end

