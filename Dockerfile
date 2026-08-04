# Build-Stage
FROM golang:1.24 AS build
WORKDIR /app

# Dependency layer: re-downloads only when go.mod/go.sum change, every
# other deploy reuses the cached modules.
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Install templ, pinned to the version go.mod pins
RUN go install github.com/a-h/templ/cmd/templ@$(go list -m -f '{{.Version}}' github.com/a-h/templ)

# Generate templ files
RUN templ generate

# Install build dependencies
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

# Get the latest version from GitHub API and save it to version.txt
RUN curl -s https://api.github.com/repos/templui/templui/releases/latest | grep tag_name | cut -d '"' -f 4 > version.txt || echo "unknown" > version.txt

# Install Tailwind CSS standalone CLI
RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "x86_64" ]; then \
  TAILWIND_URL="https://github.com/tailwindlabs/tailwindcss/releases/download/v4.3.3/tailwindcss-linux-x64"; \
  elif [ "$ARCH" = "aarch64" ]; then \
  TAILWIND_URL="https://github.com/tailwindlabs/tailwindcss/releases/download/v4.3.3/tailwindcss-linux-arm64"; \
  else \
  echo "Unsupported architecture: $ARCH"; exit 1; \
  fi && \
  wget -O tailwindcss "$TAILWIND_URL" && \
  chmod +x tailwindcss

# Generate Tailwind CSS output (the 2.0 entry file is globals.css)
RUN ./tailwindcss -i ./assets/css/globals.css -o ./assets/css/output.css --minify

# Build the application as a static binary. -p 2 caps compile parallelism
# so small builders do not OOM, -s -w strips debug info from the binary.
RUN CGO_ENABLED=0 GOOS=linux go build -p 2 -ldflags="-s -w" -o main ./cmd/docs/main.go

# Shiki deps stage: install the highlighter service's node_modules once.
FROM node:20-alpine AS shiki
WORKDIR /shiki
COPY shiki/package*.json ./
RUN npm ci --omit=dev
COPY shiki/server.js ./

# Deploy-Stage
FROM alpine:3.20.2
WORKDIR /app

# Install ca-certificates and node for the interim shiki sidecar (dies
# with the planned build-time highlighting, see CREATE_1TO1_PLAN 2f)
RUN apk add --no-cache ca-certificates nodejs

# Set environment variable for runtime
ENV GO_ENV=production

# Copy the binary, version file, CSS output and the shiki service
COPY --from=build /app/main .
COPY --from=shiki /shiki /app/shiki
COPY --from=build /app/version.txt .
COPY --from=build /app/assets/css/output.css ./assets/css/output.css

# Expose the port
EXPOSE 8090

# Command to run: the shiki highlighter starts alongside, the Go
# server stays PID 1 (SHIKI_URL default localhost:3000 just works)
CMD ["sh", "-c", "node /app/shiki/server.js & exec ./main"]
