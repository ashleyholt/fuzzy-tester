var deepDiff = require( 'deep-diff' );

var initial_score = {score: 0, max_score: 0, diff: []};

/**
 * Use the deep-diff library to create an (almost too) detailed description
 * of the differences between the expected and actual properties. Some massaging
 * of the data so only the parts we care about are shown is done.
 */
function createDiff(expectation, result) {
  var diff = deepDiff.diff(expectation, result);

  // objects with no differences have an undefined diff
  if (diff === undefined) {
    return ''; // return an empty string for less confusing output later
  }

  // filter out diff elements corresponding to a new element on the right side
  // these are ignored by our tests and would just be noise
  diff = diff.filter(function(diff_part) {
    return diff_part.kind !== 'N';
  });


  // Make the diff output more compact and use terminology that makes
  // sense in a test concept (expectation/actual vs left/right side)
  diff = diff.map(function(diff_part) {
    if (diff_part.kind === 'E' || diff_part.kind === 'D') {
      return {
        property: diff_part.path[0],
        expected: diff_part.lhs,
        actual: diff_part.rhs || ''
      };
    }

    return diff_part;
  });

  return diff;
}

function filterDiffs(diff) {
  if( diff === '' || (Array.isArray(diff) && diff.length === 0)) {
    return false;
  }
  return true;
}


/**
 * function to be used with Array.reduce to combine several subscores for
 * the same object and build one score that combines all of them.
 * It totals up the actual and maximum score, and concatenates
 * multiple diff or error outputs into an array
 */
function combineScores(total_score, this_score) {
  var new_diff = total_score.diff;
  if (this_score.diff) {
    new_diff = total_score.diff.concat(this_score.diff);
    new_diff = new_diff.filter(filterDiffs);
  }

  var r = {
    score: total_score.score + this_score.score,
    max_score: total_score.max_score + this_score.max_score,
    diff: new_diff,
    index: total_score.index,
    priorityThresh: total_score.priorityThresh || this_score.priorityThresh
  };

  // index can be zero, so || comparison will not work
  if (this_score.index !== undefined) {
    r.index = this_score.index;
  }
  return r;
}

/**
 * Small helper function to determine if a given responseFeature is high
 * enough in a set of responseFeatures to pass a priority threshold.
 * Caveat: the feature object must be the exact same javascript object
 * as the one taken from the responseFeatures, not just another object with
 * identical properties
 */
function inPriorityThresh(responseFeatures, responseFeature, priorityThresh) {
  var index = responseFeatures.indexOf(responseFeature);
  return index !== -1 && index <= priorityThresh - 1;
}

module.exports = {
  initial_score: initial_score,
  createDiff: createDiff,
  combineScores: combineScores,
  inPriorityThresh: inPriorityThresh
};
