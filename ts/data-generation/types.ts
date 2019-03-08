export type SeedConfig = 'keep' | 'random' | number
export type ValueConfig = LiteralValueConfig | TemplateValueConfig | FakeValueConfig
export type ValueConfigMap = {[key : string] : ValueConfig}
export type LiteralValueConfig = { literal : any }
export type TemplateValueConfig = { template : (args : TemplateValueArgs) => any }
export interface TemplateValueArgs {
    context : {[key : string] : any},
    object? : (type : string) => any,
    value : (config : ValueConfig) => any
}

export type FakeValueConfig = {fake : string} | FakeValueConfigWithInput<'random.arrayElement', any[]>
export interface FakeValueConfigWithInput<Name, InputType> {
    fake : Name
    input : InputType
}
