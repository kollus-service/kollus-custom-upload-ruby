require 'sinatra'
require 'yaml'
require 'json'
require 'cgi'
require_relative 'lib/client/kollus_api_client'
require_relative 'lib/container/service_account'

exists_config = File.file?('config.yml')
set :exists_config, exists_config
if exists_config
  config = YAML.load_file('config.yml')
  service_account = ServiceAccount.new(key: config['kollus']['service_account']['key'],
                                       api_access_token: config['kollus']['service_account']['api_access_token'],
                                       custom_key: config['kollus']['service_account']['custom_key'])
  kollus_api_client = KollusApiClient.new(service_account: service_account,
                                          domain: config['kollus']['domain'],
                                          version: config['kollus']['version'])

  set :kollus, config['kollus']
  set :service_account, service_account
  set :kollus_api_client, kollus_api_client
end

get '/' do
  locals = { exists_config: settings.exists_config, kollus: settings.kollus }

  if settings.exists_config
    # @type [KollusApiClient] kollus_api_client
    kollus_api_client = settings.kollus_api_client
    categories = kollus_api_client.categories

    locals[:categories] = categories
  end

  erb :index, locals: locals
end

post '/api/upload/create_url' do
  # @type [KollusApiClient] kollus_api_client
  kollus_api_client = settings.kollus_api_client
  data = kollus_api_client.upload_url_response(
    category_key: params['category_key'],
    use_encryption: params['use_encryption'],
    is_audio_upload: params['is_audio_upload'],
    title: params['title']
  )
  content_type :json, 'charset' => 'utf-8'
  data.to_json
end

get '/api/upload_file' do
  # @type [KollusApiClient] kollus_api_client
  kollus_api_client = settings.kollus_api_client
  data = kollus_api_client.find_upload_files

  auto_reload = false
  items = []
  data[:items].each do |i|
    auto_reload = true if [0, 1, 12].include?(i.transcoding_stage)
    items.push(i.to_hash)
  end

  content_type :json, 'charset' => 'utf-8'
  {
    per_page: data['per_page'],
    count: data['count'],
    items: items,
    auto_reload: auto_reload
  }.to_json
end
