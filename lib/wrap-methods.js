
/**
 * Methods to wrap.
 */

var methods = [
  'identify',
  'screen',
  'alias',
  'track',
  'group',
  'page'
];

/**
 * Wrap methods of `integration`.
 *
 * @param {Integration} integration
 * @api private
 */

module.exports = function(integration){
  var mapper = integration.mapper || {};
  methods.forEach(function(method){
    if (!mapper[method]) return;
    var fn = integration[method];
    integration[method] = function(message, settings, callback){
      var payload = mapper[method](message, settings);
      this.debug('mapped %j to %j', message, payload);
      return fn.call(this, payload, settings, callback);
    };
  });
};
