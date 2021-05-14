FROM node:10


WORKDIR /Projects/clinicResevationMicroservice



COPY package.json /Projects/clinicResevationMicroservice/package.json

RUN npm install


COPY . /Projects/clinicResevationMicroservice

EXPOSE 3000
CMD [ "node", "app.js" ]
