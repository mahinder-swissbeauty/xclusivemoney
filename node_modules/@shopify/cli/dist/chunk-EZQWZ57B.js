import {
  __commonJS,
  __require,
  init_cjs_shims
} from "./chunk-PKR7KJ6P.js";

// ../../node_modules/.pnpm/validate-npm-package-name@5.0.1/node_modules/validate-npm-package-name/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.pnpm/validate-npm-package-name@5.0.1/node_modules/validate-npm-package-name/lib/index.js"(exports, module) {
    "use strict";
    init_cjs_shims();
    var { builtinModules: builtins } = __require("module"), scopedPackagePattern = new RegExp("^(?:@([^/]+?)[/])?([^/]+?)$"), blacklist = [
      "node_modules",
      "favicon.ico"
    ];
    function validate(name) {
      var warnings = [], errors = [];
      if (name === null)
        return errors.push("name cannot be null"), done(warnings, errors);
      if (name === void 0)
        return errors.push("name cannot be undefined"), done(warnings, errors);
      if (typeof name != "string")
        return errors.push("name must be a string"), done(warnings, errors);
      if (name.length || errors.push("name length must be greater than zero"), name.match(/^\./) && errors.push("name cannot start with a period"), name.match(/^_/) && errors.push("name cannot start with an underscore"), name.trim() !== name && errors.push("name cannot contain leading or trailing spaces"), blacklist.forEach(function(blacklistedName) {
        name.toLowerCase() === blacklistedName && errors.push(blacklistedName + " is a blacklisted name");
      }), builtins.includes(name.toLowerCase()) && warnings.push(name + " is a core module name"), name.length > 214 && warnings.push("name can no longer contain more than 214 characters"), name.toLowerCase() !== name && warnings.push("name can no longer contain capital letters"), /[~'!()*]/.test(name.split("/").slice(-1)[0]) && warnings.push(`name can no longer contain special characters ("~'!()*")`), encodeURIComponent(name) !== name) {
        var nameMatch = name.match(scopedPackagePattern);
        if (nameMatch) {
          var user = nameMatch[1], pkg = nameMatch[2];
          if (encodeURIComponent(user) === user && encodeURIComponent(pkg) === pkg)
            return done(warnings, errors);
        }
        errors.push("name can only contain URL-friendly characters");
      }
      return done(warnings, errors);
    }
    var done = function(warnings, errors) {
      var result = {
        validForNewPackages: errors.length === 0 && warnings.length === 0,
        validForOldPackages: errors.length === 0,
        warnings,
        errors
      };
      return result.warnings.length || delete result.warnings, result.errors.length || delete result.errors, result;
    };
    module.exports = validate;
  }
});

export {
  require_lib
};
//# sourceMappingURL=chunk-EZQWZ57B.js.map
