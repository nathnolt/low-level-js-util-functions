/**
 * @desc
 *   Create new object based on old object, using Object.assign
 *   single layer of data copying.
 */
export function newObj(obj) {
    return Object.assign({}, obj)
}

/**
* @desc
*   Converts an array like structure (like a NodeList) into an array.
*   Also handy for shallow array copying
*/
export function newArr(arrLike) {
    return Array.prototype.slice.call(arrLike, 0)
}


/**
 * @desc
 *   pure function to create an object 
 *   with reversed key value pairs
 *   
 * @input <object>
 *   ex
 *   {
 *     age: 42
 *   }
 *   
 * @output <object>
 *   ex
 *   {
 *     42: age
 *   }
 */
export function revObj(obj) {
    const rev = {}
    for(let k in obj) {
        const v = obj[k]
        rev[v] = k
    }
    return rev
}

/**
 * @desc
 *   convert an array to enum object
 *
 * @input <array>
 * 
 */
export function arr2enum(arr) {
    const enumObj = {}
    arr.forEach((key, index)=>{enumObj[key] = index})
    return enumObj
}




//
//  Converts values into simpler version (intended for complex array and object structures) 
//  with filter options to remove certain keys.
//  
//  
//  Use cases: 
//    - sanitizing objects so they return something when called JSON.stringify on them 
//    - cleaning so you only get the data from an object
//  
//  
//  @Args
//    - typelist to disallow certain types (based on getType fn)
//      ['function', 'Object', 'circular-reference']
//    - valList to disallow certain values
//      [null, '']
//    - valArr used in recursive calls to self to remove circular references
//      [ObjectPointer]
//  
//  
//  The script turns circular references into the string: <circular-reference>
//    To remove the object keys as well:
//    put 'circular-reference' inside of typeList argument
//  
//  
//  @example
//    input
//      objDeepClone(
//          {
//              key1: function(){},
//              key2: null,
//              hello: 'world',
//              list: []
//          },
//          ['function', 'Array'], 
//          [null]
//      )
//    
//    output
//      {hello: "world"}
//    
//    reason:
//      typeList: ['function', 'Array'] Filters all the functions and empty arrays
//      valList: [null] Filters all nulls
//  
//  
//  Notes
//    - you may have to call the function multiple times, 
//      if you want to remove certain things (see comment above objTodata ())
//  
export function objDeepClone(input, typeList, keyList, valList, valArr) {
    typeList = typeList || []
    keyList = keyList || []
    valList = valList || []
    valArr = valArr || []
    
    const type = getType(input)
    if(
        typeList.indexOf(type) !== -1 ||
        valList.indexOf(input) !== -1
    ) {
        return undefined
    }
    
    const noCircular = typeList.indexOf('circular-reference') !== -1
    
    // remove circular referencing
    if(type === 'arraylike' || type === 'objectlike') {
        if(valArr.indexOf(input) !== -1) {
            if(noCircular) {
                return undefined
            } else {
                return '<circular-reference>'
            }
        }
        valArr.push(input)
    }
    
    if(type == 'null') { return null } else
    if(type == 'arraylike') {
        
        const arr = []
        for(let i = 0, len = input.length; i < len; i++) {
            const val = input[i]
            if(
                typeList.indexOf(getType(val)) === -1 &&
                valList.indexOf(val) === -1
            ) {
                let valid = true
                if(noCircular && valArr.indexOf(val) !== -1) {
                    valid = false
                }
                
                if(valid) {
                    arr.push(objDeepClone(val, typeList, keyList, valList, valArr))
                }
            }
        }
        return arr
    } else
    if(type == 'objectlike') {
        const obj = {}
        
        for(let k in input) {
            // go to next index if k was found inside of keyList
            if(keyList.indexOf(k) != -1) {
                continue
            }
            
            // this can mess up.
            // Some values aren't always accessible.
            let v
            try {
                v = input[k]
            }
            catch (e) {
                v = 'error-inaccessible'
            }
            
            if(
                typeList.indexOf(getType(v)) === -1 &&
                valList.indexOf(v) === -1
            ) {
                let valid = true
                if(noCircular && valArr.indexOf(v) !== -1) {
                    valid = false
                }
                
                if(valid) {
                    obj[k] = objDeepClone(v, typeList, keyList, valList, valArr)
                }
            }
        }
        return obj
    } else {
        return input
    }
}

// @todo write more tests
export const objDeepCloneTests = (function(){
    
    const tests = [
        {
            input: {key2: 24, 'string based key': 50},
            exout: {key2: 24, 'string based key': 50},
            opts: {noReference: true}
        }
    ]
    
    // self referencing test
    {
        const val1 = {k: 2}
        val1.s = val1
        const test = {
            input: val1,
            exout: {k: 2, s: "<circular-reference>"},
        }
        tests.push(test)
    }
    
    return tests
})()

