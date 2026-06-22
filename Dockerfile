# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev=false
COPY . .
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 8787
CMD ["npm", "run", "backend:dev"]
