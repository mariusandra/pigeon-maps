"use strict";

module.exports = function({ types: t }) {
  return {
    name: "transform-build-target-inline",
    visitor: {
      MemberExpression(path) {
        if (path.matchesPattern("process.env.BUILD_TARGET")) {
          path.replaceWith(t.valueToNode(process.env.BUILD_TARGET));

          if (path.parentPath.isBinaryExpression()) {
            let evaluated = path.parentPath.evaluate();
            if (evaluated.confident) {
              path.parentPath.replaceWith(t.valueToNode(evaluated.value));
            }
          }
        }
      },
    },
  };
};
