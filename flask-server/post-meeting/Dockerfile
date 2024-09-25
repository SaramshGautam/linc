FROM python:3.12

ENV DEBIAN_FRONTEND=noninteractive

RUN pip install Flask gunicorn

WORKDIR /app

# COPY /post-meeting/ app/

RUN pip install Flask gunicorn pandas nltk

# RUN python -m nltk.downloader punkt stopwords

COPY nltk_data /root/nltk_data

COPY requirements.txt /app/
COPY server.py /app/server.py
COPY config.py /app/config.py
COPY wsgi.py /app/wsgi.py

COPY .env /app/.env
# COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

# RUN if [ -f "requirements.txt" ]; then pip install --no-cache-dir -r requirements.txt; fi

ENV PORT 8080

EXPOSE 8080

CMD exec gunicorn --bind :${PORT} --workers 1 --threads 8 server:app

# CMD ["gunicorn", "-w", "4", "s-b", "0.0.0.0:8080", "wsgi:app"]
