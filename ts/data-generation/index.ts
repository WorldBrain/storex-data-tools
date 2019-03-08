import * as faker from 'faker'
import { ValueConfigMap, LiteralValueConfig, ValueConfig, TemplateValueConfig, FakeValueConfig, SeedConfig } from './types';

export function generateObjects(
    objectConfigs : {[type : string] : ValueConfigMap},
    options : { seed : SeedConfig, seeds? : {[type : string] : SeedConfig}, counts : {[type : string] : number} }
) {
    _maybeSeed(options.seed)

    const objects : {[type : string] : any[]} = {}
    for (const [type, config] of Object.entries(objectConfigs)) {
        if (options.seeds) {
            _maybeSeed(options.seeds[type])
        }

        objects[type] = []

        const count = options.counts[type]
        for (let i = 0; i < count; ++i) {
            objects[type].push(generateObject(config, { seed: 'keep', objects }))
        }
    }
    return objects
}

export function generateObject(template : ValueConfigMap, options : { seed : SeedConfig, objects? : {[type : string] : any} }) {
    _maybeSeed(options.seed)

    const object = {}
    for (const [key, field] of Object.entries(template)) {
        if (field['literal']) {
            object[key] = (field as LiteralValueConfig).literal
            continue
        }

        object[key] = generateValue(field, {context: object, objects: options.objects})
    }

    return object
}

export function generateValue(config : ValueConfig, options : {context?: {[key : string] : any}, objects? : {[type : string] : any}} = {}) {
    if (config['literal']) {
        return (config as LiteralValueConfig).literal
    }
    if (config['template']) {
        return generateTemplateValue(config as TemplateValueConfig, options)
    }
    if (config['fake']) {
        return generateFakeValue(config as FakeValueConfig)
    }
}

export function generateTemplateValue(
    config : TemplateValueConfig,
    options : {context?: {[key : string] : any}, objects? : {[type : string] : any}} = {}
) {
    return config.template({
        context: options.context,
        value: (config) => generateValue(config, options),
        object: options.objects && ((type : string) => {
            const objects = options.objects[type]
            return generateFakeValue({fake: 'random.arrayElement', input: objects})
        }),
    } as any)
}

export function generateFakeValue(config : FakeValueConfig) {
    const [namespace, funcName] = config.fake.split('.')
    const func = faker[namespace][funcName]
    const args = config['input'] ? [config['input']] : []
    return func(...args)
}

function _maybeSeed(seed? : SeedConfig) {
    if (!seed) {
        return
    }

    if (seed as any === 'random') {
        faker.seed()
    } else if (seed !== 'keep') {
        faker.seed(seed)
    }
}