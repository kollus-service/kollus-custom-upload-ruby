require_relative 'container'
require_relative 'category'
require_relative 'channel'

# MediaContent
#
# @attr [Integer] id
# @attr [Integer] kind
# @attr [String] kind_name
# @attr [String] title
# @attr [String] upload_file_key
# @attr [Integer] duration
# @attr [Category] category
# @attr [Channel] channel
# @attr [Integer] use_encryption
# @attr [String] poster_url
# @attr [String] original_file_name
# @attr [String] original_file_human_readable_size;
# @attr [Integer] transcoding_stage
# @attr [String] transcoding_stage_name
# @attr [String] media_content_key
# @attr [Integer] status
# @attr [Integer] transcoded_at
# @attr [Integer] created_at
# @attr [Integer] updated_at
class MediaContent < Container
  attr_accessor(
    :id,
    :kind,
    :kind_name,
    :title,
    :upload_file_key,
    :duration,
    :category,
    :channel,
    :use_encryption,
    :poster_url,
    :original_file_name,
    :original_file_human_readable_size,
    :transcoding_stage,
    :transcoding_stage_name,
    :media_content_key,
    :status,
    :transcoded_at,
    :created_at,
    :updated_at
  )

  # initialize
  #
  # @return [Void]
  def initialize(args)
    exclude_keys = [
      'category_name',
      'category_key',
      'channels',
      'media_information',
      'transcoding_files'
    ]

    args.each do |k, v|
      unless v.nil? || exclude_keys.include?(k)
        instance_variable_set("@#{k}", v)
      end
    end

    @category = Category.new({ name: args['category_name'], key: args['category_key'] })

    @channels = []
    if args['channels'].is_a?(Array)
      args['channels'].each do |c|
        @channels.push(Channel.new(c))
      end
    end
  end
end