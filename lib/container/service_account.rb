require_relative 'container'

# ServiceAccount
#
# @attr [String] key
# @attr [String] name
# @attr [String] api_access_token
# @attr [String] custom_key
class ServiceAccount < Container
  attr_accessor(
    :key,
    :name,
    :api_access_token,
    :custom_key
  )

  # security_key
  #
  # @raise [Exception]
  # @return [String]
  def security_key
    return @security_key unless @security_key.nil?
    return @key unless @key.nil?
    raise 'security key is empty'
  end
end