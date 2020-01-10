// Generated on 2015-05-06 using generator-angular 0.11.1
(function () {
    'use strict';
    // this function is strict...
}());

// template minifucation
var template = [
    "src/app/templates/partials/template-component.js",
    "src/app/templates/templates-module.js",
    "src/app/templates/partials/generate-template-ctrl.js",
    "src/app/templates/partials/template-config.js"
];

var intakeTemplate = [
    "src/app/intake/templates/partials/template-component.js",
    "src/app/intake/templates/templates-module.js",
    "src/app/intake/templates/partials/generate-template-ctrl.js",
    "src/app/intake/templates/partials/template-config.js",
]

//css file paths to be minified and bundled
var css = [
    "src/app/utils/select/select.css",
    "src/app/styles/css/sanitize_select.css",
    "src/app/utils/select/select2.css",
    "src/app/app.css",
    "src/app/styles/css/bootstrap.min.css",
    "src/app/utils/notification-service/angular-notify.css",
    "src/app/styles/css/temp.css",
    "src/app/styles/css/font-awesome.css",
    "src/app/vendor/c3/c3.css",
    "src/app/vendor/dropzone/dropzone.css",
    "src/app/vendor/ng-tagging/ng-tags-input.min.css",
    "src/app/styles/css/calendar.css",
    "src/app/styles/css/calendarDemo.css",
    "src/app/styles/css/fullcalendar.css",
    "src/app/vendor/textangular/textAngular.css",
    "src/app/vendor/tree-view/css/tree-control.css",
    "src/app/vendor/tree-view/css/tree-control-attribute.css",
    "src/app/styles/css/main.css",
    "src/app/styles/css/toaster.css",
    "src/app/styles/combinedCustomStyle.css"
];

var copyFiles = [
    { src: "src/favicon.ico", dest: "dist/favicon.ico" },
    { src: "src/app/robots.txt", dest: "dist/robots.txt" },
    { src: "src/app/constants.js", dest: "dist/scripts/constants.js" },
    { src: "src/app/client-sw.js", dest: "dist/app/client-sw.js" },
    // { src: "src/app/utils/filterUtils.js", dest: "dist/scripts/filterUtils.js" },
    // { src: "src/app/vendor/ui-mask/angular-ui-utils.min.js", dest: "dist/scripts/angular-ui-utils.min.js" },
    // { src: "src/app/vendor/ng-messages/ng-messages.js", dest: "dist/scripts/ng-messages.js" },
    // { src: "src/app/vendor/moment.min.js", dest: "dist/scripts/moment.min.js" },
    // { src: "src/app/vendor/moment-business.min.js", dest: "dist/scripts/moment-business.min.js" },
    
    { src: "src/app/templates/partials/template_generate_config.json", dest: "dist/templates/partials/template_generate_config.json" },
    { src: "src/app/templates/partials/auto_template_generate_config.json", dest: "dist/templates/partials/auto_template_generate_config.json" },
    { src: "src/app/templates/templates-ctrl.js", dest: "dist/scripts/templates-ctrl.js" },
    
    { src: "src/app/intake/templates/partials/template_generate_config.json", dest: "dist/intake/templates/partials/template_generate_config.json" },
    { src: "src/app/intake/templates/partials/auto_template_generate_config.json", dest: "dist/intake/templates/partials/auto_template_generate_config.json" },
    { src: "src/app/intake/templates/templates-ctrl.js", dest: "dist/scripts/intake-templates-ctrl.js" },
    
    { src: "src/app/docuSign-redirect/bg.jpg", dest: "dist/docuSign-redirect/bg.jpg" },
    { src: "src/app/docuSign-redirect/logo.png", dest: "dist/docuSign-redirect/logo.png" }

];

