'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function $Promise () {
	this.state = 'pending';
	this.value = undefined;
	this.handlerGroups = [];
}

$Promise.prototype.then = function(resolve, reject) {
	var group = {
		successCb: resolve,
		errorCb: reject
	};

	if (typeof resolve !== 'function') {
		group.successCb = undefined;
	}
	
	if (typeof reject !== 'function') {
		group.errorCb = undefined;
	}
	
	if (this.state === 'resolved') {
		return resolve(this.value);
	} else if (this.state === 'rejected') {
		return rejected(this.value);
	} else {
		this.handlerGroups.push(group);
	}
}

function defer() {
	return new Deferral();
}

function Deferral () {
	this.$promise = new $Promise();
}

Deferral.prototype.resolve = function(data) {
	if (this.$promise.state === 'pending') {
		this.$promise.state = 'resolved';
		this.$promise.value = data;

		var handlerGroups = this.$promise.handlerGroups;
		var value = this.$promise.value;

		if (handlerGroups.length) {
			handlerGroups.forEach(function(group) {
				group.successCb(value)
			});
		}
	}
}

Deferral.prototype.reject = function(data) {
	if (this.$promise.state === 'pending') {
		this.$promise.state = 'rejected';
		this.$promise.value = data;	
		
		var handlerGroups = this.$promise.handlerGroups;
		var value = this.$promise.value;
		
		if (handlerGroups.length) {
			handlerGroups.forEach(function(group) {
				group.errorCb(value)
			});
		}
	}
}


/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = {
  defer: defer,
};

So in a Node-based project we could write things like this:

var pledge = require('pledge');
…
var myDeferral = pledge.defer();
var myPromise1 = myDeferral.$promise;
--------------------------------------------------------*/
