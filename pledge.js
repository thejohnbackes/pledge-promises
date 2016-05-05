'use strict';
/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/

// var _ = require('lodash');

// YOUR CODE HERE:

function $Promise() {
    this.state = 'pending';
    this.value = undefined;
    this.handlerGroups = [];
		this.updateCbs = [];
}

$Promise.prototype.then = function(resolve, reject, updateCb) {
    var forwarder = defer();
    // var testResolve = _.cloneDeep(resolve);
    // if(resolve && typeof resolve === "function"){
    // 	var resolveResult = testResolve();
    // 	if(resolveResult instanceof $Promise) {
    // 		forwarder.$promise = resolveResult;
    // 	}
    // }
    var group = {
        successCb: resolve,
        errorCb: reject,
        forwarder: forwarder
    };
		if(updateCb && typeof updateCb === 'function') this.updateCbs.push(updateCb);

    if (typeof resolve !== 'function') {
        group.successCb = undefined;
    }

    if (typeof reject !== 'function') {
        group.errorCb = undefined;
    }

    if (this.state === 'resolved') {
        return resolve(this.value);
    } else if (this.state === 'rejected' && typeof reject === 'function') {
        return reject(this.value);
    } else {
        this.handlerGroups.push(group);
        return group.forwarder.$promise;
    }
}

$Promise.prototype.catch = function(errorFn) {
    return this.then(null, errorFn);
};

function defer() {
    return new Deferral();
}

function Deferral() {
    this.$promise = new $Promise();
}

Deferral.prototype.resolve = function(data) {
    // console.log('this deferral:', this);
    if (this.$promise.state === 'pending') {
        this.$promise.state = 'resolved';
        this.$promise.value = data;

        var handlerGroups = this.$promise.handlerGroups;
        var value = this.$promise.value;

        while (handlerGroups.length) {
            console.log('handler Groups', handlerGroups);
            var nextGroup = handlerGroups.shift();
						console.log('next Group:',nextGroup)
            if (nextGroup.successCb) {
							try{
								var successResult = nextGroup.successCb(value);
							}
							catch(err){
								nextGroup.forwarder.reject(err);
							}
                if (successResult instanceof $Promise) {
                    successResult.then(function(){
											return nextGroup.forwarder.resolve(successResult.value)
										});
                } else {
                    console.log('nextGroup forwarder:', nextGroup.forwarder);
                    try {
                        console.log(nextGroup.forwarder);
                        nextGroup.forwarder.resolve(successResult);
                    } catch (err) {
                        console.log('error:', err);
                        nextGroup.forwarder.reject(err);
                    }
                }
            } else {
                nextGroup.forwarder.resolve(value);
            }
        }
    }
}


Deferral.prototype.reject = function(data) {
    if (this.$promise.state === 'pending') {
        this.$promise.state = 'rejected';
        this.$promise.value = data;

        var handlerGroups = this.$promise.handlerGroups;
        var value = this.$promise.value;

        while (handlerGroups.length) {
            var nextGroup = handlerGroups.shift();
            if (nextGroup.errorCb) {
							try{
								var errorResult = nextGroup.errorCb(value);
							}
							catch(err) {
								nextGroup.forwarder.reject(err);
							}
							if( errorResult instanceof $Promise ){
								errorResult.then(function(){
									return nextGroup.forwarder.resolve(errorResult.value);
								});
							} else {
								try {
									nextGroup.forwarder.resolve(errorResult);
								} catch (err) {
									nextGroup.forwarder.reject(err);
								}
							}
            } else {
                nextGroup.forwarder.reject(value);
            }
        }
    }
}


Deferral.prototype.notify = function( info ) {
	var dPromise = this.$promise;
	if(dPromise.state === 'pending'){
		var dNotifiers = dPromise.updateCbs;
		for(var i = 0; i < dNotifiers.length; i++){
			dNotifiers[i]( info );
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
