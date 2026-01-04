FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN ls -al; bun install
RUN bun run build; ls -al /app/dist

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

