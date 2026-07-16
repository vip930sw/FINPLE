const path = require("node:path");

function normalizeForwardSlashPath(value) {
  if (typeof value !== "string" || value.length === 0) return "";
  return path.posix.normalize(value.normalize("NFC").replace(/\\/g, "/"));
}

function conservativeCaseFold(value) {
  return value.normalize("NFC").toLocaleLowerCase("en-US");
}

function getMetricsTargetPathIdentity(
  repositoryPath,
  { filesystemPath = "" } = {},
) {
  const normalizedRepositoryPath = normalizeForwardSlashPath(repositoryPath);
  const normalizedFilesystemPath = normalizeForwardSlashPath(
    filesystemPath || normalizedRepositoryPath,
  );
  return {
    normalizedRepositoryPath,
    repositoryCollisionKey: normalizedRepositoryPath
      ? conservativeCaseFold(normalizedRepositoryPath)
      : "",
    filesystemCollisionKey: normalizedFilesystemPath
      ? conservativeCaseFold(normalizedFilesystemPath)
      : "",
  };
}

function areMetricsTargetPathsDistinct(
  leftPath,
  rightPath,
  {
    leftFilesystemPath = "",
    rightFilesystemPath = "",
  } = {},
) {
  const left = getMetricsTargetPathIdentity(leftPath, {
    filesystemPath: leftFilesystemPath,
  });
  const right = getMetricsTargetPathIdentity(rightPath, {
    filesystemPath: rightFilesystemPath,
  });
  return (
    left.repositoryCollisionKey.length > 0 &&
    right.repositoryCollisionKey.length > 0 &&
    left.filesystemCollisionKey.length > 0 &&
    right.filesystemCollisionKey.length > 0 &&
    left.repositoryCollisionKey !== right.repositoryCollisionKey &&
    left.filesystemCollisionKey !== right.filesystemCollisionKey
  );
}

module.exports = {
  areMetricsTargetPathsDistinct,
  getMetricsTargetPathIdentity,
  normalizeForwardSlashPath,
};
