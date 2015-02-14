#
# Binaries.
#

JSCS = ./node_modules/.bin/jscs
MOCHA = ./node_modules/.bin/mocha

#
# Files.
#

SRCS = $(wildcard lib/*.js lib/**.js)
TESTS = $(wildcard test/*.js test/**/*.js)
GREP ?= .

#
# Tasks.
#

node_modules: $(wildcard package.json node_modules/*/package.json node_modules/**/package.json)
	@npm install

clean:
	@rm -rf node_modules *.log

lint:
	@$(JSCS) $(SRCS) $(TESTS)

test: lint
	@$(MOCHA) \
		--reporter spec \
		--inline-diffs \
		--grep $(GREP) \
		$(TESTS)

#
# Phonies.
#

.PHONY: clean test lint
