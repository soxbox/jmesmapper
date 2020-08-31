/* eslint-disable no-case-declarations */
import { Runtime } from './runtime';
import { ScopeChain } from './scope-chain';
import * as helpers from './helpers';
import { IAst, AstTypes, TokenType } from './types';

export class TreeInterpreter {
  runtime: Runtime;
  scopeChain: ScopeChain;

  constructor(runtime: Runtime) {
    this.runtime = runtime;
    this.scopeChain = new ScopeChain();
  }

  search(node: IAst, value: any) {
    return this.visit(node, value);
  }

  visit(node: IAst | null | undefined, value: any): any {
    if (!node) {
      throw new Error('Unknown node type: undefined');
    }

    switch (node.type) {
      case AstTypes.FIELD: {
        if (value !== null && helpers.isObject(value)) {
          const field = value[node.name];
          if (field === undefined) {
            return null;
          } else {
            return field;
          }
        }
        return null;
      }
      case AstTypes.SUB_EXPRESSION: {
        let result = this.visit(node.children[0], value);
        for (let i = 1; i < node.children.length; i++) {
          result = this.visit(node.children[1], result);
          if (result === null) {
            return null;
          }
        }
        return result;
      }
      case AstTypes.INDEX_EXPRESSION: {
        const left = this.visit(node.children[0], value);
        const right = this.visit(node.children[1], left);
        return right;
      }
      case AstTypes.INDEX: {
        if (!helpers.isArray(value)) {
          return null;
        }
        let index = node.value;
        if (index < 0) {
          index = value.length + index;
        }
        let result = value[index];
        if (result === undefined) {
          result = null;
        }
        return result;
      }
      case AstTypes.SLICE: {
        if (!helpers.isArray(value)) {
          return null;
        }
        const sliceParams = node.children.slice(0);
        const computed = this.computeSliceParams(value.length, sliceParams);
        const start = computed[0];
        const stop = computed[1];
        const step = computed[2];
        const result = [];
        if (step > 0) {
          for (let i = start; i < stop; i += step) {
            result.push(value[i]);
          }
        } else {
          for (let i = start; i > stop; i += step) {
            result.push(value[i]);
          }
        }
        return result;
      }
      case AstTypes.PROJECTION: {
        // Evaluate left child.
        const base = this.visit(node.children[0], value);
        if (!helpers.isArray(base)) {
          return null;
        }
        const collected = [];
        for (let i = 0; i < base.length; i++) {
          const current = this.visit(node.children[1], base[i]);
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected;
      }
      case AstTypes.VALUE_PROJECTION: {
        // Evaluate left child.
        const base = this.visit(node.children[0], value);
        if (!helpers.isObject(base)) {
          return null;
        }
        const collected = [];
        const values = helpers.objValues(base);
        for (let i = 0; i < values.length; i++) {
          const current = this.visit(node.children[1], values[i]);
          if (current !== null) {
            collected.push(current);
          }
        }
        return collected;
      }
      case AstTypes.FILTER_PROJECTION: {
        const base = this.visit(node.children[0], value);
        if (!helpers.isArray(base)) {
          return null;
        }
        const filtered = [];
        const finalResults = [];
        for (let i = 0; i < base.length; i++) {
          const matched = this.visit(node.children[2], base[i]);
          if (!helpers.isFalse(matched)) {
            filtered.push(base[i]);
          }
        }
        for (let j = 0; j < filtered.length; j++) {
          const current = this.visit(node.children[1], filtered[j]);
          if (current !== null) {
            finalResults.push(current);
          }
        }
        return finalResults;
      }
      case AstTypes.COMPARATOR: {
        const first = this.visit(node.children[0], value);
        const second = this.visit(node.children[1], value);
        let result;
        switch (node.name) {
          case TokenType.EQ:
            result = helpers.strictDeepEqual(first, second);
            break;
          case TokenType.NE:
            result = !helpers.strictDeepEqual(first, second);
            break;
          case TokenType.GT:
            result = first > second;
            break;
          case TokenType.GTE:
            result = first >= second;
            break;
          case TokenType.LT:
            result = first < second;
            break;
          case TokenType.LTE:
            result = first <= second;
            break;
          default:
            throw new Error('Unknown comparator: ' + node.name);
        }
        return result;
      }
      case AstTypes.REGULAREXPRESSION: {
        return node.value;
      }
      case AstTypes.FLATTEN: {
        const original = this.visit(node.children[0], value);
        if (!helpers.isArray(original)) {
          return null;
        }
        const merged = [];
        for (let i = 0; i < original.length; i++) {
          const current = original[i];
          if (helpers.isArray(current)) {
            merged.push.apply(merged, current);
          } else {
            merged.push(current);
          }
        }
        return merged;
      }
      case AstTypes.IDENTITY:
        return value;
      case AstTypes.MULTI_SELECT_LIST: {
        if (value === null) {
          return null;
        }
        const collected = [];
        for (let i = 0; i < node.children.length; i++) {
          collected.push(this.visit(node.children[i], value));
        }
        return collected;
      }
      case AstTypes.MULTI_SELECT_HASH: {
        if (value === null) {
          return null;
        }
        const collected: { [key: string]: any } = {};
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          collected[child.name] = this.visit(child.value, value);
        }
        return collected;
      }
      case AstTypes.OR_EXPRESSION: {
        const matched = this.visit(node.children[0], value);
        if (helpers.isFalse(matched)) {
          return this.visit(node.children[1], value);
        }
        return matched;
      }
      case AstTypes.AND_EXPRESSION: {
        const first = this.visit(node.children[0], value);

        if (helpers.isFalse(first) === true) {
          return first;
        }
        return this.visit(node.children[1], value);
      }
      case AstTypes.NOT_EXPRESSION: {
        const first = this.visit(node.children[0], value);
        return helpers.isFalse(first);
      }
      case AstTypes.SCOPE:
        return this.scopeChain.resolveReference(node.name);
      case AstTypes.LITERAL:
        return node.value;
      case AstTypes.PIPE: {
        const left = this.visit(node.children[0], value);
        return this.visit(node.children[1], left);
      }
      case AstTypes.CURRENT:
        return value;
      case AstTypes.FUNCTION: {
        const resolvedArgs = [];
        for (let i = 0; i < node.children.length; i++) {
          resolvedArgs.push(this.visit(node.children[i], value));
        }
        return this.runtime.callFunction(node.name, resolvedArgs);
      }
      case AstTypes.EXPRESSION_REFERENCE: {
        const refNode = node.children[0];
        // Tag the node with a specific attribute so the type
        // checker verify the type.
        if (refNode) {
          refNode.jmesmapperType = TokenType.EXPREF;
          refNode.context = value;
        }
        return refNode;
      }
      default:
        throw new Error('Unknown node type: ' + node.type);
    }
  }

  computeSliceParams(arrayLength: number, sliceParams: Array<number | null>): number[] {
    const step: number = sliceParams[2] === null ? 1 : sliceParams[2];

    if (step === 0) {
      const error = new Error('Invalid slice, step cannot be 0');
      error.name = 'RuntimeError';
      throw error;
    }

    const stepValueNegative = step < 0;

    const start =
      sliceParams[0] === null
        ? stepValueNegative
          ? arrayLength - 1
          : 0
        : this.capSliceRange(arrayLength, sliceParams[0], step);

    const stop =
      sliceParams[1] === null
        ? stepValueNegative
          ? -1
          : arrayLength
        : this.capSliceRange(arrayLength, sliceParams[1], step);

    return [start, stop, step];
  }

  capSliceRange(arrayLength: number, actualValue: number, step: number): number {
    let value = actualValue;
    if (value < 0) {
      value += arrayLength;
      if (value < 0) {
        value = step < 0 ? -1 : 0;
      }
    } else if (value >= arrayLength) {
      value = step < 0 ? arrayLength - 1 : arrayLength;
    }
    return value;
  }
}
