# Container
class Container
  # initialize
  #
  # @return [Void]
  def initialize(args)
    args.each do |k, v|
      instance_variable_set("@#{k}", v) unless v.nil?
    end
  end

  # to_hash
  #
  # @return [Hash]
  def to_hash
    hash = {}
    instance_variables.each do |var|
      hash[var.to_s.delete("@")] = instance_variable_get(var)
    end
    hash
  end
end