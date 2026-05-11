# Build-Stage
FROM golang:1.24 AS build
WORKDIR /app

# Copy the source code
COPY . .

# Install templ
RUN go install github.com/a-h/templ/cmd/templ@v0.3.1001

# Generate templ files
RUN templ generate

# Install build dependencies
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

# Get the latest version from GitHub API and save it to version.txt
RUN curl -s https://api.github.com/repos/templui/templui/releases/latest | grep tag_name | cut -d '"' -f 4 > version.txt || echo "unknown" > version.txt

# Install Tailwind CSS standalone CLI
RUN ARCH=$(uname -m) && \
  if [ "$ARCH" = "x86_64" ]; then \
  TAILWIND_URL="https://github.com/tailwindlabs/tailwindcss/releases/download/v4.1.3/tailwindcss-linux-x64"; \
  elif [ "$ARCH" = "aarch64" ]; then \
  TAILWIND_URL="https://github.com/tailwindlabs/tailwindcss/releases/download/v4.1.3/tailwindcss-linux-arm64"; \
  else \
  echo "Unsupported architecture: $ARCH"; exit 1; \
  fi && \
  wget -O tailwindcss "$TAILWIND_URL" && \
  chmod +x tailwindcss

# Generate Tailwind CSS output
RUN ./tailwindcss -i ./assets/css/input.css -o ./assets/css/output.css --minify

# Build the application as a static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/docs/main.go

# Deploy-Stage
FROM alpine:3.20.2
WORKDIR /app

# Install ca-certificates
RUN apk add --no-cache ca-certificates

# Set environment variable for runtime
ENV GO_ENV=production

# Copy the binary, version file, and CSS output
COPY --from=build /app/main .
COPY --from=build /app/version.txt .
COPY --from=build /app/assets/css/output.css ./assets/css/output.css

# Expose the port
EXPOSE 8090

# Command to run
CMD ["./main"]
