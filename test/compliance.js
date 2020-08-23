const fs = require('fs')
const path = require('path')
const assert = require('assert')
const jmespath = require('../')
const search = jmespath.search

// Compliance tests that aren't supported yet.
const notImplementedYet = []

function endsWith(str, suffix) {
  return str.includes(suffix, str.length - suffix.length)
}

const listing = fs.readdirSync('test/compliance')
for (let i = 0; i < listing.length; i++) {
  const filename = 'test/compliance/' + listing[i]
  if (
    fs.statSync(filename).isFile() &&
    endsWith(filename, '.json') &&
    !notImplementedYet.includes(path.basename(filename))
  ) {
    addTestSuitesFromFile(filename)
  }
}
function addTestSuitesFromFile(filename) {
  describe(filename, function() {
    const spec = JSON.parse(fs.readFileSync(filename, 'utf-8'))
    let errorMsg
    for (var i = 0; i < spec.length; i++) {
      const msg = 'suite ' + i + ' for filename ' + filename
      describe(msg, function() {
        const given = spec[i].given
        const cases = spec[i].cases
        for (var j = 0; j < cases.length; j++) {
          const testcase = cases[j]
          if (testcase.error !== undefined) {
            // For now just verify that an error is thrown
            // for error tests.
            ;(function(testcase, given) {
              it('should throw error for test ' + j, function() {
                assert.throws(
                  function() {
                    search(given, testcase.expression)
                  },
                  Error,
                  testcase.expression
                )
              })
            })(testcase, given)
          } else if(testcase.type !== undefined) {
            ;(function(testcase, given) {
              it(
                'should pass test ' + j + ' type: ' + testcase.type,
                function() {
                  assert.deepEqual(
                    Object.prototype.toString.call(search(given, testcase.expression)),
                    testcase.type
                  )
                }
              )
            })(testcase, given)
          } else {
            ;(function(testcase, given) {
              it(
                'should pass test ' + j + ' expression: ' + testcase.expression,
                function() {
                  assert.deepEqual(
                    search(given, testcase.expression),
                    testcase.result
                  )
                }
              )
            })(testcase, given)
          }
        }
      })
    }
  })
}
