FROM alpine:3.13.5

ADD . /app

ENV DATABASE_PATH=/app/db.sqlite3

RUN apk update && \
    apk add bash py-pip sqlite && \
    pip3 install Django && \
    cd /app && \
    python3 manage.py migrate

WORKDIR /app

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8000"]
