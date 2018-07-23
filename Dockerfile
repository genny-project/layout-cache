FROM node:10-stretch

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apt-get install libssl-dev

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
ADD . .

RUN mkdir ~/.ssh
RUN echo "Host *\nStrictHostKeyChecking no\nUserKnownHostsFile=/dev/null" > ~/.ssh/config

EXPOSE 2223
CMD [ "npm", "start" ]
