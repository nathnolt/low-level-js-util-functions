//
//  Convert something to string, and back to data, using encode and decode functions
//  
//  Adds a hungarian notation prefix to the string when it encodes, so it doesn't lose what the datatype was of the original.
//  It needs to do this because otherwise
//  
//  'false' and false would be the same thing if encoded and back
//
import { getType } from '@/scripts/util/helpers.js'

const typeChars = {
    string:     's',
    boolean:    'b',
    number:     'n',
    null:       'N',
    undefined:  'u',
    Object:     'o',
    objectlike: 'o',
    Array:      'a',
    arraylike:  'a',
}

export const stringEncoder = {
    encode (data) {
        const type = getType(data)
        const prefixChar = typeChars[type]
        
        if(typeChars[type] === undefined) {
            console.error('type: ' + type + " not yet supported in stringEncoder.encode!")
        }
        
        switch(prefixChar) {
            case 's': // string
            case 'b': // boolean
            case 'n': // number
            case 'N': // null
            case 'u': // undefined
                return prefixChar + String(data)
            case 'a': {
                // 1. encode the sub keys
                const step1 = data.map(stringEncoder.encode)
                
                // 2. encode JSON
                return 'a' + JSON.stringify(step1)
            }
            case 'o': {
                // 1. encode the sub keys
                const step1 = {}
                for(let k in data) {
                    const v = data[k]
                    const encodedV = stringEncoder.encode(v)
                    step1[k] = encodedV
                }
                
                // 2. encode JSON
                return 'o' + JSON.stringify(step1)
            }
        }
        
    },
    
    decode (dataStr) {
        if(dataStr == null) return null
        
        let prefixChar = dataStr.charAt(0)
        let data = dataStr.slice(1)
        
        let output
        switch(prefixChar) {
            case 's':
                output = data
                break
            case 'b':
                output = data === 'true' 
                    ? true
                    : false
                break
            case 'n':
                output = Number(data)
                break
            case 'N':
                output = null
                break
            case 'u':
                output = undefined
                break
            case 'a': {
                // 1. parse JSON
                const step1 = JSON.parse(data)
                
                // 2. decode subkeys
                const step2 = step1.map(stringEncoder.decode)
                
                return step2
                
            }
            case 'o': {
                // 1. parse JOSN
                let step1 = JSON.parse(data)
                
                // 2. decode subkeys
                const step2 = {}
                for(let k in step1) {
                    const v = step1[k]
                    const decodedV = stringEncoder.decode(v)
                    step2[k] = decodedV
                }
                
                return step2
            }
            default:
                console.error('prefixChar: ' + prefixChar + " not yet supported in stringEncoder.decode")
        }
        
        return output
    }
}



import { objDeepClone } from '@/scripts/util/helpers.js'

export const stringEncoderTests = (function() {
    const obj = {
        encode: [
            // Strings
            {
                input: 'Hello',
                exout: 'sHello',
            },
            {
                input:  '',
                exout: 's',
            },
            
            {
                input:  '12~`-=(%)37ya\rsdfh	zxcj😀k﷽v,n2ツ13"k/\\\t\n',
                exout: 's12~`-=(%)37ya\rsdfh	zxcj😀k﷽v,n2ツ13"k/\\\t\n',
            },
            
            // Booleans
            {
                input:   true,
                exout: 'btrue',
            },
            {
                input:   false,
                exout: 'bfalse',
            },
            
            // Numbers
            {
                input: 0,
                exout: 'n0'
            },
            {
                input: NaN,
                exout: 'nNaN'
            },
            {
                input: Number.MAX_SAFE_INTEGER,
                exout: 'n9007199254740991'
            },
            {
                input: Number.MIN_SAFE_INTEGER,
                exout: 'n-9007199254740991'
            },
            {
                input: 1e100,
                exout: 'n1e+100'
            },
            
            
            // null
            {
                input:   null,
                exout: 'Nnull',
            },
            
            // undefined
            {
                input:   undefined,
                exout: 'uundefined',
            },
            
            {
                input:  'uundefined',
                exout: 'suundefined',
            },
            
            
            // Objects
            {
                input: {k: 24, k2: 'Hello', 'Yay"bab e': 'a",s:"key65":"n23"', '  ss   s s ': null},
                exout:  'o{"k":"n24","k2":"sHello","Yay\\"bab e":"sa\\",s:\\"key65\\":\\"n23\\"","  ss   s s ":"Nnull"}'
            },
            
            // Arrays
            {
                input: ['k,e\'y,"1', true, NaN, 42220, undefined, null, [1,',\\\\,3,"24",,',"25"]],
                exout: 'a["sk,e\'y,\\"1","btrue","nNaN","n42220","uundefined","Nnull","a[\\"n1\\",\\"s,\\\\\\\\\\\\\\\\,3,\\\\\\"24\\\\\\",,\\",\\"s25\\"]"]'
            },
            
            // Object ./. Arrays
            {
                input: [{key1: [1,2,null, undefined, 1 / 0], key2: -1 / 0}, 'sNaN', 0.015625, {'String Based Key': true}],
                exout: 'a["o{\\"key1\\":\\"a[\\\\\\"n1\\\\\\",\\\\\\"n2\\\\\\",\\\\\\"Nnull\\\\\\",\\\\\\"uundefined\\\\\\",\\\\\\"nInfinity\\\\\\"]\\",\\"key2\\":\\"n-Infinity\\"}","ssNaN","n0.015625","o{\\"String Based Key\\":\\"btrue\\"}"]',
            }
            
        ],
        decode: []
    }
    
    // create the decodes by flipping the encodes
    obj.encode.forEach(encodeItem => {
        const decodeItem = {
            input: encodeItem.exout,
            exout: objDeepClone(encodeItem.input)
        }
        obj.decode.push(decodeItem)
    })
    
    return obj
})()
