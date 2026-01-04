FROM oven/bun:1
WORKDIR /app
COPY . .
RUN ls -al; bun install; ls -al
RUN mkdir -p db docs
EXPOSE 3000
CMD ["bun", "run", "index.ts"]

