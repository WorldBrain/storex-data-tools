const yaml = require('js-yaml')
import * as expect from "expect"
import StorageManager, { StorageRegistry, CollectionDefinitionMap } from "@worldbrain/storex"
import { DexieStorageBackend } from "@worldbrain/storex-backend-dexie"
import inMemory from "@worldbrain/storex-backend-dexie/lib/in-memory"
import { loadFixtures } from "./loading";

export async function loadTestFixtures(options: { collections: CollectionDefinitionMap, fixtures: any }) {
    const storageBackend = new DexieStorageBackend({ dbName: 'unittest', idbImplementation: inMemory() })
    const storageManager = new StorageManager({ backend: storageBackend as any })
    storageManager.registry.registerCollections(options.collections)
    await storageManager.finishInitialization()

    await loadFixtures({ storageManager, fixtures: options.fixtures })

    return { storageManager }
}

describe('Fixtures', () => {
    it('should be able to load basic fixtures into memory', async () => {
        const { storageManager } = await loadTestFixtures({
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
                - user: {$ref: users.defaultUser}
                  elements:
                    - {content: I've chosen to work on the Stories}
                    - {content: have a good way of navigating the Stories}
                    - {content: am not overwhelmed by the amount of information}
            `),
        })

        const users = await storageManager.collection('user').findObjects({})
        expect(users).toEqual([
            { id: 1, displayName: 'Vincent' }
        ])

        const stories = await storageManager.collection('story').findObjects({})
        expect(stories).toEqual([
            { id: 1, user: 1 },
            { id: 2, user: 1 },
        ])

        const storyElements = await storageManager.collection('storyElement').findObjects({})
        expect(storyElements).toEqual([
            { id: 1, story: 1, content: 'I start using the platform' },
            {
                id: 2,
                story: 1,
                content: 'get to the functionality most relevant to me as quickly as possible',
            },
            {
                id: 3,
                story: 1,
                content: 'can start being productive right away',
            },
            {
                id: 4,
                story: 2,
                content: 'I\'ve chosen to work on the Stories',
            },
            {
                id: 5,
                story: 2,
                content: 'have a good way of navigating the Stories',
            },
            {
                id: 6,
                story: 2,
                content: 'am not overwhelmed by the amount of information',
            }
        ])
    })
})