var version = (new Date()).getTime();

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    //var serveStatic = require('serve-static');

    grunt.loadNpmTasks('grunt-replace');

    // Configurable paths for the application
    var appConfig = {
        app: 'src/app',
        dist: 'dist'
    };

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Project settings
        yeoman: appConfig,

        postcss: {

            options: {
                processors: [
                    require('autoprefixer')([
                        "Android 2.3",
                        "Android >= 4",
                        "Chrome >= 20",
                        "Firefox >= 24",
                        "Explorer >= 8",
                        "iOS >= 6",
                        "Opera >= 12",
                        "Safari >= 6"
                    ])
                ]
            },
            dist: {
                src: '<%= yeoman.app %>/styles/combinedCustomStyle.css',
                dest: '<%= yeoman.app %>/styles/combinedCustomStyle.css'
            }

        },
        replace: {
            dist: {
                options: {
                    patterns: [
                        {
                            match: /sprite.png/g,
                            replacement: function () {
                                return 'sprite.png?v=' + version;
                            }
                        }
                    ]
                },
                files: [
                    { expand: true, flatten: true, src: ['<%= yeoman.dist %>/styles/css/main.css'], dest: 'src/styles/css/' }
                ]
            }
        },

        concat: {
            dist: {
                src: [
                    '<%= yeoman.app %>/**/*.scss'
                ],
                dest: '<%= yeoman.app %>/styles/combinedCustomStyle.scss',
            }
        },
        sass: {
            dist: {
                files: {
                    '<%= yeoman.app %>/styles/combinedCustomStyle.css': ['<%= yeoman.app %>/styles/combinedCustomStyle.scss']
                }
            },
            options: {
                compass: true,
                style: 'compressed',
                sourceMap: false
            }
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            css: {
                files: '<%= yeoman.app %>/**/*.scss',
                tasks: ['css', 'newer:copy:styles'],
                options: {
                    livereload: true,
                },
            },
            styles: {
                files: [
                    '<%= yeoman.app %>/**/*.scss',
                    '!<%= yeoman.app %>/styles/combinedCustomStyle.scss',
                    '<%= yeoman.app %>/styles/css/*.css',
                    '!<%= yeoman.app %>/styles/css/cloudlex.css',
                    '!<%= yeoman.app %>/styles/combinedCustomStyle.css'],
                tasks: ['css', 'newer:copy:styles']
            }
        },

        
        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                protocol: 'https',
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
            },
            livereload: {
                options: {
                    open: true,
                    middleware: function (connect, options, middlewares) {
                        return [

                            serveStatic('.tmp'),
                            connect().use(
                                '/bower_components',
                                serveStatic('./bower_components')
                            ),
                            connect().use(
                                '/app/styles',
                                serveStatic('./app/styles')
                            ),
                            serveStatic(appConfig.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    open: true,
                    base: '<%= yeoman.dist %>'
                }
            }
        },

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [{
                    dot: true,
                    src: [
                        '.tmp',
                        '<%= yeoman.dist %>/{,*/}*',
                        '!<%= yeoman.dist %>/.git{,*/}*'
                    ]
                }]
            },
            css: {
                files: [{
                    dot: true,
                    src: [
                        '<%= yeoman.app %>/styles/combinedCustomStyle.css',
                        '<%= yeoman.app %>/styles/combinedCustomStyle.scss'
                    ]
                }]
            },
            server: '.tmp'
        },

        // Renames files for browser caching purposes
        filerev: {
            dist: {
                src: [
                    '<%= yeoman.dist %>/scripts/{,*/}*.js',
                    '<%= yeoman.dist %>/styles/{,*/}*.css',
                    '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
                    '<%= yeoman.dist %>/styles/fonts/*'
                ]
            }
        },

        // Reads HTML for usemin blocks to enable smart builds that automatically
        //  minify and revision files. Creates configurations in memory so
        // additional tasks can operate on them
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>',
                flow: {
                    html: {
                        steps: {
                            js: ['uglifyjs'],
                            css: ['cssmin']
                        },
                        post: {}
                    }
                }
            }
        },

        // Performs rewrites based on filerev and the useminPrepare configuration
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                assetsDirs: [
                    '<%= yeoman.dist %>',
                    '<%= yeoman.dist %>/images',
                    '<%= yeoman.dist %>/styles'
                ]
            }
        },

        // The following *-min tasks will produce minified files in the dist folder
        // By default, your `index.html`'s <!-- Usemin block --> will take care of
        // minification. These next options are pre-configured if you do not wish
        // to use the Usemin blocks.
        cssmin: {
            dist: {
                files: {
                    'dist/styles/css/main.css': css
                }
            },
            local: {
                files: {
                    'src/styles/css/cloudlex.css': css
                }
            }

        },

        // uglify: {
        //     // keeping the mangle: false because with true it is causing some runtime dependancy problem.
        //     options: {
        //         mangle: false
        //     },
        //     dist: {
        //         files: {
        //             '<%= yeoman.dist %>/scripts/vendor.min.js': vendor,
        //             '<%= yeoman.dist %>/scripts/cloudlex.min.js': userFiles,
        //             '<%= yeoman.dist %>/scripts/template.min.js': template
        //         }
        //     }
        // },

        uglify: {
            // keeping the mangle: false because with true it is causing some runtime dependancy problem.
            dist3: {
                options: {
                    mangle: true
                },
                files: {
                    '<%= yeoman.dist %>/scripts/template.min.js': template
                }
            },
            dist4: {
                options: {
                    mangle: true
                },
                files: {
                    '<%= yeoman.dist %>/scripts/intakeTemplate.min.js': intakeTemplate
                }
            }

        },

        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },

        svgmin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.svg',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    collapseWhitespace: true,
                    conservativeCollapse: true,
                    collapseBooleanAttributes: true,
                    removeCommentsFromCDATA: true,
                    removeOptionalTags: true
                },

                files: [
                    {
                        expand: true,     // Enable dynamic expansion.
                        cwd: 'src/app/',      // Src matches are relative to this path.
                        src: ['**/*.html'], // Actual pattern(s) to match.
                        dest: 'dist/app',   // Destination path prefix.
                    },
                ],
            }
        },

        // Replace Google CDN references
        cdnify: {
            dist: {
                html: ['<%= yeoman.dist %>/*.html']
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,png,txt}',
                        '.htaccess',
                        '*.html',
                        'views/{,*/}*.html',
                        'images/{,*/}*.{webp}',
                        'styles/fonts/{,*/}*.*'
                    ]
                }, {
                    expand: true,
                    cwd: '.tmp/images',
                    dest: '<%= yeoman.dist %>/images',
                    src: ['generated/*']
                }
                ]
            },
            copystyles: {
                expand: true,
                cwd: 'src/styles',
                dest: '<%= yeoman.dist %>/styles',
                src: ['fonts/{,*/}*.*', 'images/{,*/}*.*', 'images/marketplace-images/{,*/}*.*', 'images/marketplace-images/slider/{,*/}*.*', 'videos/*']
            },
            copyselect2image: {
                files: [{ src: "src/app/utils/select/select2.png", dest: "dist/styles/css/select2.png" }]
            },
            copyselect2imageLocal: {
                files: [{ src: "src/app/utils/select/select2.png", dest: "src/app/styles/css/select2.png" }]
            },
            copyjs: {
                files: copyFiles
            },
            copyindex: {
                files: [
                    { src: "src/index.min.html", dest: "dist/index.html" }
                ]
            },
            styles: {
                expand: true,
                cwd: 'src/styles',
                dest: '.tmp/styles/',
                src: '{,*/}*.css'
            }
        },
        // Run some tasks in parallel to speed up the build process
        concurrent: {
            server: [
                'copy:styles'
            ],
            dist: [
                'copy:styles',
                'imagemin',
                'svgmin'
            ]
        },
        cache_control: {
            your_target: {
                source: "dist/index.html",
                options: {
                    version: version,
                    links: true,
                    scripts: true,
                    ignoreCDN: true,
                }
            }
        },
    });


    grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'connect:dist:keepalive']);
        }

        grunt.task.run([
            'clean:server',
            'clean:css',
            'concat',
            'sass',
            'postcss',
            'cssmin:local',
            'clean:css',
            'copy:copyselect2imageLocal',
            'concurrent:server',
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('css', 'Compiling css...', function (target) {
        grunt.task.run([
            'clean:css',
            'concat',
            'sass',
            'postcss',
            'cssmin:local',
            'clean:css',
            'watch'
        ]);
    });

    grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
        grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
        grunt.task.run(['serve:' + target]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'concurrent:test',
        'connect:test'
    ]);

    grunt.registerTask('update-css', [
        'clean:css',
        'concat',
        'sass',
        'postcss',
        'cssmin:local',
        'clean:css',
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'concurrent:dist',
        'copy:dist',
        'cdnify',
        'cssmin',
        'uglify:dist1',
        'uglify:dist2',
        'uglify:dist3',
        'uglify:dist4',
        'usemin',
        'htmlmin',
        'copystyles',
        'copyjs',
        'copyindex',
        'cache_control'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);

    grunt.registerTask('minify', [
        'clean:dist',
        'clean:css',
        'concat',
        'sass',
        'postcss',
        'cssmin',
        'clean:css',
        'uglify:dist1',
        'uglify:dist2',
        'uglify:dist3',
        'uglify:dist4',
        'htmlmin',
        'copystyles',
        'copyjs',
        'replace',
        'copyindex',
        'cache_control'
    ]);

    grunt.registerTask('ng1-build', [
        'clean:dist',
        'clean:css',
        'concat',
        'sass',
        'postcss',
        'cssmin',
        'clean:css',
        'uglify:dist3',
        'uglify:dist4',
        'htmlmin',
        'copystyles',
        'copyjs',
        'replace',
        'copyindex',
        'cache_control'
    ]);

    // purpose: dev task
    // use this for js minification
    grunt.registerTask('minify-js', [
        'clean:dist',
        'uglify:dist1',
        'uglify:dist2',
        'uglify:dist3',
        'uglify:dist4',
        'copyjs',
    ]);

    // purpose: dev task
    // use this for html minification
    grunt.registerTask('minify-html', [
        'clean:dist',
        'cssmin',
        'htmlmin',
        'copystyles',
        'replace',
        'copyindex',
    ]);

    grunt.registerTask('copystyles', [
        'copy:copystyles',
        'copy:copyselect2image'
    ]);

    grunt.registerTask('copyjs', ['copy:copyjs']);

    grunt.registerTask('copyindex', ['copy:copyindex']);

    grunt.registerTask('run-minified', ['connect:dist',
        'watch']);

        

};

