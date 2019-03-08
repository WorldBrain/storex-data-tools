import * as faker from 'faker'
import { ValueConfigMap, LiteralValueConfig, ValueConfig, TemplateValueConfig, FakeValueConfig } from './types';

export function generateObject(template : ValueConfigMap, options : { seed : number | 'keep' }) {
    if (options.seed != 'keep') {
        faker.seed(options.seed)
    }

    const object = {}
    for (const [key, field] of Object.entries(template)) {
        if (field['literal']) {
            object[key] = (field as LiteralValueConfig).literal
            continue
        }

        object[key] = generateValue(field, {context: object})
    }

    return object
}

export function generateValue(config : ValueConfig, options : {context?: {[key : string] : any}} = {}) {
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

export function generateTemplateValue(config : TemplateValueConfig, options : {context?: {[key : string] : any}} = {}) {
    return config.template({context: options.context, value: (config) => generateValue(config, options)})
}

export function generateFakeValue(config : FakeValueConfig) {
    const [namespace, funcName] = config.fake.split('.')
    const func = faker[namespace][funcName]
    const args = config['input'] ? [config['input']] : []
    return func(...args)
}
