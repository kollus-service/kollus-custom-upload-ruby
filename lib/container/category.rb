require_relative 'container'

# Category
#
# @attr [Integer] id
# @attr [String] key
# @attr [String] name
# @attr [Integer] parent_id
# @attr [Integer] level
class Category < Container
  attr_accessor(
    :id,
    :key,
    :name,
    :parent_id,
    :level
  )
end