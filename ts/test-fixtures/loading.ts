const pluralize = require('pluralize')
const traverse = require('traverse')
import { UserLogic } from "user-logic"
import StorageManager from "@worldbrain/storex"

export async function loadFixtures(
    { storageManager, fixtures, context = {} }:
        { storageManager: StorageManager, fixtures: { [collectionName: string]: any[] }, context?: { [key: string]: any } }
) {
    const refs = {}

    for (const [collectionName, objects] of Object.entries(fixtures)) {
        for (const object of objects) {
            const storeRef = object['$store']
            if (storeRef) {
                delete object['$store']
            }

            const toModify: Array<[any, any]> = []
            traverse(object).forEach(function (this: any, obj: any) {
                if (obj && (obj['$ref'] || obj['$lookup'])) {
                    toModify.push([this.parent.node, this.key])
                }
            })
            for (const [parent, key] of toModify) {
                const obj = parent[key]

                let pk
                if (obj['$ref']) {
                    const logic = new UserLogic({ definition: `$${obj['$ref']}` })
                    const ref = logic.evaluate(refs)
                    if (!ref) {
                        throw new Error(`Could not find ref: ${JSON.stringify(ref)}`)
                    }

                    pk = ref.pk
                } else {
                    const logic = new UserLogic({ definition: obj['$lookup'] })
                    pk = await logic.evaluate(context)
                }
                parent[key] = pk
            }

            const singularCollectionName = pluralize.singular(collectionName)
            const { object: createdObject } = await storageManager.collection(singularCollectionName).createObject(object)

            if (storeRef) {
                const collectionDefinition = storageManager.registry.collections[singularCollectionName]
                const pkField = collectionDefinition.pkIndex as string
                refs[collectionName] = refs[collectionName] || {}
                refs[collectionName][storeRef] = { pk: createdObject[pkField] }
            }
        }
    }

    return refs
}
