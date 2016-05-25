module.exports = function( grunt ) {

  grunt.registerTask( 'default', [
    'jshint',
    'eslint',
    'mocha_istanbul'
  ]);

};
