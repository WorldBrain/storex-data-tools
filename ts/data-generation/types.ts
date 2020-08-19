import type * as faker from 'faker'

export interface SingleObjectTemplate {
    values: ValueConfigMap
    seed: SeedConfig
}

export interface MultiObjectTemplate {
    values: { [type: string]: ValueConfigMap },
    seed: SeedConfig
    seeds?: { [type: string]: SeedConfig }
    counts: { [type: string]: number },
    prepareObjects?: { [type: string]: ObjectPreparer }
    order?: string[]
}

export type SeedConfig = 'keep' | 'random' | number
export type ValueConfig = LiteralValueConfig | TemplateValueConfig | FakeValueConfig
export interface ValueConfigMap { [key: string]: ValueConfig }
export interface LiteralValueConfig { literal: any }
export interface TemplateValueConfig { template: (args: TemplateValueArgs) => any }
export interface TemplateValueArgs {
    context: { [key: string]: any },
    values: { [key: string]: any },
    object: (type: string) => any,
    value: (config: ValueConfig) => any
}
export type ObjectPreparer = (args: TemplateValueArgs) => { context: { [key: string]: any } }

export type FakeValueConfig = { fake: (fakes: typeof faker) => any }
