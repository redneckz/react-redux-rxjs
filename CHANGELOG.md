# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [1.0.3] - 2017-08-24

### Added
- Completion event (on unmount)
- \#2 Make dispatch operator smart

### Changed
- Dependencies versions

## [1.0.2] - 2017-08-14

### Changed
- Shallow compare utility performance

### Fixed
- Original props should be passed to wrapped/target component as well as transformed props

## [1.0.1] - 2017-08-11

### Fixed
- Original props should be passed to mappers as well as transformed props

### Changed
- Dependencies versions

## 1.0.0 - 2017-06-21

### Added

- *\@connect* and *\@reactive* decorators to "inject" reactivity into component life cycle
- Observable *action* middleware (like *redux-thunk*)
- Utility for defining *selectors* (like *reselect*)
- Unit tests
- *Travis CI* integration
- *Coveralls* integration

[Unreleased]: https://github.com/redneckz/react-redux-rxjs/compare/v1.0.3...HEAD
[1.0.3]: https://github.com/redneckz/react-redux-rxjs/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/redneckz/react-redux-rxjs/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/redneckz/react-redux-rxjs/compare/v1.0.0...v1.0.1
