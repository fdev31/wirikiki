# Dockerfile
ARG PYTHON_VERSION=3.9
ARG NODE_VERSION=18
ARG WIKI_FOLDER=wiki
ARG PORT=8086

FROM node:${NODE_VERSION}-slim as builder

# Install Python and required build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create and set working directory
WORKDIR /build

# Clone wirikiki
RUN git clone https://github.com/fdev31/wirikiki .

# Set up Python virtual environment
ENV VIRTUAL_ENV=/build/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install Python dependencies in venv
RUN pip install --no-cache-dir -U pip setuptools wheel

# Run build scripts
RUN pwd
RUN ls src
RUN sh ./makevueApps.sh
RUN npm install
RUN DIST=1 ./node_modules/.bin/rollup -c rollup.config.js
RUN pip install --no-cache-dir .

# Final stage
FROM python:${PYTHON_VERSION}-slim

# Install Python venv package
RUN apt-get update && apt-get install -y \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -s /bin/bash wirikiki

# Set up Python virtual environment
ENV VIRTUAL_ENV=/home/wirikiki/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy virtual environment from builder
COPY --from=builder /build/venv $VIRTUAL_ENV
RUN chown -R wirikiki:wirikiki $VIRTUAL_ENV

# Copy dist files
COPY --from=builder /build/dist /opt/wirikiki/dist
RUN chown -R wirikiki:wirikiki /opt/wirikiki

# Set up environment variables
ARG WIKI_FOLDER
ARG PORT
ENV WIKI_FOLDER=${WIKI_FOLDER}
ENV PORT=${PORT}

USER wirikiki
WORKDIR /wikis

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Activate virtual environment\n\
source $VIRTUAL_ENV/bin/activate\n\
\n\
# Create wiki directory if it doesn'"'"'t exist\n\
if [ ! -d "/wikis/${WIKI_FOLDER}" ]; then\n\
    wirikiki create "${WIKI_FOLDER}"\n\
fi\n\
\n\
# Start wirikiki\n\
exec wirikiki\n\
' > /home/wirikiki/entrypoint.sh && \
    chmod +x /home/wirikiki/entrypoint.sh

EXPOSE ${PORT}
ENTRYPOINT ["/home/wirikiki/entrypoint.sh"]

---
# docker-compose.yml
version: '3.8'

services:
  wirikiki:
    build:
      context: .
      args:
        - PYTHON_VERSION=${PYTHON_VERSION:-3.9}
        - NODE_VERSION=${NODE_VERSION:-18}
        - WIKI_FOLDER=${WIKI_FOLDER:-wiki}
        - PORT=${PORT:-8086}
    ports:
      - "${PORT:-8086}:${PORT:-8086}"
    volumes:
      - ./wikis:/wikis
    environment:
      - WIKI_FOLDER=${WIKI_FOLDER:-wiki}
      - PORT=${PORT:-8086}
    restart: unless-stopped
