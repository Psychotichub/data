const _ = require('lodash');

// Main aggregation function
async function aggregate(documents, pipeline) {
  try {
    if (!Array.isArray(pipeline)) {
      throw new Error('Pipeline must be an array of stages');
    }
    
    // Process each stage in the pipeline
    let result = [...documents];
    
    for (const stage of pipeline) {
      const stageOperator = Object.keys(stage)[0];
      const stageOptions = stage[stageOperator];
      
      switch (stageOperator) {
        case '$match':
          result = match(result, stageOptions);
          break;
        case '$project':
          result = project(result, stageOptions);
          break;
        case '$group':
          result = group(result, stageOptions);
          break;
        case '$sort':
          result = sort(result, stageOptions);
          break;
        case '$limit':
          result = limit(result, stageOptions);
          break;
        case '$skip':
          result = skip(result, stageOptions);
          break;
        case '$unwind':
          result = unwind(result, stageOptions);
          break;
        case '$lookup':
          result = lookup(result, stageOptions);
          break;
        case '$count':
          result = count(result, stageOptions);
          break;
        default:
          throw new Error(`Unsupported aggregation stage: ${stageOperator}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Aggregation error:', error);
    throw error;
  }
}

// $match stage - filter documents
function match(documents, criteria) {
  return documents.filter(doc => {
    return Object.keys(criteria).every(key => {
      const value = criteria[key];
      
      if (typeof value === 'object' && value !== null) {
        // Handle operators
        return Object.keys(value).every(op => {
          const opValue = value[op];
          const docValue = _.get(doc, key);
          
          switch (op) {
            case '$eq': return docValue === opValue;
            case '$ne': return docValue !== opValue;
            case '$gt': return docValue > opValue;
            case '$gte': return docValue >= opValue;
            case '$lt': return docValue < opValue;
            case '$lte': return docValue <= opValue;
            case '$in': return Array.isArray(opValue) && opValue.includes(docValue);
            case '$nin': return Array.isArray(opValue) && !opValue.includes(docValue);
            case '$exists': return (docValue !== undefined) === opValue;
            case '$regex': {
              if (typeof docValue !== 'string') return false;
              const regex = new RegExp(opValue);
              return regex.test(docValue);
            }
            default: return false;
          }
        });
      } else {
        // Simple equality check
        return _.get(doc, key) === value;
      }
    });
  });
}

// $project stage - reshape documents
function project(documents, projection) {
  return documents.map(doc => {
    const result = {};
    
    // Handle inclusion/exclusion
    const isExclusion = Object.values(projection).some(v => v === 0);
    const isInclusion = Object.values(projection).some(v => v === 1 || typeof v === 'object');
    
    if (isExclusion && isInclusion) {
      throw new Error('Cannot mix inclusion and exclusion in $project');
    }
    
    if (isExclusion) {
      // Copy all fields first, then remove excluded ones
      Object.assign(result, doc);
      
      Object.keys(projection).forEach(key => {
        if (projection[key] === 0) {
          delete result[key];
        }
      });
    } else {
      // Only include specified fields
      Object.keys(projection).forEach(key => {
        const value = projection[key];
        
        if (value === 1) {
          // Simple inclusion
          result[key] = _.get(doc, key);
        } else if (typeof value === 'object') {
          // Expression
          result[key] = evaluateExpression(doc, value);
        }
      });
      
      // Always include _id unless explicitly excluded
      if (projection._id !== 0 && doc._id !== undefined) {
        result._id = doc._id;
      }
    }
    
    return result;
  });
}

// $group stage - group documents
function group(documents, grouping) {
  const groups = {};
  const idExpression = grouping._id;
  
  documents.forEach(doc => {
    // Calculate group key
    const groupKey = JSON.stringify(evaluateExpression(doc, idExpression));
    
    // Create group if it doesn't exist
    if (!groups[groupKey]) {
      groups[groupKey] = { _id: evaluateExpression(doc, idExpression) };
    }
    
    // Process each accumulator
    Object.keys(grouping).forEach(key => {
      if (key === '_id') return;
      
      const accumulator = grouping[key];
      const accumulatorOp = Object.keys(accumulator)[0];
      const fieldPath = accumulator[accumulatorOp];
      const fieldValue = typeof fieldPath === 'string' 
        ? _.get(doc, fieldPath.replace('$', ''))
        : evaluateExpression(doc, fieldPath);
      
      switch (accumulatorOp) {
        case '$sum':
          if (groups[groupKey][key] === undefined) {
            groups[groupKey][key] = 0;
          }
          groups[groupKey][key] += fieldValue || 0;
          break;
        case '$avg': {
          if (groups[groupKey][`${key}_sum`] === undefined) {
            groups[groupKey][`${key}_sum`] = 0;
            groups[groupKey][`${key}_count`] = 0;
          }
          groups[groupKey][`${key}_sum`] += fieldValue || 0;
          groups[groupKey][`${key}_count`] += 1;
          groups[groupKey][key] = groups[groupKey][`${key}_sum`] / groups[groupKey][`${key}_count`];
          break;
        }
        case '$min':
          if (groups[groupKey][key] === undefined || fieldValue < groups[groupKey][key]) {
            groups[groupKey][key] = fieldValue;
          }
          break;
        case '$max':
          if (groups[groupKey][key] === undefined || fieldValue > groups[groupKey][key]) {
            groups[groupKey][key] = fieldValue;
          }
          break;
        case '$first':
          if (groups[groupKey][key] === undefined) {
            groups[groupKey][key] = fieldValue;
          }
          break;
        case '$last':
          groups[groupKey][key] = fieldValue;
          break;
        case '$push':
          if (groups[groupKey][key] === undefined) {
            groups[groupKey][key] = [];
          }
          if (fieldValue !== undefined) {
            groups[groupKey][key].push(fieldValue);
          }
          break;
        case '$addToSet':
          if (groups[groupKey][key] === undefined) {
            groups[groupKey][key] = [];
          }
          if (fieldValue !== undefined && !groups[groupKey][key].some(v => _.isEqual(v, fieldValue))) {
            groups[groupKey][key].push(fieldValue);
          }
          break;
        default:
          throw new Error(`Unsupported accumulator: ${accumulatorOp}`);
      }
    });
  });
  
  // Convert groups object to array
  return Object.values(groups);
}

// $sort stage - sort documents
function sort(documents, sortOptions) {
  return [...documents].sort((a, b) => {
    for (const [field, direction] of Object.entries(sortOptions)) {
      const valueA = _.get(a, field);
      const valueB = _.get(b, field);
      
      if (valueA === valueB) continue;
      
      if (valueA === undefined) return direction === 1 ? -1 : 1;
      if (valueB === undefined) return direction === 1 ? 1 : -1;
      
      if (direction === 1) {
        return valueA < valueB ? -1 : 1;
      } else {
        return valueA > valueB ? -1 : 1;
      }
    }
    
    return 0;
  });
}

// $limit stage - limit results
function limit(documents, n) {
  if (typeof n !== 'number' || n < 0) {
    throw new Error('$limit requires a positive number');
  }
  
  return documents.slice(0, n);
}

// $skip stage - skip documents
function skip(documents, n) {
  if (typeof n !== 'number' || n < 0) {
    throw new Error('$skip requires a positive number');
  }
  
  return documents.slice(n);
}

// $unwind stage - deconstruct array field
function unwind(documents, options) {
  const path = typeof options === 'string' ? options : options.path;
  const preserveNullAndEmptyArrays = options.preserveNullAndEmptyArrays || false;
  const includeArrayIndex = options.includeArrayIndex;
  
  // Remove $ prefix if present
  const fieldPath = path.startsWith('$') ? path.substring(1) : path;
  
  const result = [];
  
  documents.forEach(doc => {
    const arrayValue = _.get(doc, fieldPath);
    
    if (!arrayValue && preserveNullAndEmptyArrays) {
      // Copy the document but set the field to null
      const newDoc = _.cloneDeep(doc);
      _.set(newDoc, fieldPath, null);
      result.push(newDoc);
      return;
    }
    
    if (!Array.isArray(arrayValue)) {
      return;
    }
    
    if (arrayValue.length === 0 && preserveNullAndEmptyArrays) {
      // Copy the document but set the field to null
      const newDoc = _.cloneDeep(doc);
      _.set(newDoc, fieldPath, null);
      result.push(newDoc);
      return;
    }
    
    arrayValue.forEach((item, index) => {
      const newDoc = _.cloneDeep(doc);
      _.set(newDoc, fieldPath, item);
      
      if (includeArrayIndex) {
        _.set(newDoc, includeArrayIndex, index);
      }
      
      result.push(newDoc);
    });
  });
  
  return result;
}

// $lookup stage - join with another collection
function lookup(documents, options) {
  const { from, localField, foreignField, as } = options;
  
  if (!from || !localField || !foreignField || !as) {
    throw new Error('$lookup requires from, localField, foreignField, and as fields');
  }
  
  // In a real implementation, we would fetch from another collection
  // Here we'll just return the documents with an empty array for the joined field
  return documents.map(doc => {
    return {
      ...doc,
      [as]: [] // In a real implementation, this would be populated with matching documents
    };
  });
}

// $count stage - count documents
function count(documents, fieldName) {
  if (typeof fieldName !== 'string') {
    throw new Error('$count requires a string field name');
  }
  
  return [{ [fieldName]: documents.length }];
}

// Helper function to evaluate expressions
function evaluateExpression(doc, expression) {
  if (expression === null || typeof expression !== 'object') {
    return expression;
  }
  
  if (typeof expression === 'string' && expression.startsWith('$')) {
    // Field reference
    return _.get(doc, expression.substring(1));
  }
  
  // Handle operators
  const operator = Object.keys(expression)[0];
  if (operator && operator.startsWith('$')) {
    const args = expression[operator];
    
    switch (operator) {
      case '$add': {
        if (!Array.isArray(args)) {
          throw new Error('$add requires an array');
        }
        return args.reduce((sum, arg) => {
          const value = evaluateExpression(doc, arg);
          return sum + (value || 0);
        }, 0);
      }
      case '$subtract': {
        if (!Array.isArray(args) || args.length !== 2) {
          throw new Error('$subtract requires two arguments');
        }
        const [a, b] = args.map(arg => evaluateExpression(doc, arg) || 0);
        return a - b;
      }
      case '$multiply': {
        if (!Array.isArray(args)) {
          throw new Error('$multiply requires an array');
        }
        return args.reduce((product, arg) => {
          const value = evaluateExpression(doc, arg);
          return product * (value || 0);
        }, 1);
      }
      case '$divide': {
        if (!Array.isArray(args) || args.length !== 2) {
          throw new Error('$divide requires two arguments');
        }
        const [a, b] = args.map(arg => evaluateExpression(doc, arg) || 0);
        if (b === 0) {
          throw new Error('Division by zero');
        }
        return a / b;
      }
      case '$concat': {
        if (!Array.isArray(args)) {
          throw new Error('$concat requires an array');
        }
        return args.map(arg => {
          const value = evaluateExpression(doc, arg);
          return value !== null && value !== undefined ? String(value) : '';
        }).join('');
      }
      case '$toLower': {
        const value = evaluateExpression(doc, args);
        return typeof value === 'string' ? value.toLowerCase() : value;
      }
      case '$toUpper': {
        const value = evaluateExpression(doc, args);
        return typeof value === 'string' ? value.toUpperCase() : value;
      }
      case '$literal':
        return args;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
  
  // If it's an object but not an operator, process each field
  const result = {};
  for (const [key, value] of Object.entries(expression)) {
    result[key] = evaluateExpression(doc, value);
  }
  return result;
}

module.exports = {
  aggregate
}; 