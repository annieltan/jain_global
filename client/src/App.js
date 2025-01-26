import Dropdown from 'react-bootstrap/Dropdown';
import React, { useState, useEffect, useRef } from 'react'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official';


export default function App() {
  // in future version, we could add a dropdown
  // to choose other stocks with setActiveStock
  const [activeStock, setActiveStock] = useState('AAPL')
  const [activePriceType, setPriceType] = useState(null)
  const [prices, setPrices] = useState({})

  const [chartOptions, setChartOptions] = useState({})

  const chartRef = useRef(null)
  const rectRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [start, setStart] = useState({})
  const [end, setEnd] = useState({})
  const [delta, setDelta] = useState(0)

  const handleMouseDown = (event) => {
    // Only handle left mouse button
    if (event.button !== 0) return;

    // Ignore mousedown events outside of data points
    if (!event.target.className.baseVal.startsWith("highcharts-point")) {
      return
    }

    setIsDragging(true)

    const chart = chartRef.current.chart
    // convert X pixels to X Axis value (milliseconds since epoch)
    const xValue = chart.xAxis[0].toValue(event.clientX)
    // get data points that are currently visible
    const chartData = chartRef.current.chart.series[0].data
    // since the X pixels don't give the exact value (close but not exact),
    // I'm going to find the closest X value from chartData to get the Y value
    chartData.forEach(data => {
      if (Math.abs(xValue - data.x)/data.x < 0.00001) {
        setStart(data)
      }
    })
  }

  const handleMouseMove = (event) => {
    if (isDragging) {
      if (rectRef.current) {
        rectRef.current.destroy();
      }

      const chart = chartRef.current.chart
      const xAxis = chart.xAxis[0]

      // convert X pixels to X Axis value (milliseconds since epoch)
      const xValue = xAxis.toValue(event.clientX)
      const chartData = chart.series[0].data

      // determine direction that user is dragging in
      const rightToLeft = (xValue > start.x)

      // logic to mimick the default tooltip behavior
      // i.e. the end of the rectangle follows the tooltip
      for (let i = 0; i < chartData.length - 1; i++) {
        const current = chartData[i]

        if (!current) continue;
        // if (i + 1 >= chartData.length) break;

        const next = chartData[i + 1]
        const midpoint = current.x + (Math.abs(current.x - next.x) / 2)

        if (rightToLeft && (xValue > midpoint && xValue < next.x)) {
          setEnd(next)
          setDelta((next.y - start.y).toFixed(2))
          console.log('past midpoint', next)
          break
        } else if (!rightToLeft && (xValue < midpoint && xValue > current.x)) {
          setEnd(current)
          setDelta((current.y - start.y).toFixed(2))
          console.log('past midpoint left to right', current)
          break
        } else {
          setEnd({x: xAxis.toValue(event.clientX)})
        }
      }

      // Calculate rectangle coordinates dynamically
      const x1 = xAxis.toPixels(Math.min(start.x, end.x))
      const x2 = xAxis.toPixels(Math.max(start.x, end.x))

      rectRef.current = chart.renderer
        .path([
          'M', x1, chart.plotTop,
          'L', x2, chart.plotTop,
          'L', x2, chart.plotTop + chart.plotHeight,
          'L', x1, chart.plotTop + chart.plotHeight,
          'Z'
        ])
        .attr({
          fill: '#FFF4F2',
        })
        .add()
    }
  };

  const handleMouseUp = (event) => {
    if (isDragging) {
      setIsDragging(false);
      setDelta(0)
      setStart({})
      setEnd({})

      if (rectRef.current) {
        rectRef.current.destroy();
      }

      const newOptions = {
        ...options,
      }
      setChartOptions(newOptions)
    }
  }

  console.log('rendering')

  useEffect(() => {
    fetch(`https://jain-global.onrender.com/api/v1/historical-prices/${activeStock}`).then(
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

  const options = {
    title: {
      text: activeStock
    },
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
    chart: {
      panning: false,
    },
    series: [{
      lineWidth: 0.5,
      allowPointSelect: true,
      color: '#E18AAA'
    }],
    tooltip: {
      backgroundColor: {
        linearGradient: [0, 0, 0, 50],
        stops: [
            [0, '#FFFFFF'],
            [1, '#FFF4F2']
        ]
      },
      valueDecimals: 2,
      borderColor: '#FFF4F2',
      formatter: function () {
        return `<b>y:</b> ${this.y}<br>${delta ? `<b>delta:</b> ${delta}` : ''}`
      }
    },
    plotOptions: {
      series: {
        allowPointSelect: true,
      },
    },
  }

  const onPriceTypeSelect = (eventKey, event) => {
    event.preventDefault();
    console.log(`Selected price type: ${eventKey}`);
    setPriceType(eventKey)
  };

  // update chartOptions after setting activePriceType
  useEffect(() => {
    const newOptions = {...options,
      series: {
        ...options.series,
        data: prices[activePriceType],
      },
      subtitle: {
        text: `${activePriceType} Prices`
      },
    }
    setChartOptions(newOptions);
  }, [activePriceType]);

  // update chartOptions after every delta change
  useEffect(() => {
    const newOptions = {...options,
    }
    setChartOptions(newOptions);
  }, [delta]);

  return (
    <div>
      <Dropdown onSelect={onPriceTypeSelect}>
        <Dropdown.Toggle variant="success">
        {activePriceType ? activePriceType : "Choose Price Type"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {['open', 'close', 'high', 'low', 'adjustedClose', 'volume', 'unadjustedVolume', 'change'].map((priceType) => (
            <Dropdown.Item key={priceType} eventKey={priceType}>{priceType}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <div onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {!activePriceType ? <></> :
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          constructorType={'stockChart'}
          ref={chartRef}
        />
      }
      </div>
    </div>
  )
}