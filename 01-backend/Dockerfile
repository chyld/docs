FROM oven/bun:1
WORKDIR /app
COPY . .
RUN ls -al; bun install
RUN mkdir -p db docs; ls -al
EXPOSE 3000
CMD ["bun", "run", "index.ts"]

