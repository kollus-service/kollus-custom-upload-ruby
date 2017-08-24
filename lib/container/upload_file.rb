require_relative 'container'

# UploadFile
#
# @attr [String] upload_file_key
# @attr [Integer] midia_content_id
# @attr [String] title
# @attr [Integer] transcoding_stage
# @attr [String] transcoding_stage_name
# @attr [Integer] transcoding_progress
# @attr [Integer] created_at
# @attr [Integer] transcoded_at
class UploadFile < Container
  attr_accessor(
    :upload_file_key,
    :midia_content_id,
    :title,
    :transcoding_stage,
    :transcoding_stage_name,
    :transcoding_progress,
    :created_at,
    :transcoded_at
  )
end