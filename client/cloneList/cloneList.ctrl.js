import {throttle} from 'lodash';
import moment from 'moment';

module.exports = class CloneList {
  constructor ($scope, $routeParams, io, errorHandler) {
    this.$scope = $scope;
    this.io = io;
    this.errorHandler = errorHandler;
    this.pkmnId = $routeParams.id;
    this.pkmnData = null;
    this.clones = [];
    this.errorStatusCode = null;
    this.isLoading = true;
    this.isFinished = false;
    this.currentPage = 1;
    const scrollElement = document.getElementById('scroll-container');
    this.onscroll = throttle(() => {
      if (!this.isLoading && !this.isFinished &&
          scrollElement.scrollTop + window.innerHeight >= scrollElement.scrollHeight - 100) {
        this.fetchMoreClones();
      }
    }, 150);
    scrollElement.addEventListener('scroll', this.onscroll);
    // Clean up the event listener when this controller is destroyed
    this.$scope.$on('$destroy', () => scrollElement.removeEventListener('scroll', this.onscroll));
  }
  fetchPokemonForCard () {
    return this.io.socket.getAsync(`/api/v1/pokemon/${this.pkmnId}`)
      .then(data => {
        this.pkmnData = data;
      }).catch({statusCode: 403}, {statusCode: 404}, {statusCode: 500}, err => {
        this.errorStatusCode = err.statusCode;
      }).catch(this.errorHandler)
      .finally(() => this.$scope.$apply());
  }
  fetchMoreClones () {
    this.isLoading = true;
    return this.io.socket.getAsync(`/api/v1/pokemon/${this.pkmnId}/clones`, {
      page: this.currentPage++,
      pokemonFields: 'owner,id,createdAt,nickname'
    }).then(res => {
      if (res.contents.length < res.pageSize) this.isFinished = true;
      // All elements in an ng-repeat have to be unique, so replace the `null`s with placeholder {_isPrivate: true} objects.
      this.clones.push(...res.contents.map(clone => clone === null ? {_isPrivate: true} : clone));
    }).finally(() => this.isLoading = false)
      .tap(this.onscroll)
      .catch({statusCode: 403}, {statusCode: 404}, () => {})
      .catch(this.errorHandler)
      .finally(() => this.$scope.$apply());
  }
};
