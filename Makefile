
GREP ?= .

test:
	@./node_modules/.bin/mocha \
		--reporter spec \
		--grep $(GREP)

.PHONY: test
