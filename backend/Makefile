BIN=./bin/api
CMD=./cmd/api

.PHONY: build run dev test tidy lint

build:
	go build -o $(BIN) $(CMD)

run: build
	$(BIN)

dev:
	go run $(CMD)/main.go

test:
	go test ./... -v -count=1

tidy:
	go mod tidy

lint:
	golangci-lint run ./...

migrate:
	psql $$DATABASE_URL -f ../database/schema.sql

seed:
	psql $$DATABASE_URL -f ../database/seed.sql
