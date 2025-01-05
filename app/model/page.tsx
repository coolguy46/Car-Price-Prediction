"use client"

import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NavigationHeader from '@/components/navigation';

interface ModelStats {
  metrics: {
    mse: number;
    rmse: number;
    mae: number;
    r2: number;
  };
  price_distribution: {
    labels: string[];
    values: number[];
  };
  error_distribution: {
    mean_error: number;
    std_error: number;
    error_percentiles: {
      '25th': number;
      '50th': number;
      '75th': number;
    };
  };
  accuracy_by_range: Record<string, number>;
  year_performance: Record<string, number>;
  sample_size: number;
  timestamp: string;
}

interface ScatterData {
  actual: number[];
  predicted: number[];
  years: number[];
  miles: number[];
}

const ModelAnalyticsDashboard = () => {
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [scatterData, setScatterData] = useState<ScatterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, scatterResponse] = await Promise.all([
          fetch('http://localhost:5000/model-stats'),
          fetch('http://localhost:5000/prediction-scatter')
        ]);

        const statsData = await statsResponse.json();
        const scatterData = await scatterResponse.json();

        setStats(statsData);
        setScatterData(scatterData);
        setError(null);
      } catch (err) {
        setError('Failed to load model analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading model analytics...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats || !scatterData) {
    return <div className="p-6">No data available</div>;
  }

  // Prepare data for charts
  const scatterPoints = scatterData.actual.map((val, idx) => ({
    actual: val,
    predicted: scatterData.predicted[idx],
  }));

  const yearPerformanceData = Object.entries(stats.year_performance).map(([year, rmse]) => ({
    year: parseInt(year),
    rmse,
  }));

  const priceDistData = stats.price_distribution.labels.map((label, idx) => ({
    range: label,
    count: stats.price_distribution.values[idx],
  }));

  const accuracyData = Object.entries(stats.accuracy_by_range).map(([range, accuracy]) => ({
    range,
    accuracy: accuracy * 100,
  }));

  return (
    <NavigationHeader>
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Model Performance Analytics</h1>
      
      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>R² Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.metrics.r2.toFixed(4)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RMSE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.metrics.rmse.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>MAE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.metrics.mae.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sample Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sample_size.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

     {/* Actual vs Predicted Scatter Plot */}
<Card>
  <CardHeader>
    <CardTitle>Actual vs Predicted Prices</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid />
          <XAxis 
            dataKey="actual" 
            name="Actual Price" 
            unit="$"
            type="number"
            domain={[0, 100000]} // Set X-axis domain
          />
          <YAxis
            dataKey="predicted" 
            name="Predicted Price" 
            unit="$"
            type="number"
            domain={[0, 100000]} // Set Y-axis domain
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Prices" data={scatterPoints} fill="#8884d8" />

          {/* Add y = x line */}
          <Line
            type="linear"
            dataKey="value"
            stroke="#ff7300"
            strokeWidth={2}
            dot={false}
            activeDot={false}
            data={[
              { actual: 0, predicted: 0 },
              { actual: 100000, predicted: 100000 },
            ]}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>

      
      {/* Price Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Price Range Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceDistData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Number of Cars" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Accuracy by Price Range */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Accuracy by Price Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
    </NavigationHeader>
  );
};

export default ModelAnalyticsDashboard;