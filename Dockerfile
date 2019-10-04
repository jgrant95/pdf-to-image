FROM node:dubnium

#RUN apt-get update 
# && apt-get -y install ttf-freefont

ENV APPDIR /usr/src/app
RUN mkdir -p ${APPDIR}
WORKDIR ${APPDIR}

#  && npm install -g node-pre-gyp

COPY package.json .
COPY package-lock.json .
COPY src/converter.js src/converter.js
COPY src/index.js src/index.js
RUN npm install --loglevel warn

# COPY . ${APPDIR}

EXPOSE 3083

CMD npm start
