export type ValueConfig = LiteralValueConfig | TemplateValueConfig | FakeValueConfig
export type ValueConfigMap = {[key : string] : ValueConfig}
export type LiteralValueConfig = { literal : any }
export type TemplateValueConfig = { template : (args : {context : {[key : string] : any}, value : (config : ValueConfig) => any}) => any }

export type FakeValueConfig = {fake : string} | FakeValueConfigWithInput<'random.arrayElement', any[]>
export interface FakeValueConfigWithInput<Name, InputType> {
    fake : Name
    input : InputType
}
