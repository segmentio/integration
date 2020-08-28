import { SuperAgentRequest, Response } from 'superagent'
import * as http from 'http'
import * as https from 'https'
import { Track, Page, Identify, Facade, Group, Screen } from 'segmentio-facade'

export interface IntegrationStatic<Settings extends object, Options extends object = { [key: string]: any }> {
  /**
   * A reference to the prototype.
   */
  readonly prototype: Integration<Settings, Options> & { [key: string]: any }

  /**
   * Creates a new integration.
   * @param settings The integration settings
   */
  new (settings: Settings, features: string[]): Integration<Settings, Options>

  /**
   * Ensure the event contains a specific property value.
   * @param path a path to a given property in the message payload.
   * Returns true if the property is truthy, false otherwise.
   */
  ensure(path: string): this

  /**
   * Ensure the event contains a specific property value
   * @param fn a predicate function to test both the event payload and settings objects.
   * Can be used to ensure an event contains required event properties and/or settings.
   */
  ensure(fn: (this: IntegrationStatic<Settings>, msg: Facade<Options>, settings: Settings) => boolean | Error | void): this

  /**
   *
   * @param endpoint Define the base endpoint of the partner API.
   * This should just be the root domain.
   * @example https://foobar.com
   * @example foobar.com
   */
  endpoint(endpoint: string): this

  /**
   * Define functions to use as `mapper` methods.
   * If defined, all incoming events will first be passed into the appropriate mapper method
   * and then those return values will be passed into the integration's event handlers.
   * @param mapper
   * @deprecated
   */
  mapper(mapper: object): this

  mapping(mapping: string): this

  /**
   * Specify a custom timeout value for requests to the partner API.
   * If not specified, this defaults to 15s.
   * @param timeout the timeout threshold in milliseconds
   */
  timeout(timeout: string | number): this

  /**
   * Define a custom http/https agent to use for all event requests.
   * @param agent
   */
  agent(agent: http.Agent | https.Agent): this

  /**
   * Specify a specific channel to accept incoming events from.
   * @param channel
   */
  channel(channel: 'server' | 'client'): this

  /**
   * Specify specific channels to accept incoming events from.
   * @param channels
   */
  channels(channels: ('server' | 'client' | 'mobile')[]): this
  retries(retries: number): this
  ca(ca: string[]): this
  /**
   * Reject an event with a given message.
   * We return a 400 to the caller.
   * @param message message specifying to the user the event was rejected
   */
  reject(message?: string): Error

  /**
   * Reject an even as invalid with a given message.
   * We return a 400 to the caller.
   * @param message message specifying to the user the event was rejected
   */
  invalid(message?: string): Error
}

export interface Integration<Settings extends object, Options extends object> {
  name: string
  settings: Settings
  features: string[]

  /**
   * Initialize is called when the integration class is instantiated.
   */
  initialize(): void
  invalid(message?: string): Error

  /**
   * Reject an event with a given message.
   * We return a 400 to the caller.
   * @param message message specifying to the user the event was rejected
   */
  reject(message?: string): Error

  /**
   * Get the integration name returned as a slug (ie. hyphen-cased)
   */
  slug(): string

  /**
   * Check whether or not a given event is enabled for the integration.
   * If it is not, an Error is returned (not thrown).
   * @param facade
   */
  enabled(facade: Facade): Error | void

  /**
   * Apply a rate limiting lock on incoming requests to the integration.
   * If applied, any requests sent during the lockout period will be rejected before being sent to the integration event handlers.
   * These events will be queued and retried.
   * @param key key to use to cache the lock timeout in Redis.
   * @param timeout timeout value in ms.
   * @param cb
   */
  lock(key: string, timeout: string, cb: (error?: Error) => void): void
  lock(key: string, cb: (error?: Error) => void): void
  lock(key: string, timeout: string): Promise<void>
  lock(key: string): Promise<void>

  /**
   * Unlock a previous lock and remove rate limits.
   * @param key
   * @param cb
   */
  unlock(key: string, cb: (error?: Error) => void): void
  unlock(key: string): Promise<void>
  request(method: string, path?: string): SuperAgentRequest
  post(url?: string): SuperAgentRequest
  get(url?: string): SuperAgentRequest
  put(url?: string): SuperAgentRequest
  ensure(value: any, name: string): Error | void
  redis(client: any): this
  redis(): any

  // Event Handlers.
  // We need to explicitly declare the `this` binding for each as many integrations use prototypal class construction.
  // TS does not seem to understand this pattern well and it loses the reference to `this`.
  track?(facade: Track<Options>, cb?: (err?: Error, res?: any) => void): Promise<any> | any
  identify?(facade: Identify<Options>, cb?: (err?: Error, res?: any) => void): Promise<any> | any
  page?(facade: Page<Options>, cb?: (err?: Error, res?: any) => void): Promise<any> | any
  group?(facade: Group<Options>, cb?: (err?: Error, res?: any) => void): Promise<any> | any
  screen?(facade: Screen<Options>, cb?: (err?: Error, res?: any) => void): Promise<any> | any
}
