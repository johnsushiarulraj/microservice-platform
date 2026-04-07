FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps
COPY public ./public
COPY src ./src
ARG REACT_APP_DEVCONSOLE_URL=https://javabackend.com/devconsole
ENV REACT_APP_DEVCONSOLE_URL=$REACT_APP_DEVCONSOLE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
