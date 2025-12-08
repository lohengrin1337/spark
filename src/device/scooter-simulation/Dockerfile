# syntax=docker/dockerfile:1

# ______________________________________________________________________
#
#  Base
# ______________________________________________________________________

FROM python:3.12-slim AS base

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ______________________________________________________________________
#
#  Development
# ______________________________________________________________________

FROM base AS development

COPY . .

RUN pip install --no-cache-dir watchfiles==0.23.*

CMD ["watchfiles", "python", "sim.py", "--watch", "/app"]