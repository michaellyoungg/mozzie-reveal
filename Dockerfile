# Stage 1: Cache dependency compilation
FROM rust:1.85-slim-bookworm AS deps

WORKDIR /app
COPY Cargo.toml Cargo.lock ./

# Dummy main.rs to compile dependencies without real source
RUN mkdir src && echo 'fn main() {}' > src/main.rs
RUN cargo build --release
RUN rm -rf target/release/.fingerprint/ws-* \
           target/release/deps/ws-* \
           target/release/ws*

# Stage 2: Build the actual binary
FROM deps AS build

COPY src/ src/
RUN cargo build --release

# Stage 3: Minimal runtime
FROM debian:bookworm-slim

COPY --from=build /app/target/release/ws /usr/local/bin/ws

ENV BIND_ADDR=0.0.0.0:8080
EXPOSE 8080

CMD ["ws"]
