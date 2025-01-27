## Set Up

### Backend Setup (Flask)
You can copy and paste this into your terminal:
```
cd flask-server

# create and activate venv if it doesn't already exist
python3 -m venv venv; source venv/bin/activate

pip install -r requirements.txt

python3 server.py
```

Note: You will need your own .env file with your API_KEY.
```
echo "API_KEY={YOUR_API_KEY}" > .env | cat .env
```

### Frontend Setup (Create-React-App)
You can copy and paste this into your terminal:
```
cd client;
npm install;
npm start
```
This will open http://localhost:3000 in your browser.

#### Some technical decisions or tradeoffs you made.
I decided to structure the FMP data like so:
```
{
   'open': [
      ['test_date', 'test_open_price'], 
      ['test_date_2', 'test_open_price_2']
   ],
   'close': [
      ['test_date', 'test_close_price'], 
      ['test_date_2', 'test_close_price_2'],
   ...
}
```
The ellipses after the 'open' and 'close' objects will contain:
```
keys: high, low, adjustedClose, volume, unadjustedVolume, change
values: either a list of prices, # of shares or percentage
```
This is because the graph changes when the price type changes. Keying by graph type allows direct access to price/shares/percentage data.

#### What challenges did you run into?
The dragging functionality was the toughest part! I originally used the zoom feature that Highcharts provides for the original submission, but this time around, I removed that entirely to use custom mouse down, mouse over and mouse up events.

Challenges from the original submission:
- The initial render after choosing a quote type from the dropdown would show the graph _without_ the data points. But if I changed it to a different quote type from the dropdown, data points showed up. The problem was updating both state variables `activeQuoteType` and `chartOptions` in the same render. This doesn't work because `chartOptions` is dependent on `activeQuoteType`. This meant that in the render queue, I was replacing the `activeQuoteType` to something like 'Close' and then replacing `chartOptions` with an object that viewed `activeQuoteType` as an empty string (the default value). To resolve this, I used 'useEffect' to have it perform a re-render to update `chartOptions` whenever `activeQuoteType` changes.

Challenges from the second submission:
   
#### What could you have done better with more time?
- A freeform textbox or dropdown allowing users to query other tickers.
- Improved UI styling. Use a CSS preprocessor (i.e. Sass) when styling gets more complex.
- Instead of triggering a re-render when `activeQuoteType` changes to update `chartOptions`, I can use an updater function so that everything is updated on the same render.

#### From a scale of 1 (not strong) -5 (work of art), how would you rate yourself on each of these categories on this project? 
1. Code structure and cleanliness. 5/5
2. Completion and polish. 4/5
3. Execution and velocity. 4/5 & 3/5

##### Could you explain why you elected to stand up your own backend instead of hitting the services directly?
During local development, I had my frontend hit my Python Flask backend by adding a proxy to my package.json file. But while looking for free deployment options, I came across Render and had difficulty getting it to run running with a single service. Further research determined that two separate services would be best -- one for a backend, one for a frontend.
