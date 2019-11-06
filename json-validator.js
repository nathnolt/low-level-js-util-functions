/*
* The place to put validator functions
*
*/
import { getType } from '@/scripts/util/helpers.js'



/*
* Checks whether inputData complies with validator
* 
* Format validator example:
* 
* Types are based on function getType in helpers.js
* 
* There is the option to validate by type, using string, or array, or validate by value
* 
* examples:
* 
* 
* [1] basic example (Employee record)
* 
*     inputData: 
*     {
*         name: 'John Doe',
*         age: 32,
*         adress: {
*             country: 'USA',
*             city: 'Texas',
*             postal: '7148'
*         },
*         salary: 5000
*     }
* 
*     validator:
*     {
*         name: 'string',
*         age: 'number'
*         adress: {
*             country: 'string',
*             city: 'string',
*             postal: 'string'
*         },
*         salary: 'number'
*     }
*     
*     output: true (valid)
*     
*     reason: it is valid because all of the types match, and all of the keys were supplied.
*     if inputData didn't have key name for example, the output would be false '
*     
*     or if the postal code was of type number, the output would be false as well
*     
* 
* [2] example with multiple types and optional
* 
*     inputData: {
*         product_name: 'Jack Daniel\'s',
*         price: 17.79,
*         info: 'Nice alcohol...',
*         code: '0123456789',
*         contents: 350,
*         alcohol: 40,
*         country: 'United States',
*         taste: 'Flexible & Friendly'
*     }
* 
*     validator: {
*         product_name: 'string',
*         price: 'number',
*         info: 'undefined|string',
*         code: 'number|string',
*         contents: 'number|string',
*         alcohol: 'number',
*         country: 'string',
*         type: 'undefined|string',
*         taste: 'undefined|string'
*     }
*     
*     valid: true,
*     
*     reason: It is valid because keys can be removed if the validator has the type undefined as an option.
*     also some keys allow for a number or string, as it could be converted. or done some more elaborate processing.
*     
*     
* [3] example with multiple complex types (Arrays data, arrays types, subobjects)
*     
*     inputData: {
*         userName: 'xxx_CyberDoomEvan_xxx',
*         paymentMethods: [
*             {
*                 method: 'PayPal',
*                 'e-mail': 'name@example.org'
*             }
*         ],
*         products: [
*             {
*                 type: 'Game',
*                 title: 'GTA V',
*                 product_code: '2424',
*                 purchase_data: '02-07-2017',
*                 install_data: '02-08-2017',
*                 playtime: 2052384,
*                 regkey: '245-acd-593-5dfc',
*                 fileSize: '51.05GB',
*                 achievements: [
*                     {
*                         date: '03-02-2017',
*                         id: 24
*                     }
*                 ],
*                 userFeedback: {
*                     rating: 4,
*                 }
*             },
*             {
*                 type: 'user_app',
*                 title: 'Unreal Tournament 99',
*                 executable_location: 'c:/program files/ut99/System/Unreal Tournament.exe',
*                 thumb: 'c:/program files/ut99/System/Unreal Tournament.ico',
*                 added_date: '01-30-2015',
*                 playtime: 19942,
*             },
*         ]
*     }
* 
*     validator: {
*         userName: 'string',
*         paymentMethods: [[/each/, {
*             method: '"paypal"',
*             'e-mail': 'string'
*         },
*         {
*             method: '"card"',
*             code: 'string'
*         }]],
*         products: [[/each/, {
*             type: ['"Game"', '"software"'],
*             title: 'string',
*             product_code: 'number|string',
*             purchase_data: 'string',
*             install_data: 'string',
*             playtime: 'number',
*             regkey: 'string',
*             fileSize: 'string',
*             achievements: [/each/, {
*                 date: 'string',
*                 id: 'number'
*             }]],
*             userFeedback: {
*                 rating: 'number',
*                 comment: 'undefined|string'
*             },
*         }, {
*             type: '"user_app"',
*             title: 'undefined|string',
*             executable_location: 'string',
*             thumb: 'undefined|string',
*             added_date: 'string',
*             playtime: 'number',
*         }]
*     }
*     
*     output: true
*     
*     reason: 
* 
*
*
* [4] array type
* 
*     inputData: [
*         {
*             name: 'Google',
*             location: 'Mountain View, United states',
*             tel: '+0031-1234567',
*             sector: 'Education'
*         },
*         {
*             name: 'Google',
*             sector: 'Tech'
*         }
*     ]
*     
*     validator: [[/each/, {
*         name: 'string',
*         location: 'string',
*         tel: 'string',
*         sector: 'string'
*     }]]
*     
*     output: false
*     
*     reason: the first item in the array is valid, but the second item isn't because it's missing the location and tel fields

 
* ----------------------------------------------------

Value properties / possibilities

   - 'number'
   - 'string'
   - 'boolean'
   - 'arrlike'
   - 'undefined'
   
See getType for all possibilities...

Cannot user RegExp because it is used for /each/ syntax for array thingy

-------------

This function works by looping through the keys and such.

*/

export function JSONCheck(inputData, validator) {
    
    let validatorType = getType(validator)
    const inputType = getType(inputData)
    
    // turn validators like string|number into -> ['string', 'number']
    {
        if(validatorType == 'string' && validator.indexOf('|') != -1) {
            validator = validator.split('|')
            validatorType = getType(validator)
        }
    }
    
    if(validatorType == 'objectlike') {
        if(inputType != 'objectlike') {return false}
        for(var k in validator) {
            const valid = JSONCheck(inputData[k], validator[k])
            if(valid == false) {
                return false
            }
        }
        return true
    } else
    if(validatorType == 'arraylike') {
        if(inputType == 'arraylike') {
            
            
            var valid = validator.map(validatorItemArr => {
                // Each case
                if(
                    getType(validatorItemArr[0]) == 'RegExp' && 
                    validatorItemArr[0].toString() === '/each/')
                {
                    const validations = validatorItemArr.slice(1)
                    const mapRes = inputData.map(inputDataItem => {
                        return validations
                            .map(validationItem => JSONCheck(inputDataItem, validationItem))
                            .filter(valid => valid == true)
                            .length > 0
                    })
                    return mapRes.filter(item => item == false).length == 0
                }
                
                
                // The not each case
                const validArr = []
                
                const validatorItemArrType = getType(validatorItemArr)
                if(validatorItemArrType == 'string') {
                    return JSONCheck(inputData, validatorItemArr)
                }
                // depth 1
                for(let i = 0; i < validatorItemArr.length; i++) {
                    // depth 2
                    validArr[i] = JSONCheck(inputData[i], validatorItemArr[i])
                }
                
                // if more than 0 items are false, return false else true
                return validArr.filter(item => item == false).length == 0 
            })
            
            // at least 1 true
            return valid.filter(validItem => validItem == true).length > 0
        }
        
        return validator.map(validatorItem => JSONCheck(inputData, validatorItem))
            .filter(bool => bool == true)
            .length > 0
    } else {
        // type based compare
        if(validatorType == 'string') {
            if(validator.indexOf('"') == '-1') {
                if(inputType === validator) {
                    return true
                } else {
                    return false
                }
            }
        }
        
        // value based compare
        let validatorVal = validator
        if(validatorType == 'string') {
            validatorVal = validator.split('"').join('')
        }
        return inputData === validatorVal
    }
}
