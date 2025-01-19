import Dropdown from 'react-bootstrap/Dropdown';
import React, { useState, useEffect, useRef } from 'react'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official';


export default function App() {
  // in future version, we could add a dropdown
  // to choose other stocks with setActiveStock
  const [activeStock, setActiveStock] = useState('AAPL')
  const [activePriceType, setPriceType] = useState('')
  const [prices, setPrices] = useState({})
  const chartRef = useRef(null);

  console.log('rendering')

  useEffect(() => {
    fetch(`https://jain-global.onrender.com/historical-prices/${activeStock}`).then(
    res => res.json()
    ).then(
    data => {
        console.log('reformatting prices data after fetching')
        const stockData = {}
        // reformat data
        data['historical'].forEach(d => {
          stockData['open'] = stockData['open'] || [];
          stockData['open'].push([d.date, d.open])
          stockData['close'] = stockData['close'] || [];
          stockData['close'].push([d.date, d.close])
          stockData['high'] = stockData['high'] || [];
          stockData['high'].push([d.date, d.high])
          stockData['low'] = stockData['low'] || [];
          stockData['low'].push([d.date, d.low])
          stockData['adjClose'] = stockData['adjClose'] || [];
          stockData['adjClose'].push([d.date, d.adjClose])
          stockData['volume'] = stockData['volume'] || [];
          stockData['volume'].push([d.date, d.volume])
          stockData['unadjustedVolume'] = stockData['unadjustedVolume'] || [];
          stockData['unadjustedVolume'].push([d.date, d.unadjustedVolume])
          stockData['change'] = stockData['change'] || [];
          stockData['change'].push([d.date, d.change])
        })
        // Highcharts requires data to be sorted
        stockData['open'].sort()
        stockData['close'].sort()
        stockData['high'].sort()
        stockData['low'].sort()
        stockData['adjClose'].sort()
        stockData['volume'].sort()
        stockData['unadjustedVolume'].sort()
        stockData['change'].sort()
        setPrices(stockData)
    }).catch(error => console.log(error))
  }, [activeStock])

  const [chartOptions, setChartOptions] = useState({})
  const options = {
    xAxis: {
      type: 'datetime',
      labels: {
        enabled: true,
        format: '{value:%y-%b-%e}'
      },
      crosshair: true
    },
    yAxis: {
      crosshair: true
    },
    series: [{
      lineWidth: 0.5,
      allowPointSelect: true,
    }],
    tooltip: {
      valueDecimals: 2
    },
    chart: {
      panning: true,
      panKey: 'shift',
      zoomType: 'x',
      events: {
        click: function(event) {
          if (chartRef.current) {
            chartRef.current.chart.xAxis[0].removePlotBand('myPlotBand');
          }
        },
        selection: function(event) {
          if (event.xAxis) {
            const xAxis = event.xAxis[0]
            const xMin = xAxis.min
            const xMax = xAxis.max
            const selectedPoints = this.series[0].points.filter(point => {
              return point.x >= xMin && point.x <= xMax
            })

            if (selectedPoints.length >= 2) {
              const pointOne = selectedPoints[0].y
              const pointTwo = selectedPoints[selectedPoints.length - 1].y
              const delta = (pointTwo - pointOne).toFixed(2)

              const plotbandOptions = {...options, xAxis: {
                ...options.xAxis,
                plotBands: [{
                  id: 'myPlotBand',
                  color: '#b4d3b2',
                  from: selectedPoints[selectedPoints.length - 1].x,
                  to: selectedPoints[0].x,
                  label: {
                    text: `<p style="font-size:10px;">Δ: $${delta} <br> y1: $${selectedPoints[0].y} <br> y2: $${selectedPoints[selectedPoints.length - 1].y}</p>`,
                    useHTML: true,
                    }
                  }]
                }
              }
              setChartOptions(plotbandOptions)
            }
            return false
          }
        }
      }
    },
    plotOptions: {
      series: {
        allowPointSelect: true,
      }
    },
  }

  const onPriceTypeSelect = (eventKey, event) => {
    event.preventDefault();
    event.persist();
    event.stopPropagation();
    console.log(`Selected price type: ${eventKey}`);
    setPriceType(eventKey)
  };

  // update chartOptions after setting activePriceType
  useEffect(() => {
    const newOptions = {...options,
      title: {
        text: activeStock
      },
      series: {
        ...options.series,
        data: prices[activePriceType],
      },
      subtitle: {
        text: `${activePriceType} Prices`
      }
    }
    setChartOptions(newOptions);
  }, [activePriceType]);

  return (
    <div>
    <Dropdown onSelect={onPriceTypeSelect}>
      <Dropdown.Toggle variant="success" id="dropdown-basic">
      {activePriceType ? activePriceType : "Choose Price Type"}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {['open', 'close', 'high', 'low', 'adjustedClose', 'volume', 'unadjustedVolume', 'change'].map((priceType) => (
          <Dropdown.Item key={priceType} eventKey={priceType}>{priceType}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
    
    {!activePriceType ? <></> : 
      <HighchartsReact highcharts={Highcharts} options={chartOptions} constructorType={'stockChart'} ref={chartRef}/>
    }

    </div>
  )
}