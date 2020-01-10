(function () {

    'use strict';
    angular
        .module('cloudlex.settings')
        .factory('Password', function () {

            function getStrength(pass) {
                var passStrength = {};
                passStrength.score = 0;
                passStrength.passwordLength = 0;
                passStrength.satisfyCondition = false;

                if (angular.isDefined(pass)) {
                    passStrength.passwordLength = pass.length;
                    //var score = 0;

                    if (!pass) {
                        return passStrength.score;
                    }

                    //avoid every unique letter until 5 repetition
                    var letters = new Object();
                    for (var i = 0; i < pass.length; i++) {
                        letters[pass[i]] = (letters[pass[i]] || 0) + 1;
                        passStrength.score += 5.0 / letters[pass[i]];
                    }

                    //bonus point for mixing it up
                    var variations = {
                        digits: /\d/.test(pass),
                        lower: /[a-z]/.test(pass),
                        upper: /[A-Z]/.test(pass),
                        nonWords: /\W/.test(pass)
                    }

                    var variationsCount = 0;
                    var isAscii = /^[\x00-\x7F]*$/.test(pass);

                    for (var check in variations) {
                        variationsCount += (variations[check] == true) ? 1 : 0;
                    }
                    if (variations.digits && variations.lower && variations.upper && variations.nonWords && isAscii) {
                        passStrength.satisfyCondition = true;
                    } else {
                        passStrength.satisfyCondition = false;
                    }
                    passStrength.score += (variationsCount - 1) * 10;

                    if (passStrength.score > 100) {
                        passStrength.score = 100;
                    }
                }


                return passStrength;
            }

            return {
                getStrength: function (pass) {
                    return getStrength(pass);
                }
            }
        });

})();