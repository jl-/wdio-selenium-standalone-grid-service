import path from 'path'

export default function getFilePath (filePath, defaultFilename) {
    const absPath = path.join(process.cwd(), filePath || '');
    return path.extname(absPath) ? absPath : path.join(absPath, defaultFilename);
}
