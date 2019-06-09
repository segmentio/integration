import * as core from './lib/integration'

declare function integration<T extends object, O extends object = { [key: string]: any }>(name: string): core.IntegrationStatic<T, O>

declare namespace integration {
  interface Integration<Settings extends object, Options extends object> extends core.Integration<Settings, Options> { }
  interface IntegrationStatic<Settings extends object, Options extends object> extends core.IntegrationStatic<Settings, Options> { }
}

export = integration
