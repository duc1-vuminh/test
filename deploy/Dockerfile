FROM node:20-alpine

WORKDIR /app

COPY package.json ./

RUN npm install

COPY app.js ./
COPY deploy ./deploy

EXPOSE 7001

CMD ["npm", "start"]