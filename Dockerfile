FROM node:latest

# Create the directory
RUN mkdir -p /usr/src/ytctools
WORKDIR /usr/src/ytctools

# Copy and Install
COPY package.json /usr/src/ytctools
RUN npm install
COPY . /usr/src/ytctools

# Start
CMD ["node", "."]