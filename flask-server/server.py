import os
import requests

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv() 

API_KEY = os.getenv('API_KEY')
US_EXCHANGES = [
    'NYSE',
    'NASDAQ',
    'CBOE',
    'CME',
    'CBOT',
    'CHX',
    'OTC',
]

app = Flask(__name__)
CORS(app) 


@app.route("/stocks", methods=['GET'])
def get_stocks():
    stocks_url = f'https://financialmodelingprep.com/api/v3/stock/list?apikey={API_KEY}'
    stocks = requests.get(stocks_url).json()
    us_stocks = list(filter(lambda r: r['exchangeShortName'] in US_EXCHANGES and r['type'] == 'stock', stocks))
    return jsonify(us_stocks)

@app.route("/historical-prices/<stock>", methods=['GET'])
def get_historical_px(stock: str):
    px_url = f'https://financialmodelingprep.com/api/v3/historical-price-full/{stock}?apikey={API_KEY}'
    return requests.get(px_url).json()

if __name__ == '__main__':
    app.run(port=5001, debug=True)
