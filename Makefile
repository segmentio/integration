
SRC = lib/*.js
GREP ?= .

include node_modules/make-lint/index.mk

test: lint
	@./node_modules/.bin/mocha \
		--reporter spec \
		--grep $(GREP)

.PHONY: test
