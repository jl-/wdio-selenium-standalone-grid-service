'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = getFilePath;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getFilePath(filePath, defaultFilename) {
    var absPath = _path2.default.join(process.cwd(), filePath || '');
    return _path2.default.extname(absPath) ? absPath : _path2.default.join(absPath, defaultFilename);
}