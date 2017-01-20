module.exports = function( grunt ) {

  grunt.initConfig({
    // read package.json
    pkg: grunt.file.readJSON('package.json'),
    // linting
    jshint: require('./build/config/jshint'),
    // style checker
    eslint: require('./build/config/eslint'),
    // mocha tests
    mocha_istanbul: require('./build/config/mocha'),
    // watch config
    watch: require('./build/config/watch'),
    // benchmark config
    benchmark: require('./build/config/benchmark')
  });

  // load npm plugins (all dependencies that match /^grunt/)
  require('load-grunt-tasks')( grunt );

  // load custom tasks
  grunt.loadTasks('./build/tasks');

};
