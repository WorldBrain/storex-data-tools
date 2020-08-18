import { CollectionDefinitionMap } from "@worldbrain/storex"

const TEST_STORAGE_VERSION = new Date('2020-02-02')
export const TEST_COLLECTION_DEFINITIONS: CollectionDefinitionMap = {
    user: {
        version: TEST_STORAGE_VERSION,
        fields: {
            id: { type: 'string' },
            displayName: { type: 'string', optional: true },
        },
        indices: [
            { field: 'id', pk: true }
        ]
    },
    sharedList: {
        version: TEST_STORAGE_VERSION,
        fields: {
            createdWhen: { type: 'timestamp' },
            updatedWhen: { type: 'timestamp' },
            title: { type: 'string' },
            description: { type: 'string', optional: true },
        },
        relationships: [
            { alias: 'creator', childOf: 'user' }
        ]
    },
    // sharedListEntry: {
    //     version: TEST_STORAGE_VERSION,
    //     fields: {
    //         createdWhen: { type: 'timestamp' },
    //         updatedWhen: { type: 'timestamp' },
    //         entryTitle: { type: 'string' },
    //         normalizedUrl: { type: 'string' },
    //         originalUrl: { type: 'string' },
    //     },
    //     relationships: [
    //         { childOf: 'sharedList' },
    //         { alias: 'creator', childOf: 'user' }
    //     ],
    // },
    sharedAnnotation: {
        version: TEST_STORAGE_VERSION,
        fields: {
            normalizedPageUrl: { type: 'string' },
            createdWhen: { type: 'timestamp' },
            uploadedWhen: { type: 'timestamp' },
            updatedWhen: { type: 'timestamp' },
            body: { type: 'string', optional: true },
            comment: { type: 'string', optional: true },
            selector: { type: 'string', optional: true },
        },
        relationships: [
            { alias: 'creator', childOf: 'user' }
        ]
    },
    sharedAnnotationListEntry: {
        version: TEST_STORAGE_VERSION,
        fields: {
            createdWhen: { type: 'timestamp' },
            uploadedWhen: { type: 'timestamp' },
            updatedWhen: { type: 'timestamp' },
            normalizedPageUrl: { type: 'string' },
        },
        relationships: [
            { alias: 'creator', childOf: 'user' },
            { connects: ['sharedList', 'sharedAnnotation'] },
        ],
    },
}