require 'net/http'
require 'json'
require_relative '../container/service_account'
require_relative '../container/category'
require_relative '../container/channel'
require_relative '../container/upload_file'
require_relative '../container/media_content'

# KollusApiClient
#
# @attr [ServiceAccount] service_account
# @attr [String] domain
# @attr [String] version
# @attr [String] scheme
class KollusApiClient
  attr_accessor(:service_account, :domain, :version, :scheme)

  # initialize
  #
  # @param [ServiceAccount] service_account
  # @param [String] domain
  # @param [String] version
  def initialize(service_account:, domain: 'kr.kollus.com', version: '0')
    @service_account = service_account
    @domain = domain
    @version = version
    @scheme = 'http'
  end

  # upload_url_response
  #
  # @param [String] category_key
  # @param [Boolean] use_encryption
  # @param [Boolean] is_audio_upload
  # @param [String] title
  # @return [Hash]
  def upload_url_response(
    category_key: nil,
    use_encryption: 0,
    is_audio_upload: 0,
    title: nil
  )
    post_params = {
      access_token: @service_account.api_access_token,
      category_key: category_key,
      is_encryption_upload: use_encryption,
      is_audio_upload: is_audio_upload,
      expire_time: 600,
      title: title
    }
    res = Net::HTTP.post_form(
      URI(api_url('media_auth/upload/create_url')),
      post_params
    )
    JSON.parse(res.body)
  end

  # categories
  #
  # @return [Array<Category>]
  def categories
    get_params = {
      access_token: @service_account.api_access_token
    }

    url = URI(api_url('media/category') + '?' + URI.encode_www_form(get_params))
    res = Net::HTTP.get_response(url)

    items = []
    trans_items(JSON.parse(res.body)).each do |i|
      items.push(Category.new(i))
    end

    items
  end

  # channels
  #
  # @return [Array<Channel>]
  def channels
    get_params = {
      access_token: @service_account.api_access_token
    }

    url = URI(api_url('media/channel') + '?' + URI.encode_www_form(get_params))
    res = Net::HTTP.get_response(url)

    items = []
    trans_items(JSON.parse(res.body)).each do |i|
      items.push(Channel.new(i))
    end

    items
  end

  # find_upload_files
  #
  # @param [Integer] page
  # @param [Integer] per_page
  # @return [Hash]
  def find_upload_files(page: 1, per_page: 10)
    get_params = {
      access_token: @service_account.api_access_token,
      per_page: per_page,
      page: page,
      force: 1
    }

    url = URI(api_url('media/upload_file') + '?' + URI.encode_www_form(get_params))
    res = Net::HTTP.get_response(url)

    response = JSON.parse(res.body)
    items = []
    trans_items(response).each do |i|
      items.push(UploadFile.new(i))
    end

    { per_page: per_page, count: response['result']['count'], items: items }
  end

  # find_channel_media_contents
  #
  # @param [String] channel_key
  # @param [Integer] page
  # @param [Integer] per_page
  # @return [Hash]
  def find_channel_media_contents(channel_key:, page:1, per_page: 10)
    params = {
      access_token: @service_account.api_access_token,
      channel_key: channel_key,
      per_page: per_page,
      page: page
    }

    url = URI(api_url('media/channel/media_content') + '?' + URI.encode_www_form(params))
    res = Net::HTTP.get_response(url)
    response = JSON.parse(res.body)
    items = []

    trans_items(response).each do |i|
      items.push(MediaContent.new(i))
    end

    { per_page: per_page, count: response['result']['count'], items: items }
  end

  # channel_media_content
  #
  # @param [String] channel_key
  # @param [String] upload_file_key
  # @return MediaContent
  def channel_media_content(channel_key:, upload_file_key:)
    params = {
      access_token: @service_account.api_access_token,
      channel_key: channel_key
    }

    url = URI(api_url('media/channel/media_content/' + upload_file_key) + '?' + URI.encode_www_form(params))

    res = Net::HTTP.get_response(url)
    response = JSON.parse(res.body)

    if response['result'].is_a?(Hash) && !response['result'].key?('item')
      raise 'Media content is not exists'
    end

    MediaContent.new(response['result']['item'])
  end

private

  # api_url
  #
  # @param [String] path
  # @return [String]
  def api_url(path)
    "#{@scheme}://api.#{@domain}/#{@version}/#{path}"
  end

  # trans_items
  #
  # @param [Hash] res
  # @return [Array]
  def trans_items(res)
    if res.key?('error') && res['error'] == 1
      if res.key?('message')
        raise res['message']
      else
        raise 'Response is valid'
      end
    elsif res.key?('result') && res['result'].key?('count') && res['result'].key?('items')
      if res['result']['items'].is_a?(Array)
        return res['result']['items']
      elsif res['result']['items'].key?('item') && res['result']['items']['item'].is_a?(Array)
        return res['result']['items']['item']
      else
        raise 'Response is valid'
      end
    else
      raise 'Response is valid'
    end
  end
end