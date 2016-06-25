module.exports = {
  filterParams (allParams, legalParams, {throwOnEmpty = true} = {}) {
    const filtered = _.pick(allParams, _.isArray(legalParams) ? legalParams : _.keys(legalParams));
    if (_.isEmpty(filtered) && throwOnEmpty) {
      throw {statusCode: 400, message: 'No valid parameters specified'};
    }
    return filtered;
  },
  requireParams (allParams, requiredValues, {requireStrings = true} = {}) {
    _.forEach(_.isArray(requiredValues) ? requiredValues : [requiredValues], param => {
      if (!_.has(allParams, param) || requireStrings && !_.isString(allParams[param])) {
        throw {statusCode: 400, message: `Missing parameter ${param}`};
      }
    });
  },
  verifyUserIsOwner (item, user, {allowAdmin = true, allowDeleted = false} = {}) {
    if (!item || !allowDeleted && item._markedForDeletion) {
      throw {statusCode: 404};
    }
    if (item.owner !== user.name && !(user.isAdmin && allowAdmin)) {
      /* If anyone other than the owner tries to undelete an item, return a 404 error.
      That way, the server doesn't leak information on whether an item with the given ID ever existed. */
      throw {statusCode: item._markedForDeletion ? 404 : 403};
    }
  },
  verifyBoxParams (params) {
    if (!_.isUndefined(params.name) && (!_.isString(params.name) || _.isEmpty(params.name))) {
      throw {statusCode: 400, message: 'Invalid box name'};
    }
    if (!_.isUndefined(params.name) && (params.description && !_.isString(params.description))) {
      throw {statusCode: 400, message: 'Invalid box description'};
    }
    if (!_.isUndefined(params.visibility)
        && !Constants.BOX_VISIBILITIES.includes(params.visibility)) {
      throw {statusCode: 400, message: 'Invalid box visibility'};
    }
  },
  verifyPokemonParams (params) {
    if (!_.isUndefined(params.visibility)
        && !Constants.POKEMON_VISIBILITIES.includes(params.visibility)) {
      throw {statusCode: 400, message: 'Invalid pokemon visibility'};
    }
  },
  verifyPokemonNoteParams (params) {
    if (!_.isUndefined(params.text) && (!_.isString(params.text) || _.isEmpty(params.text))) {
      throw {statusCode: 400, message: 'Invalid note text'};
    }
    if (!_.isUndefined(params.visibility)
        && !Constants.POKEMON_NOTE_VISIBILITIES.includes(params.visibility)) {
      throw {statusCode: 400, message: 'Invalid note visibility'};
    }
  },
  assert (value, message) {
    if (!value) {
      throw {statusCode: 400, message};
    }
  },
  async usernameAvailable (name) {
    if (!_.isString(name) || !Constants.VALID_USERNAME_REGEX.test(name)) {
      return false;
    }
    const existingUser = await User.findOne({name});
    const deletedUser = await DeletedUser.findOne({name});
    return !(existingUser || deletedUser);
  }
};
