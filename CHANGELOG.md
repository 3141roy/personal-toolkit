# Changelog

## [1.2.3](https://github.com/3141roy/personal-toolkit/compare/v1.2.2...v1.2.3) (2026-09-01)


### Bug Fixes

* add per-tool FAQ with FAQPage schema ([1567e06](https://github.com/3141roy/personal-toolkit/commit/1567e06e69401b5d6d2ba5dc247aaa6cf8ed1bb2))
* serve markdown to AI agents via content negotiation ([4197b42](https://github.com/3141roy/personal-toolkit/commit/4197b42ddb112cf83d283a9e3eece7a661b25e3c))

## [1.2.2](https://github.com/3141roy/personal-toolkit/compare/v1.2.1...v1.2.2) (2026-08-29)


### Bug Fixes

* redirect /sitemap.xml to /sitemap-index.xml for naive crawlers ([79f08e4](https://github.com/3141roy/personal-toolkit/commit/79f08e4d25ebfee397f4ffcc3f4952f76fe742bf))

## [1.2.1](https://github.com/3141roy/personal-toolkit/compare/v1.2.0...v1.2.1) (2026-08-29)


### Bug Fixes

* add BreadcrumbList schema to category pages ([d23b16e](https://github.com/3141roy/personal-toolkit/commit/d23b16ea0818d9f39e4a169cccd292bf0deb9216))
* add open source license and GitHub links to schema ([2e329b5](https://github.com/3141roy/personal-toolkit/commit/2e329b503035fd4f6f83eebbd451d389f8cb5658))
* generate CSP hashes for JSON-LD scripts so schema isn't blocked ([11acd4f](https://github.com/3141roy/personal-toolkit/commit/11acd4f8b91e24ba9b4953cbfc73b0f1adaad5a7))
* serve custom 404 page instead of empty response on Workers ([9877995](https://github.com/3141roy/personal-toolkit/commit/987799530bef43016f2f33da0b25b2b9ee816942))

## [1.2.0](https://github.com/3141roy/personal-toolkit/compare/v1.1.0...v1.2.0) (2026-08-28)


### Features

* add About and FAQ pages with AboutPage and FAQPage schema ([d21cd0f](https://github.com/3141roy/personal-toolkit/commit/d21cd0ffb3ed0fb6b2c6fca7a5a5d767efc6e082))
* add Merge PDF tool ([e320954](https://github.com/3141roy/personal-toolkit/commit/e32095488094da9be52fa8cd6b16331f4d732fa4))
* add Organize PDF tool with page thumbnails and drag reorder ([0146438](https://github.com/3141roy/personal-toolkit/commit/01464385215ea4cf7774dd260b40b85eb4a6f41a))
* add Split PDF tool ([8dc9e83](https://github.com/3141roy/personal-toolkit/commit/8dc9e83bc3d1549962b1cc1936b9599d6f37015b))


### Bug Fixes

* animate page reorder with svelte/animate flip ([fa49e5e](https://github.com/3141roy/personal-toolkit/commit/fa49e5eb50b49037599c80f9d3b97ec093d24b92))
* mention in-browser preview in terms ([694c1e0](https://github.com/3141roy/personal-toolkit/commit/694c1e0d23513f61bb9c46282c55da2fbea2ed4c))
* mention preview and rebalance about page columns ([9223d8c](https://github.com/3141roy/personal-toolkit/commit/9223d8ca99be7e16087d58ae15eb2d249ef67398))

## [1.1.0](https://github.com/3141roy/personal-toolkit/compare/v1.0.1...v1.1.0) (2026-08-24)


### Features

* add llms.txt for GEO/LLM crawlers ([8c3d813](https://github.com/3141roy/personal-toolkit/commit/8c3d813f4471c10185ed3e4eccc0da8ace38e61d))
* add WebSite and Organization JSON-LD schema ([bcfcc7e](https://github.com/3141roy/personal-toolkit/commit/bcfcc7e5b4dafc53db5afdfaef229856d99dbf15))
* give privacy and terms pages a description ([525fb1e](https://github.com/3141roy/personal-toolkit/commit/525fb1e59762dc12bbd320273bf2394eb91aa625))
* image tools stop hiding their own category ([4f3081b](https://github.com/3141roy/personal-toolkit/commit/4f3081bde85b0c13da0ed289d7463c04b1c8157a))


### Bug Fixes

* lengthen homepage title tag for SEO ([f87fe34](https://github.com/3141roy/personal-toolkit/commit/f87fe34aee02ceba91afe718068d02cd49ad9150))
* use h3 for tool card names instead of div ([8cd32c1](https://github.com/3141roy/personal-toolkit/commit/8cd32c17c1a8fe3617d0b528402be9cc34c94a6c))

## [1.0.1](https://github.com/3141roy/personal-toolkit/compare/v1.0.0...v1.0.1) (2026-08-23)


### Bug Fixes

* exclude CHANGELOG.md from prettier check ([fba10c7](https://github.com/3141roy/personal-toolkit/commit/fba10c747412d66e9c614eb54900b2338d9104ea))
* exclude CHANGELOG.md from prettier check ([2e2dfb0](https://github.com/3141roy/personal-toolkit/commit/2e2dfb04860ac446754f12e35d0d51a3d2f975d3))

## 1.0.0 (2026-08-23)


### Bug Fixes

* add wrangler config so Cloudflare deploy actually uploads the build ([c92cb42](https://github.com/3141roy/personal-toolkit/commit/c92cb42d28fbc2d850749804358318b8b4aa854e))
* remove non-functional preview-deploy workflow ([d782b82](https://github.com/3141roy/personal-toolkit/commit/d782b82f57d012a269e77dcdbcce145f412bfed2))
