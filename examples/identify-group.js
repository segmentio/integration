
/**
 * This example shows how we handle
 * integrations that have API of:
 *
 *    POST `/user` -> { id, traits, companyId }
 *    POST `/company` -> { id, traits }
 *
 * So it ties a user to a company using `/identify`
 * but it can't tie a company to a user on `/company`.
 *
 * So we must upsert the company and only then we can tie the user
 * to the company.
 */

var integration = require('..');

/**
 * Expose `Example`
 */

var Example = module.exports = integration('Example')
  .channels(['server', 'mobile', 'client'])
  .endpoint('https://localhost:3000')
  .ensure('message.userId')
  .retries(2);

/**
 * Identify.
 *
 * @param {Identify} msg
 * @param {Function} fn
 * @api public
 */

Example.prototype.identify = function(msg, fn){
  return this
    .post('/identify')
    .send({ id: msg.userId() })
    .send({ traits: msg.traits() })
    .send({ companyId: msg.proxy('traits.company.id') })
    .end(this.handle(fn));
};

/**
 * Group.
 *
 * We first create the company, and then tie it to the user.
 *
 * @param {Group} msg
 * @param {Function} fn
 */

Example.prototype.group = function(msg, fn){
  var self = this;
  this
    .post('/company')
    .send({ id: msg.groupId() })
    .send({ traits: msg.traits() })
    .end(this.handle(function(err){
      if (err) return fn(err);
      self.identify(toIdentify(msg), fn);
    }));
};

/**
 * Turn a `Group` to `Identify`.
 *
 * @param {Group} msg
 * @return {Identify}
 */

function toIdentify(msg){
  var json = msg.json();
  json.userId = msg.userId();
  json.traits = {};
  json.traits.company = { id: msg.groupId() };
  return new Identify(json);
}
