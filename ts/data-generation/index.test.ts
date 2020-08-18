import * as expect from 'expect'
import { StorageRegistry } from '@worldbrain/storex';
import { generateObject, generateObjects, generateSchemaTemplate, getSchemaFieldValueConfig } from '.';
import { TEST_COLLECTION_DEFINITIONS } from '../index.test.data';

describe('Data generation tools', () => {
    it('should generate simple objects', () => {
        expect(generateObject({
            values: {
                type: { fake: ({ random }) => random.arrayElement(['appartment', 'room']) },
                city: { literal: 'Green Egg Valley' },
            },
            seed: 1
        }
        )).toEqual({ type: 'appartment', city: 'Green Egg Valley' })

        expect(generateObject({
            values: {
                type: { fake: ({ random }) => random.arrayElement(['appartment', 'room']) },
                city: { literal: 'Green Egg Valley' },
            },
            seed: 3
        })).toEqual({ type: 'room', city: 'Green Egg Valley' })
    })

    it('should generate objects with fields that depend on each other', () => {
        expect(generateObject({
            values: {
                type: { fake: ({ random }) => random.arrayElement(['appartment', 'room']) },
                city: { literal: 'Green Egg Valley' },
                description: { template: ({ context }) => `Wonderful ${context.type} in ${context.city}` },
            },
            seed: 1
        })).toEqual({
            type: 'appartment', city: 'Green Egg Valley',
            description: 'Wonderful appartment in Green Egg Valley'
        })

        expect(generateObject({
            values: {
                type: { fake: ({ random }) => random.arrayElement(['appartment', 'room']) },
                city: { literal: 'Green Egg Valley' },
                description: { template: ({ context }) => `Wonderful ${context.type} in ${context.city}` },
            },
            seed: 3
        })).toEqual({
            type: 'room', city: 'Green Egg Valley',
            description: 'Wonderful room in Green Egg Valley'
        })
    })

    it('should generate values inside templates', () => {
        expect(generateObject({
            values: {
                type: { fake: ({ random }) => random.arrayElement(['appartment', 'room']) },
                city: { literal: 'Green Egg Valley' },
                description: {
                    template: ({ context, value }) =>
                        `Wonderful ${context.type} for ${value({ fake: ({ random }) => random.arrayElement([2, 4]) })} guests in ${context.city}`
                },
            }, seed: 1
        })).toEqual({
            type: 'appartment', city: 'Green Egg Valley',
            description: 'Wonderful appartment for 4 guests in Green Egg Valley'
        })
    })

    it('should generate objects with relationships between each other', () => {
        expect(generateObjects({
            values: {
                users: {
                    id: { fake: ({ random }) => random.number() },
                },
                projects: {
                    user: { template: ({ object }) => object('users') },
                }
            },
            seed: 1,
            seeds: { projects: 3 },
            counts: { users: 2, projects: 2 }
        })).toEqual({
            users: [
                { id: 41702 },
                { id: 99718 }
            ],
            projects: [
                { user: { id: 99718 } },
                { user: { id: 41702 } },
            ]
        })
    })

    it('should generate test data for Storex collections', async () => {
        const storageRegistry = new StorageRegistry()
        storageRegistry.registerCollections(TEST_COLLECTION_DEFINITIONS)
        await storageRegistry.finishInitialization()

        const schemaTemplate = generateSchemaTemplate(storageRegistry.collections, {
            autoPkType: 'string',
        })
        expect(schemaTemplate).toEqual({
            values: {
                user: expect.objectContaining({}),
                sharedList: expect.objectContaining({}),
                sharedAnnotation: expect.objectContaining({}),
                sharedAnnotationListEntry: expect.objectContaining({}),
            },
            order: [],
        })
        const objects = generateObjects({
            values: schemaTemplate.values,
            seed: 5,
            counts: { user: 1, sharedList: 2, sharedAnnotation: 4, sharedAnnotationListEntry: 6 }
        })
        expect(objects).toEqual({
            user: [expect.objectContaining({})],
            sharedList: [
                expect.objectContaining({}),
                expect.objectContaining({}),
            ],
            sharedAnnotation: [
                expect.objectContaining({}),
                expect.objectContaining({}),
                expect.objectContaining({}),
                expect.objectContaining({}),
            ],
            sharedAnnotationListEntry: [
                expect.objectContaining({}),
                expect.objectContaining({}),
                expect.objectContaining({}),
                expect.objectContaining({}),
                expect.objectContaining({}),
                expect.objectContaining({}),
            ],
        })
    })
})
