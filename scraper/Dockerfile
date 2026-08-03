FROM python:3.12-slim

WORKDIR /app
ENV PYTHONPATH=/app

COPY scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install --with-deps chromium

COPY shared ./shared
COPY scraper .

CMD ["python", "scrape.py"]
