var SSH_REMOTE_REGEX = /git@github\.com:([^\/]+)\/([^\/\.]+)\.git/;
var HTTPS_REMOTE_REGEX = /https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)\.git/;
var GIT_REMOTE_REGEX = /git:\/\/github\.com\/([^\/]+)\/([^\/\.]+)\.git/;

var validSSHRemoteOriginUrl = function (remoteOriginUrl) {
    return typeof remoteOriginUrl === 'string' && remoteOriginUrl.match(SSH_REMOTE_REGEX);
};

var validHTTPSRemoteOriginUrl = function (remoteOriginUrl) {
    return typeof remoteOriginUrl === 'string' && remoteOriginUrl.match(HTTPS_REMOTE_REGEX);
};

var validGitRemoteOriginUrl = function (remoteOriginUrl) {
    return typeof remoteOriginUrl === 'string' && remoteOriginUrl.match(GIT_REMOTE_REGEX);
}

var validGitRemoteOriginUrl = function (remoteOriginUrl) {
    return remoteOriginUrl && typeof remoteOriginUrl === 'string' &&
        remoteOriginUrl.match(/https:\/\/github\.com\/[^\/]+\/[^\/\.]+\.git/);
};

var parseProjectNameFromRemoteOriginalUrl = function (remoteOriginUrl) {
    if (validSSHRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(SSH_REMOTE_REGEX)[2];
    } else if (validHTTPSRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(HTTPS_REMOTE_REGEX)[2];
    } else if(validGitRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(GIT_REMOTE_REGEX)[2];
    } else {
        return null;
    }
};

var parseOwnerFromRemoteOriginUrl = function (remoteOriginUrl) {
    if (validSSHRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(SSH_REMOTE_REGEX)[1];
    } else if (validHTTPSRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(HTTPS_REMOTE_REGEX)[1];
    } else if (validGitRemoteOriginUrl(remoteOriginUrl)) {
        return remoteOriginUrl.match(GIT_REMOTE_REGEX)[1];
    } else {
        return null;
    }
};

module.exports = {
    getRepositoryOwner: parseOwnerFromRemoteOriginUrl,
    getRepositoryName: parseProjectNameFromRemoteOriginalUrl
};