install-deps:
	npm ci

test:
	npm test

test-debug:
	DEBUG=* npm test

test-debug-page-loader:
	DEBUG=page-loader npm test

test-axios:
	DEBUG=axios npm test
	
run:
	npm run start https://ru.hexlet.io/courses

debug:
	DEBUG=* npm run start https://ru.hexlet.io/courses

debug-page-loader:
	DEBUG=page-loader npm run start https://ru.hexlet.io/courses

debug-axios:
	DEBUG=axios npm run start https://ru.hexlet.io/courses
