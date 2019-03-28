const pluralize = require('pluralize')
import StorageManager from "@worldbrain/storex"
import { getObjectPk, getObjectWithoutPk } from "@worldbrain/storex/lib/utils"
import { isChildOfRelationship } from "@worldbrain/storex/lib/types";

export async function dumpFixtures(storageManager : StorageManager) {
    const fixtures = {}
    const refs = {}
    for (const [collectionName, collectionDefinition] of Object.entries(storageManager.registry.collections)) {
        const pluralCollectionName = pluralize(collectionName)
        fixtures[pluralCollectionName] = []
        refs[collectionName] = {}
        const objects = await storageManager.collection(collectionName).findObjects({})
        for (const object of objects) {
            const fixtureObject = getObjectWithoutPk(object, collectionName, storageManager.registry)

            if (Object.keys(collectionDefinition.reverseRelationshipsByAlias).length) {
                const objectPk = getObjectPk(object, collectionName, storageManager.registry)
                const refName = `${collectionName}${fixtures[pluralCollectionName].length + 1}`
                refs[collectionName][objectPk] = refName
                fixtureObject['$store'] = refName
            }
            for (const [relationshipAlias, relationship] of Object.entries(collectionDefinition.relationshipsByAlias)) {
                if (isChildOfRelationship(relationship)) {
                    fixtureObject[relationshipAlias] = {$ref: refs[relationship.targetCollection][object[relationshipAlias]]}
                }
            }

            fixtures[pluralCollectionName].push(fixtureObject)
        }
    }
    return fixtures
}
