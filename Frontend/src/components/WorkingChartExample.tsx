import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, ColorType, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface WorkingChartExampleProps {
  symbol?: string;
}

export const WorkingChartExample: React.FC<WorkingChartExampleProps> = ({
  symbol = 'NVDA'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate sample OHLC data for demonstration
  const generateSampleData = () => {
    const now = Math.floor(Date.now() / 1000);
    const data = [];

    for (let i = 99; i >= 0; i--) {
      const timestamp = (now - (i * 86400)) as UTCTimestamp; // Daily intervals
      const basePrice = 150 + Math.sin(i * 0.1) * 20; // Some price movement

      const open = basePrice + (Math.random() - 0.5) * 5;
      const close = basePrice + (Math.random() - 0.5) * 5;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;

      data.push({
        time: timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
      });
    }

    return data.sort((a, b) => a.time - b.time);
  };

  useEffect(() => {
    const initializeChart = () => {
      try {
        if (!chartContainerRef.current) {
          throw new Error('Chart container not found');
        }

        console.log('🎯 Initializing working chart example');

        // Clean up any existing chart
        if (chartRef.current) {
          chartRef.current.remove();
        }

        // Create chart
        const chart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth || 600,
          height: 400,
          layout: {
            background: { type: ColorType.Solid, color: '#ffffff' },
            textColor: '#333333',
          },
          grid: {
            vertLines: { color: '#e0e0e0' },
            horzLines: { color: '#e0e0e0' },
          },
          rightPriceScale: {
            borderColor: '#cccccc',
          },
          timeScale: {
            borderColor: '#cccccc',
            timeVisible: true,
            secondsVisible: false,
          },
        });

        // Add candlestick series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });

        // Generate and set data
        const sampleData = generateSampleData();
        console.log(`📊 Setting ${sampleData.length} data points`);

        candlestickSeries.setData(sampleData);

        // Fit content and add some padding
        setTimeout(() => {
          chart.timeScale().fitContent();
          console.log('✅ Chart initialized and data loaded');
        }, 100);

        // Store references
        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        setIsLoading(false);

        // Handle resize
        const handleResize = () => {
          if (chart && chartContainerRef.current) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth
            });
          }
        };

        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };

      } catch (err) {
        console.error('❌ Chart initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    const cleanup = initializeChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
      if (cleanup) cleanup();
    };
  }, [symbol]);

  if (error) {
    return (
      <div className="border border-red-300 rounded-lg p-4 bg-red-50">
        <h3 className="text-red-800 font-semibold">Chart Error</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Working Chart Example - {symbol}
        </h3>
        <div className="text-sm text-gray-600">
          {isLoading ? 'Loading...' : 'Ready'}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="w-full border border-gray-200 rounded"
        style={{ height: '400px', minHeight: '400px' }}
      />

      <div className="mt-4 text-xs text-gray-600">
        <p><strong>Debug Info:</strong></p>
        <ul className="mt-1 space-y-1">
          <li>• Chart Container: {chartContainerRef.current ? '✅ Mounted' : '❌ Not mounted'}</li>
          <li>• Chart Instance: {chartRef.current ? '✅ Created' : '❌ Not created'}</li>
          <li>• Series Instance: {seriesRef.current ? '✅ Created' : '❌ Not created'}</li>
          <li>• Container Width: {chartContainerRef.current?.clientWidth || 0}px</li>
          <li>• Data Points: 100 (sample data)</li>
        </ul>
      </div>
    </div>
  );
};