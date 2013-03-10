# grunt-sp2010

> Grunt task for running an Express server that simulates the SharePoint 2010 RESTful interface.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-sp2010 --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-sp2010');
```

## The "sp2010" task

### Overview
In your project's Gruntfile, add a section named `sp2010` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  sp2010: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```
