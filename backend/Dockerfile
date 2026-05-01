FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /bin/api ./cmd/api

# ─── Production image ─────────────────────────────────────────────────────────

FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata wget && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=builder /bin/api /app/api

USER app

EXPOSE 8080

ENTRYPOINT ["/app/api"]
