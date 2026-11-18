FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4321
# Vercel adapter has no standalone server; container runs the dev server.
CMD ["npm", "run", "dev", "--", "--host"]
