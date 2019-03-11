import { UserLogic } from 'user-logic'
import { Migration } from "@worldbrain/storex-schema-migrations/lib/migration-generator/types"

export function migrateObject(object, options : {migration : Migration, collection : string}) {
    for (const operation of options.migration.dataOperations) {
        if (operation.type === 'writeField') {
            const valueLogic = new UserLogic({definition: operation['value']})
            object[operation['field']] = valueLogic.evaluate({object})
        }
    }

    for (const operation of options.migration.finalizeOperations) {
        if (operation.type === 'schema.finalizeAddField') {
            
        } else if (operation.type === 'schema.removeField') {
            delete object[operation['field']]
        }
    }

    return object
}
