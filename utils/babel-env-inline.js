// adapted from https://github.com/babel/babili/tree/master/packages/babel-plugin-transform-node-env-inline

"use strict";

module.exports = function({ types: t }) {
  return {
    name: "transform-babel-env-inline",
    visitor: {
      MemberExpression(path) {
        if (path.matchesPattern("process.env.BABEL_ENV")) {
          path.replaceWith(t.valueToNode(process.env.BABEL_ENV));

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
