require_relative 'container'

# Channel
#
# @attr [Integer] id
# @attr [String] key
# @attr [String] name
# @attr [String] media_content_key
# @attr [Integer] use_pingback
# @attr [Integer] status
class Channel < Container
  attr_accessor(
    :id,
    :key,
    :name,
    :media_content_key,
    :use_pingback,
    :status
  )
end