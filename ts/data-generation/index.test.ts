import * as expect from 'expect'
import { generateObject } from '.';

describe('Data generation tools', () => {
    it('should generate simple objects', () => {
        expect(generateObject({
            type: { fake: 'random.arrayElement', input: ['appartment', 'room'] },
            city: { literal: 'Green Egg Valley' },
        }, { seed: 1 })).toEqual({ type: 'appartment', city: 'Green Egg Valley' })

        expect(generateObject({
            type: { fake: 'random.arrayElement', input: ['appartment', 'room'] },
            city: { literal: 'Green Egg Valley' },
        }, { seed: 3 })).toEqual({ type: 'room', city: 'Green Egg Valley' })
    })
    
    it('should generate objects with fields that depend on each other', () => {
        expect(generateObject({
            type: { fake: 'random.arrayElement', input: ['appartment', 'room'] },
            city: { literal: 'Green Egg Valley' },
            description: { template: ({context}) => `Wonderful ${context.type} in ${context.city}` },
        }, { seed: 1 })).toEqual({
            type: 'appartment', city: 'Green Egg Valley',
            description: 'Wonderful appartment in Green Egg Valley'
        })

        expect(generateObject({
            type: { fake: 'random.arrayElement', input: ['appartment', 'room'] },
            city: { literal: 'Green Egg Valley' },
            description: { template: ({context}) => `Wonderful ${context.type} in ${context.city}` },
        }, { seed: 3 })).toEqual({
            type: 'room', city: 'Green Egg Valley',
            description: 'Wonderful room in Green Egg Valley'
        })
    })

    it('should generate values inside templates', () => {
        expect(generateObject({
            type: { fake: 'random.arrayElement', input: ['appartment', 'room'] },
            city: { literal: 'Green Egg Valley' },
            description: {
                template: ({context, value}) => 
                    `Wonderful ${context.type} for ${value({fake: 'random.arrayElement', input: [2, 4]})} guests in ${context.city}`
            },
        }, { seed: 1 })).toEqual({
            type: 'appartment', city: 'Green Egg Valley',
            description: 'Wonderful appartment for 4 guests in Green Egg Valley'
        })
    })
    
    it('should guess data type for field/collection names')
})
