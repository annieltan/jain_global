## Set Up

### Backend (Flask)
```
1. cd into `flask-server`
2. create a venv if it doesn't already exist: `python3 -m venv venv`
3. activate your venv: `source venv/bin/activate`
4. run `pip install flask`
5. run `python3 server.py` to run the server on port 5000

Note: You will need your own .env file with your API_KEY. You will also need to run `pip install dotenv` if you plan on loading in the .env file.
```

### Frontend (create-react-app)
```
1. cd into `client`
2. run `npm start` and it should open http://localhost:3000 in your browser
```

#### Some technical decisions or tradeoffs you made.
A technical decision I made was how best to structure the data fetched from FMP. I decided that this structure would be best:
```
{'open': [
    ['test_date', 'test_price'], ['test_date_2', 'test_price_2']],
 'close': [
    [...], [...], [...]],
 ...
 }

 This is because the graph changes when the price type changes, so it made most sense to make that easily accessible by key and the price data as values.
```
#### What challenges did you run into?
The dragging functionality was the toughest part! Since this is quite a custom feature that Highcharts doesn't fully support, it took a bit of researching and documentation reading to get the feature fully working. Highcharts has a feature that allows you to drag your cursor to highlight a selection area but it automatically zooms in. I ended up using this to get the drag & highlight feature but I removed the zoom-ins and used a selection event to plot the delta. Some issues that I ran into while getting this to work:
- Using chartOptions as a state variable wasn't working as expected. Prior to making this change, chart options was a constant variable and the graph loaded as expected after choosing a price type from the dropdown. But once I tried to use this as a state variable -- simply doing something like `const [chartOptions, setChartOptions] = useState(options)` -- the graph did not render properly. This was a beginner mistake on my end! I was updating the activePriceType state variable, but not the chartOptions state variable. Somehow I thought that chartOptions would be updated as well, but not the case!
- Perhaps a bit more interesting was that after I got the delta and plotbands to work, I noticed that upon the initial render after choosing a price type from the dropdown, Highcharts graph would show up but _without_ the data points. However, if I changed it to Open (or another price type) right after, data points showed up. The issue was that I was updating both state variables activePriceType and chartOptions in the same render, which doesn't work because chartOptions is dependent on activePriceType. This meant that in the queue, I was replacing the activePriceType to 'Close' and then replacing chartOptions with an object that viewed activePriceType as an empty string (default value). Instead, I used 'useEffect' to have it perform a re-render to update chartOptions whenever activePriceType changes. It can be argued that this isn't as performant since we have to rerender every time activePriceType changes.
   
#### What could you have done better with more time?
- The drag functionality isn't as accurate when it's zoomed out to anything more than 3 months. With a smaller amount of data points, the drag functionality is able to capture the two points well, but when it's a significant amount of data points, it struggles with this.
- I wanted to add a dropdown list to choose a different stock other than AAPL. Alas, the drag functionality took a bit longer than anticipated.