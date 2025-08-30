const { fullAccessTags, limitedAccessTags } = require('./accessRules');

function hasFullAccess(tags) {
  return tags.some(tag => fullAccessTags.includes(tag.name));
}

function hasLimitedAccess(tags) {
  const fullSleepMusicAccess = limitedAccessTags.fullSleepMusicAccess.every(tagName =>
    tags.some(tag => tag.name === tagName)
  );
  const defaultSleepMusicAccess = limitedAccessTags.defaultSleepMusicAccess.every(tagName =>
    tags.some(tag => tag.name === tagName)
  );

  return {
    fullSleepMusicAccess,
    defaultSleepMusicAccess,
  };
}

module.exports = {
  hasFullAccess,
  hasLimitedAccess,
};
