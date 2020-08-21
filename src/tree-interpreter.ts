/* eslint-disable no-case-declarations */
import { Runtime } from './runtime'
import * as helpers from './helpers'
import * as constants from './constants'

export class TreeInterpreter {
  runtime: Runtime

  constructor(runtime: Runtime) {
    this.runtime = runtime
  }

  search(node, value) {
    return this.visit(node, value)
  }

  visit(node, value) {
    let matched,
      base,
      current,
      result,
      first,
      second,
      field,
      left,
      right,
      collected,
      i
    switch (node.type) {
      case 'Field':
        if (value !== null && helpers.isObject(value)) {
          field = value[node.name]
          if (field === undefined) {
            return null
          } else {
            return field
          }
        }
        return null
      case 'Subexpression':
        result = this.visit(node.children[0], value)
        for (i = 1; i < node.children.length; i++) {
          result = this.visit(node.children[1], result)
          if (result === null) {
            return null
          }
        }
        return result
      case 'IndexExpression':
        left = this.visit(node.children[0], value)
        right = this.visit(node.children[1], left)
        return right
      case 'Index':
        if (!helpers.isArray(value)) {
          return null
        }
        let index = node.value
        if (index < 0) {
          index = value.length + index
        }
        result = value[index]
        if (result === undefined) {
          result = null
        }
        return result
      case 'Slice':
        if (!helpers.isArray(value)) {
          return null
        }
        const sliceParams = node.children.slice(0)
        const computed = this.computeSliceParams(value.length, sliceParams)
        const start = computed[0]
        const stop = computed[1]
        const step = computed[2]
        result = []
        if (step > 0) {
          for (i = start; i < stop; i += step) {
            result.push(value[i])
          }
        } else {
          for (i = start; i > stop; i += step) {
            result.push(value[i])
          }
        }
        return result
      case 'Projection':
        // Evaluate left child.
        base = this.visit(node.children[0], value)
        if (!helpers.isArray(base)) {
          return null
        }
        collected = []
        for (i = 0; i < base.length; i++) {
          current = this.visit(node.children[1], base[i])
          if (current !== null) {
            collected.push(current)
          }
        }
        return collected
      case 'ValueProjection':
        // Evaluate left child.
        base = this.visit(node.children[0], value)
        if (!helpers.isObject(base)) {
          return null
        }
        collected = []
        const values = helpers.objValues(base)
        for (i = 0; i < values.length; i++) {
          current = this.visit(node.children[1], values[i])
          if (current !== null) {
            collected.push(current)
          }
        }
        return collected
      case 'FilterProjection':
        base = this.visit(node.children[0], value)
        if (!helpers.isArray(base)) {
          return null
        }
        const filtered = []
        const finalResults = []
        for (i = 0; i < base.length; i++) {
          matched = this.visit(node.children[2], base[i])
          if (!helpers.isFalse(matched)) {
            filtered.push(base[i])
          }
        }
        for (let j = 0; j < filtered.length; j++) {
          current = this.visit(node.children[1], filtered[j])
          if (current !== null) {
            finalResults.push(current)
          }
        }
        return finalResults
      case 'Comparator':
        first = this.visit(node.children[0], value)
        second = this.visit(node.children[1], value)
        switch (node.name) {
          case constants.TOK_EQ:
            result = helpers.strictDeepEqual(first, second)
            break
          case constants.TOK_NE:
            result = !helpers.strictDeepEqual(first, second)
            break
          case constants.TOK_GT:
            result = first > second
            break
          case constants.TOK_GTE:
            result = first >= second
            break
          case constants.TOK_LT:
            result = first < second
            break
          case constants.TOK_LTE:
            result = first <= second
            break
          default:
            throw new Error('Unknown comparator: ' + node.name)
        }
        return result
      case constants.TOK_FLATTEN:
        const original = this.visit(node.children[0], value)
        if (!helpers.isArray(original)) {
          return null
        }
        const merged = []
        for (i = 0; i < original.length; i++) {
          current = original[i]
          if (helpers.isArray(current)) {
            merged.push.apply(merged, current)
          } else {
            merged.push(current)
          }
        }
        return merged
      case 'Identity':
        return value
      case 'MultiSelectList':
        if (value === null) {
          return null
        }
        collected = []
        for (i = 0; i < node.children.length; i++) {
          collected.push(this.visit(node.children[i], value))
        }
        return collected
      case 'MultiSelectHash':
        if (value === null) {
          return null
        }
        collected = {}
        let child
        for (i = 0; i < node.children.length; i++) {
          child = node.children[i]
          collected[child.name] = this.visit(child.value, value)
        }
        return collected
      case 'OrExpression':
        matched = this.visit(node.children[0], value)
        if (helpers.isFalse(matched)) {
          matched = this.visit(node.children[1], value)
        }
        return matched
      case 'AndExpression':
        first = this.visit(node.children[0], value)

        if (helpers.isFalse(first) === true) {
          return first
        }
        return this.visit(node.children[1], value)
      case 'NotExpression':
        first = this.visit(node.children[0], value)
        return helpers.isFalse(first)
      case 'Literal':
        return node.value
      case constants.TOK_PIPE:
        left = this.visit(node.children[0], value)
        return this.visit(node.children[1], left)
      case constants.TOK_CURRENT:
        return value
      case 'Function':
        const resolvedArgs = []
        for (i = 0; i < node.children.length; i++) {
          resolvedArgs.push(this.visit(node.children[i], value))
        }
        return this.runtime.callFunction(node.name, resolvedArgs)
      case 'ExpressionReference':
        const refNode = node.children[0]
        // Tag the node with a specific attribute so the type
        // checker verify the type.
        refNode.jmespathType = constants.TOK_EXPREF
        return refNode
      default:
        throw new Error('Unknown node type: ' + node.type)
    }
  }

  computeSliceParams(arrayLength, sliceParams) {
    let start = sliceParams[0]
    let stop = sliceParams[1]
    let step = sliceParams[2]
    const computed = [null, null, null]
    if (step === null) {
      step = 1
    } else if (step === 0) {
      const error = new Error('Invalid slice, step cannot be 0')
      error.name = 'RuntimeError'
      throw error
    }
    const stepValueNegative = step < 0

    if (start === null) {
      start = stepValueNegative ? arrayLength - 1 : 0
    } else {
      start = this.capSliceRange(arrayLength, start, step)
    }

    if (stop === null) {
      stop = stepValueNegative ? -1 : arrayLength
    } else {
      stop = this.capSliceRange(arrayLength, stop, step)
    }
    computed[0] = start
    computed[1] = stop
    computed[2] = step
    return computed
  }

  capSliceRange(arrayLength, actualValue, step) {
    if (actualValue < 0) {
      actualValue += arrayLength
      if (actualValue < 0) {
        actualValue = step < 0 ? -1 : 0
      }
    } else if (actualValue >= arrayLength) {
      actualValue = step < 0 ? arrayLength - 1 : arrayLength
    }
    return actualValue
  }
}
