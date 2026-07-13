FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# The project uses Vercel serverless functions; Vercel CLI is used inside
# the container so /api routes behave the same way they do during deployment.
CMD ["npx", "vercel", "dev", "--listen", "0.0.0.0:3000", "--yes"]
