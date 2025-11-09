# API Dockerfile (Fastify + TypeScript)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
# Wait for database to be ready, then start the API
CMD ["sh", "-c", "npm start"]
