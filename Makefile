install:
	npm install

lint:
	npm run eslint ./src/

start:
	npm run babel-node -- src/bin/gendiff.js $(args)

publish:
	npm publish ./

