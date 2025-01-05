import { useState, useEffect, useMemo, FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DollarSign, Car, Calendar, Activity, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NavigationHeader from './navigation';

interface FormData {
  name: string;
  year: string;
  miles: string;
}

interface PredictionData {
  name: string;
  year: number;
  miles: number;
  price: number;
}

interface PredictionResponse {
  predicted_price: number;
  success: boolean;
  error?: string;
}

interface CarsResponse {
  cars: string[];
  total: number;
}

const PricePredictionDashboard:FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    year: String(new Date().getFullYear()),
    miles: '0'
  });

  const [availableCars, setAvailableCars] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);

  // Debounced search function
  useEffect(() => {
    const fetchCars = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `http://localhost:5000/cars${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`
        );
        const data: CarsResponse = await response.json();
        setAvailableCars(data.cars);
        setError(null);
      } catch (err) {
        setError('Failed to load car models');
        setAvailableCars([]);
      }
      setIsSearching(false);
    };

    const timeoutId = setTimeout(() => {
      fetchCars();
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          year: parseInt(formData.year),
          miles: parseInt(formData.miles)
        }),
      });

      const data: PredictionResponse = await response.json();
      
      if (data.success) {
        setPrediction(data.predicted_price);
        setPredictions(prev => [...prev, {
          name: formData.name,
          miles: parseInt(formData.miles),
          year: parseInt(formData.year),
          price: data.predicted_price
        }].slice(-5));
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError('Failed to connect to prediction service');
    }

    setLoading(false);
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For numeric values like year and miles, make sure we parse them to integers
    if (name === "year" || name === "miles") {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/[^0-9]/g, '')  // This will remove any non-numeric characters
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
    

  return (
    <NavigationHeader>
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-8">Car Price Prediction Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Predict Car Price</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="carSearch" className="block text-sm font-medium">
                  Search Car Model
                </label>
                <div className="relative">
                  <input
                    id="carSearch"
                    type="text"
                    className="w-full p-2 pr-8 border rounded"
                    placeholder="Start typing to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                
                <select
                  id="name"
                  name="name"
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                >
                  <option value="">Select a car model</option>
                  {availableCars.map(car => (
                    <option key={car} value={car}>{car}</option>
                  ))}
                </select>
                {isSearching && (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
              
              <div>
                <label htmlFor="year" className="block text-sm font-medium mb-1">
                  Year
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  required
                />
              </div>
              
              <div>
                <label htmlFor="miles" className="block text-sm font-medium mb-1">
                  Miles
                </label>
                <input
                  id="miles"
                  name="miles"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.miles}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                disabled={loading}
              >
                {loading ? 'Predicting...' : 'Predict Price'}
              </button>
            </form>

            {error && (
              <Alert className="mt-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
          </CardHeader>
          <CardContent>
            {prediction && (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-green-600">
                  Predicted Price: ${prediction.toLocaleString()}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Car className="mx-auto mb-2" />
                    <div className="text-sm font-medium">{formData.name}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Calendar className="mx-auto mb-2" />
                    <div className="text-sm font-medium">{formData.year}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <Activity className="mx-auto mb-2" />
                    <div className="text-sm font-medium">{parseInt(formData.miles).toLocaleString()} miles</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Chart */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px]">
              <LineChart
                width={800}
                height={300}
                data={predictions}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#8884d8" name="Predicted Price" />
              </LineChart>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </NavigationHeader>
  );
};

export default PricePredictionDashboard;