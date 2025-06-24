FROM node:18

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