// A simple approximation of getting the type of a value in JS
// 
// can return:
// 
// From typeof:
//   - "undefined"
//   - "boolean"
//   - "number"
//   - "string"
//   - "symbol"
//   - "function"
// 
// From custom:
//   - "null"
//   - "arraylike"
//   - "objectlike"
// 
// from Object.prototype.toString.call
//   Here is a small list of examples:
//     - new date() = "Date"
//     - [] = "Array" (empty array)
//     - {} = "Object" (empty object)
//     - /[0-9A-Z]/ = "RegExp"
// 
export function getType(input) {
    var simpleType = typeof input
    if(simpleType !== 'object') { return simpleType }
    
    if(input == null) { return 'null' }
    
    // Test for length (by ducktyping) and checking hasOwnProperty for last index
    if(
        input.length !== undefined && 
        input.length > 0 && 
        input.hasOwnProperty(input.length - 1)
    ) { return 'arraylike' }
    
    // test with for in loop
    for(var k in input) { return 'objectlike' }
    
    return Object.prototype.toString.call(input).slice(8,-1)
}


export const getTypeTests = [
    {
        input: 23,
        exout: 'number'
    },
    {
        input: 'Complex',
        exout: 'string',
    },
    {
        input: [1,2,3],
        exout: 'arraylike',
    },
    {
        input: true,
        exout: 'boolean',
    },
    {
        input: !1,
        exout: 'boolean',
    },
    {
        input: [],
        exout: 'Array',
    },
    {
        input: {key: 24, length: 4},
        exout: 'objectlike',
    },
    {
        input: {key: 'hello', key2: 'World'},
        exout: 'objectlike',
    },
    {
        input: {},
        exout: 'Object',
    },
    {
        input: null,
        exout: 'null',
    },
    {
        input: new Date(),
        exout: 'Date',
    },
    {
        input: /[0-9A-Z]/,
        exout: 'RegExp',
    },
    {
        input: function noop(){},
        exout: 'function',
    },
    {
        input: Symbol(30),
        exout: 'symbol',
    },
]



//
// I wrote this for a part in the possible solution for a bug, but it didn't fix it
// 
// removes key from an object structure, removes it from arrays and objects and all the sub structures
// 
export function recursiveRemoveKey(input, key) {
    
    const type = getType(input)
    console.warn('rRk', input, key, type)
    
    if(type == 'arraylike' || type == 'objectlike' || type == 'Array' || type == 'Object') {
        if(input[key] != undefined) {
            delete input[key]
        }
    }
    
    if(type == 'arraylike') {
        for(let i = 0; i < input.length; i++) {
            const item = input[i]
            console.log(item)
            recursiveRemoveKey(item, key)
        }
    } else
    if(type == 'objectlike') {
        for(let k in input) {
            const item = input[k]
            // console.log('t', item, k)
            recursiveRemoveKey(item, key)
        }
    }
}


//
// Create a unique id, based on time and random number
//
export function createUid() {
    return '' + Date.now() + Math.random()
}




/**
* @desc
*   checks whether a number is between min and max, 
*   including min and max, so if called like 
*   (num, 100, 200): it would return true if num was 
*   100 or 200, including all values in between
*/
export function isNumberBetween(num, min, max) {
    return num >= min && num <= max
}



/**
* @desc
*   Tests whether or not a is equal to b.
* 
* This was created for testing library, to check whether or not output is the same as expected output.
* so comparing things like NaN === NaN should return true.
* and objects containing the same keys with the same values.
* 
* differences to a === b
*   - equals(NaN,NaN) > true
*   - equals([{b:[1,2,3],k:24}],[{k:24,b:[1,2,3]}]) > true
*/
export function equals(a, b, {noReference = false} = {}) {
    // NaN check
    if(a !== a) {
        if(b !== b) {
            return true
        }
    }
    // do opts based checks
    if(noReference && a === b) {
        return false
    }
    
    // Array compare
    if(getType(a) === 'arraylike' && getType(b) === 'arraylike') {
        
        if(a.length !== b.length) {
            return false
        }
        
        for(let i = 0; i < a.length; i++) {
            if(!equals(a[i], b[i])) {
                return false
            }
        }
        return true
    }
    
    // Object compare
    if(getType(a) === 'objectlike' && getType(b) === 'objectlike') {
        for(let key in a) {
            if(!equals(a[key], b[key])) {
                return false
            }
        }
        return true
    }
    
    return a === b
}

export const equalsTests = (function(){
    
    const tests = [
        {
            input: [0, 0],
            exout: true
        },
        
        {
            input: [NaN, NaN],
            exout: true
        },
        
        {
            input: [NaN, 0],
            exout: false
        },
        
        {
            input: [null, undefined],
            exout: false
        },
        
        {
            input: [0, ""],
            exout: false
        },
        
        {
            input: [0, "0"],
            exout: false
        },
        
        {
            input: [1, true],
            exout: false
        },
        
        {
            input: [[1,2,3,4,5], [1,2,3,4,5]],
            exout: true
        },
        
        {
            input: [{key: 24}, {key: 24}],
            exout: true
        },
        
        {
            input: [{b: [1,2,3], key: 24}, {key: 24, b: [1,2,3]}],
            exout: true
        },
        
        {
            input: [[1,{hello: 'World'},2], [1,{'hello': 'World'},2]],
            exout: true
        },
    ]
    
    {
        const item1 = {key: 20, key2: 40}
        const test = {
            input: [item1, item1, {noReference: true}],
            exout: false
        }
        tests.push(test)
    }
    
    return tests
})()






/**
*   encode obj to get parameters queries
*/
export function encodeToQuery(obj) {
    let queryStr = '?'
    
    for(let k in obj) {
        const v = obj[k]
        queryStr += encodeURIComponent(k) + '=' + encodeURIComponent(v) + '&'
    }
    
    return queryStr.slice(0, -1)
}
