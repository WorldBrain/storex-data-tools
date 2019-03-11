import * as expect from 'expect'
import StorageManger, { StorageRegistry } from '@worldbrain/storex'
import { MigrationSelection } from '@worldbrain/storex-schema-migrations/lib/types'
import { getStorageRegistryChanges } from '@worldbrain/storex-schema-migrations/lib/schema-diff'
import { generateMigration } from '@worldbrain/storex-schema-migrations/lib/migration-generator'
import { MigrationConfig } from '@worldbrain/storex-schema-migrations/lib/migration-generator/types';
import { migrateObject } from '.';

describe('Data migrations on data held in memory', () => {
    it('should perform Storex migrations on data', async () => {
        const registry = new StorageRegistry()
        registry.registerCollections({
            user: [
                {
                    version: new Date('2019-01-01'),
                    fields: {
                        firstName: {type: 'string'},
                        lastName: {type: 'string'}
                    }
                },
                {
                    version: new Date('2019-01-10'),
                    fields: {
                        displayName: {type: 'string'},
                    }
                },
            ]
        })
        
        const selection : MigrationSelection = {
            fromVersion: new Date('2019-01-01'),
            toVersion: new Date('2019-01-10'),
        }
        const config : MigrationConfig = {
            dataOperations: {
                forward: [{type: 'writeField', collection: 'user', field: 'displayName', value: '`${object.firstName} ${object.lastName}`'}],
                backward: [
                    { type: 'writeField', collection: 'user', field: 'firstName',
                      value: {'object-property': [{split: ['$object.displayName', ' ']}, 0]} },
                    { type: 'writeField', collection: 'user', field: 'lastName',
                      value:  {'object-property': [{split: ['$object.displayName', ' ']}, 1]} },
                ],
            }
        }
        const diff = getStorageRegistryChanges(registry as any, selection.fromVersion, selection.toVersion)
        const migration = generateMigration({diff, config, direction: 'forward'})

        expect(migrateObject({
            firstName: 'John',
            lastName: 'Doe',
        }, {migration, collection: 'user'})).toEqual({displayName: 'John Doe'})
    })
})
