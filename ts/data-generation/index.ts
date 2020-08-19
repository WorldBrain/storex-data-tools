import * as faker from 'faker'
import { ValueConfig, TemplateValueConfig, FakeValueConfig, SeedConfig, MultiObjectTemplate, SingleObjectTemplate, ValueConfigMap } from './types';
import { FieldType, isChildOfRelationship, isConnectsRelationship } from '@worldbrain/storex';
import { RegistryCollections } from '@worldbrain/storex/lib/registry';

type IdGenerator = (options: { collectionName: string, idType: 'number' | 'string' }) => number | string
type SchemaValueConfigGenerator = (input: {
    collectionName: string, fieldName: string, fieldType: FieldType,
    advanceTime: () => number, generateId: (options: { collectionName: string }) => number | string
}) => ValueConfig

export function generateSchemaTemplate(collections: RegistryCollections, options: {
    autoPkType: 'number' | 'string'
    startTime?: number
    defaultTimeStep?: number
    getValueConfig?: SchemaValueConfigGenerator
    generateId?: IdGenerator
}) {
    const getValueConfig = options?.getValueConfig ?? getSchemaFieldValueConfig

    let time = options?.startTime ?? (new Date('2020-06-06 20:20:20')).getTime()
    const defaultTimeStep = options?.defaultTimeStep ?? 1000 * 60
    const advanceTime = () => {
        time += defaultTimeStep
        return time
    }
    const generateId: IdGenerator = options?.generateId ?? (() => {
        const counts: { [collectionName: string]: number } = {}
        const generator: IdGenerator = (generationOptions) => {
            counts[generationOptions.collectionName] = counts[generationOptions.collectionName] ?? 0
            counts[generationOptions.collectionName] += 1
            const id = counts[generationOptions.collectionName];
            return generationOptions.idType === 'number' ? id : `${generationOptions.collectionName}-${id}`
        }
        return generator
    })()

    const values: { [collectionName: string]: ValueConfigMap } = {}
    for (const [collectionName, collectionDefinition] of Object.entries(collections)) {
        const collectionValues: ValueConfigMap = {}
        for (const [fieldName, fieldConfig] of Object.entries(collectionDefinition.fields)) {
            collectionValues[fieldName] = getValueConfig({
                collectionName,
                fieldName,
                fieldType: fieldConfig.type,
                advanceTime,
                generateId: (generationOptions) => generateId({ idType: options.autoPkType, collectionName: generationOptions.collectionName }),
            })
        }
        for (const relationship of collectionDefinition.relationships ?? []) {
            if (isChildOfRelationship(relationship)) {
                const targetCollectionDefinition = collections[relationship.targetCollection!]
                const pkIndex = targetCollectionDefinition.pkIndex as string
                collectionValues[relationship.alias!] = { template: ({ object }) => object(relationship.targetCollection!)[pkIndex] }
            } else if (isConnectsRelationship(relationship)) {
                const createConfig = (index: 0 | 1): ValueConfig => {
                    const targetCollectionDefinition = collections[relationship.connects[index]]
                    const pkIndex = targetCollectionDefinition.pkIndex as string
                    return { template: ({ object }) => object(relationship.connects[index])[pkIndex] }
                }
                collectionValues[relationship.aliases![0]] = createConfig(0)
                collectionValues[relationship.aliases![1]] = createConfig(1)
            }
        }
        values[collectionName] = collectionValues
    }

    return { values, order: [] }
}

export const getSchemaFieldValueConfig: SchemaValueConfigGenerator = (input) => {
    const CONFIG_CREATORS: { [fieldType in FieldType]?: () => ValueConfig } = {
        "auto-pk": () => ({ template: () => input.generateId({ collectionName: input.collectionName }) }),
        string: () => ({ fake: ({ random }) => random.words(3) }),
        int: () => ({ fake: ({ random }) => random.number() }),
        boolean: () => ({ fake: ({ random }) => random.arrayElement([true, false]) }),
        datetime: () => ({ template: () => new Date(input.advanceTime()) }),
        timestamp: () => ({ template: () => input.advanceTime() })
    }
    const configCreator = CONFIG_CREATORS[input.fieldType]
    if (!configCreator) {
        throw new Error(
            `Could not create a sane default value config for field ${input.fieldName} ` +
            `in collection '${input.collectionName}' which is of type ${input.fieldType}`
        )
    }

    return configCreator()
}

export function generateObjects(template: MultiObjectTemplate) {
    _maybeSeed(template.seed)

    const objects: { [type: string]: any[] } = {}
    for (const [type, config] of Object.entries(template.values)) {
        if (template.seeds) {
            _maybeSeed(template.seeds[type])
        }

        objects[type] = []

        const count = template.counts[type]
        const prepareObjects = template.prepareObjects?.[type]
        for (let i = 0; i < count; ++i) {
            const context = prepareObjects ? generateTemplateValue({ template: prepareObjects }, {
                context: {},
                values: {},
                objects
            }).context : {}
            const newObject = generateObject({ values: config, seed: 'keep' }, { objects, context });
            objects[type].push(newObject)
        }
    }
    return objects
}

export function generateObject(template: SingleObjectTemplate, options?: {
    context?: { [key: string]: any }
    objects?: { [type: string]: any }
}) {
    _maybeSeed(template.seed)

    const object = {}
    for (const [key, field] of Object.entries(template.values)) {
        if (typeof field === 'object' && 'literal' in field) {
            object[key] = field.literal
            continue
        }

        object[key] = generateValue(field, {
            values: object,
            objects: options?.objects,
            context: options?.context ?? {}
        })
    }

    return object
}

export function generateValue(config: ValueConfig, options: {
    values: { [key: string]: any },
    context: { [key: string]: any },
    objects?: { [type: string]: any }
}) {
    if (typeof config === 'object' && 'literal' in config) {
        return config.literal
    }
    if (typeof config === 'object' && 'template' in config) {
        return generateTemplateValue(config, options)
    }
    if (typeof config === 'object' && 'fake' in config) {
        return generateFakeValue(config)
    }
}

export function generateTemplateValue(config: TemplateValueConfig, options: {
    values: { [key: string]: any },
    context: { [key: string]: any },
    objects?: { [type: string]: any }
}): any {
    return config.template({
        values: options.values,
        context: options.context,
        value: (config: ValueConfig) => generateValue(config, options),
        object: (type: string) => {
            if (!options.objects) {
                throw new Error(`Tried to get a random object, but we're not generate multiple objects`)
            }
            const objects = options?.objects?.[type]
            return generateFakeValue({ fake: ({ random }) => random.arrayElement(objects) })
        },
    })
}

export function generateFakeValue(config: FakeValueConfig) {
    return config.fake(faker)
}

function _maybeSeed(seed?: SeedConfig) {
    if (!seed) {
        return
    }

    if (seed === 'random') {
        faker.seed(Math.random())
    } else if (seed !== 'keep') {
        faker.seed(seed)
    }
}
