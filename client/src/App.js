import React, { useState, useEffect, useRef } from 'react'

import Dropdown from 'react-bootstrap/Dropdown'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'

export default function App() {
  // Future version: add a dropdown or freeform text input to support other tickers.
  const [activeStock, setActiveStock] = useState('AAPL')
  const [activeQuoteType, setPriceType] = useState(null)
  const [prices, setPrices] = useState({})
  const [chartOptions, setChartOptions] = useState({})

  const chartRef = useRef(null)
  const rectRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [startDrag, setStartDrag] = useState({})
  const [endDrag, setEndDrag] = useState({})
  const [delta, setDelta] = useState(0)

  const handleMouseDown = (event) => {
    const isLeftMouseButton = event.button === 0
    const isDataPoint = event.target.className.baseVal.startsWith("highcharts-point")

    if (!isLeftMouseButton || !isDataPoint) return

    setIsDragging(true)

    const chart = chartRef.current.chart
    // Convert X pixels to X Axis value (milliseconds since epoch)
    const xValue = chart.xAxis[0].toValue(event.clientX)
    // Get data points that are currently visible
    const chartData = chartRef.current.chart.series[0].data
    // Since the X pixels don't give the exact value (close but not exact),
    // find the closest X value from chartData to get the Y value
    chartData.forEach(data => {
      if (Math.abs(xValue - data.x)/data.x < 0.00001) {
        setStartDrag(data)
      }
    })
  }

  const handleMouseMove = (event) => {
    if (isDragging) {
      if (rectRef.current) {
        rectRef.current.destroy()
      }

      const chart = chartRef.current.chart
      const xAxis = chart.xAxis[0]

      // Convert X pixels to X Axis value (milliseconds since epoch)
      const xValue = xAxis.toValue(event.clientX)
      const chartData = chart.series[0].data

      // Determine direction that user is dragging in
      const isRightToLeft = (xValue > startDrag.x)

      // Logic to mimic the default tooltip behavior
      // i.e. the end of the rectangle follows the tooltip behavior
      for (let i = 0; i < chartData.length - 1; i++) {
        const current = chartData[i]

        if (!current) continue

        const next = chartData[i + 1]
        const midpoint = current.x + (Math.abs(current.x - next.x) / 2)

        if (isRightToLeft && (xValue > midpoint && xValue < next.x)) {
          setEndDrag(next)
          setDelta((next.y - startDrag.y).toFixed(2))
          break
        } else if (!isRightToLeft && (xValue < midpoint && xValue > current.x)) {
          setEndDrag(current)
          setDelta((current.y - startDrag.y).toFixed(2))
          break
        } else {
          setEndDrag({x: xAxis.toValue(event.clientX)})
        }
      }

      // Calculate rectangle coordinates dynamically
      const x1 = xAxis.toPixels(Math.min(startDrag.x, endDrag.x))
      const x2 = xAxis.toPixels(Math.max(startDrag.x, endDrag.x))

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
  }

  const handleMouseUp = (event) => {
    if (isDragging) {
      setIsDragging(false)
      setDelta(0)
      setStartDrag({})
      setEndDrag({})

      if (rectRef.current) {
        rectRef.current.destroy()
      }

      const newOptions = {
        ...options,
      }
      setChartOptions(newOptions)
    }
  }

  useEffect(() => {
    fetch(`https://jain-global.onrender.com/api/v1/historical-prices/${activeStock}`).then(
    res => res.json()
    ).then(
    data => {
        const stockData = {
          open: [],
          close: [],
          high: [],
          low: [],
          adjClose: [],
          volume: [],
          unadjustedVolume: [],
          change: []
        }
        // reformat data
        data['historical'].forEach(d => {
          stockData['open'].push([d.date, d.open])
          stockData['close'].push([d.date, d.close])
          stockData['high'].push([d.date, d.high])
          stockData['low'].push([d.date, d.low])
          stockData['adjClose'].push([d.date, d.adjClose])
          stockData['volume'].push([d.date, d.volume])
          stockData['unadjustedVolume'].push([d.date, d.unadjustedVolume])
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
    event.preventDefault()
    setPriceType(eventKey)
  }

  // Update chartOptions after setting activeQuoteType
  useEffect(() => {
    const newOptions = {...options,
      series: {
        ...options.series,
        data: prices[activeQuoteType],
      },
      subtitle: {
        text: `${activeQuoteType} Prices`
      },
    }
    setChartOptions(newOptions)
  }, [activeQuoteType])

  // Update chartOptions after every delta change
  useEffect(() => {
    const newOptions = {...options,
    }
    setChartOptions(newOptions)
  }, [delta])

  return (
    <div>
      <Dropdown onSelect={onPriceTypeSelect}>
        <Dropdown.Toggle variant="success">
        {activeQuoteType ? activeQuoteType : "Choose Price Type"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {['open', 'close', 'high', 'low', 'adjustedClose', 'volume', 'unadjustedVolume', 'change'].map((priceType) => (
            <Dropdown.Item key={priceType} eventKey={priceType}>{priceType}</Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <div onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
      {!activeQuoteType ? <></> :
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