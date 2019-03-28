const yaml = require('js-yaml')
import * as expect from "expect"
import StorageManager, { CollectionDefinitionMap } from "@worldbrain/storex"
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie"
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory"
import { dumpFixtures } from "./dumping";
import { loadFixtures } from "./loading";

export async function dumpTestFixtures(options: { collections: CollectionDefinitionMap, fixtures: any }) {
    const storageBackend = new DexieStorageBackend({ dbName: 'unittest', idbImplementation: inMemory() })
    const storageManager = new StorageManager({ backend: storageBackend as any })
    storageManager.registry.registerCollections(options.collections)
    await storageManager.finishInitialization()

    await loadFixtures({ storageManager, fixtures: options.fixtures })
    const fixtures = await dumpFixtures(storageManager)

    return { storageManager, fixtures }
}

describe('Fixtures', () => {
    it('should be able to load basic fixtures into memory', async () => {
        const { fixtures } = await dumpTestFixtures({
            collections: {
                user: {
                    version: new Date(),
                    fields: {
                        displayName: { type: 'string' },
                    },
                },
                story: {
                    version: new Date(),
                    fields: {},
                    relationships: [
                        { childOf: 'user' }
                    ]
                },
                storyElement: {
                    version: new Date(),
                    fields: {
                        content: { type: 'string' }
                    },
                    relationships: [
                        { childOf: 'story', reverseAlias: 'elements' }
                    ]
                }
            },
            fixtures: yaml.safeLoad(`
            users:
                - $store: defaultUser
                  displayName: Vincent
            stories:
                - user: {$ref: users.defaultUser}
                  elements:
                    - {content: I start using the platform}
                    - {content: get to the functionality most relevant to me as quickly as possible}
                    - {content: can start being productive right away}
            `),
        })

        expect(fixtures).toEqual({
            users: [
                {$store: 'user1', displayName: 'Vincent'},
            ],
            stories: [
                {$store: 'story1', user: {$ref: 'user1'}},
            ],
            storyElements: [
                {story: {$ref: 'story1'}, content: 'I start using the platform'},
                {story: {$ref: 'story1'}, content: 'get to the functionality most relevant to me as quickly as possible'},
                {story: {$ref: 'story1'}, content: 'can start being productive right away'},
            ]
        })
    })
})
