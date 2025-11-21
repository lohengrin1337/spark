FROM node:24-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npx", "nodemon", "app.js"]
