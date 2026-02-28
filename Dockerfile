# Stage 1: Build frontend
FROM node:22-slim AS frontend

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Cache Rust dependency compilation
FROM rust:1.85-slim-bookworm AS deps

WORKDIR /app
COPY Cargo.toml Cargo.lock ./

# Dummy main.rs to compile dependencies without real source
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release
RUN rm -rf target/release/.fingerprint/ws-* \
           target/release/deps/ws-* \
           target/release/ws*

# Stage 3: Build the actual binary
FROM deps AS build

COPY src/ src/
RUN cargo build --release

# Stage 4: Minimal runtime
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=build /app/target/release/ws /usr/local/bin/ws
COPY --from=frontend /app/frontend/dist ./static
COPY game_config.json ./

EXPOSE 8080

CMD ["ws"]
