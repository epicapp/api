module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module",
  },
  "plugins": [
    "flowtype",
  ],
  "extends": [
    "plugin:flowtype/recommended"
  ],
  "rules": {
    "indent": [ "error", 2 ],
    "linebreak-style": [ "error", "unix" ],
    "quotes": [ "error", "single" ],
    "semi": [ "error", "always" ],
    "space-in-parens": [ "error", "always", { "exceptions": [ "[]", "()", "{}", "empty" ] } ],
  },
};
