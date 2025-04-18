import React, { useState, useEffect } from 'react';
import { ArrowRight, Truck, Clock, Info, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const PortVisualization = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Visualization state
  const [selectedResult, setSelectedResult] = useState(null);
  const [hour, setHour] = useState(8);
  const [playing, setPlaying] = useState(false);
  const [showCongestion, setShowCongestion] = useState(false);

  // Default route colors
  const routeColors = {
    "Vincent Thomas Bridge": "#3498db",
    "Gerald Desmond Bridge": "#e74c3c",
    "Long Beach Gateway": "#2ecc71",
    "Railroad": "#9b59b6"
  };

  // Load test results
  useEffect(() => {
    // In a real app, this would load the json file using fetch
    // For demonstration, we'll simulate loading from a file
    // This should be replaced with actual fetch call in production

    const loadTestResults = async () => {
      try {
        setLoading(true);

        // In a real app with the JSON file:
        const response = await fetch('/results/test_results.json');
        const data = await response.json();

        // For demonstration, we'll use a placeholder
        // This should be replaced with the actual data from test_results.json
        // const data = [
        //   {
        //     "rtg_rate": 16000,
        //     "bridge_closure_hour": 12,
        //     "hourly_metrics": {}
        //   }
        // ];

        // Add all hours if missing
        data.forEach(result => {
          for (let i = 0; i < 24; i++) {
            if (!result.hourly_metrics[i]) {
              // For the demo, create mock data
              // In a real application, this would come from the JSON file
              result.hourly_metrics[i] = {
                queue_size: Math.random() * 500 + 100,
                total_processed: Math.random() * 400 + 300,
                bridge_closed: i >= result.bridge_closure_hour,
                route_data: {}
              };

              // Add route data
              const routes = ["Vincent Thomas Bridge", "Gerald Desmond Bridge", "Long Beach Gateway", "Railroad"];
              routes.forEach(route => {
                // Skip Vincent Thomas Bridge if closed
                if (route === "Vincent Thomas Bridge" && i >= result.bridge_closure_hour) {
                  return;
                }

                result.hourly_metrics[i].route_data[route] = {
                  usage: Math.random() * 60 + 40, // 40-100%
                  processed: Math.random() * 150 + 100,
                  congestion: Math.random() * 0.4 + 0.1, // 10-50%
                  action: Math.floor(Math.random() * 11), // 0-10
                  policy: Array(11).fill(0).map(() => Math.random()) // Random policy probs
                };
              });
            }
          }
        });

        setTestResults(data);
        setSelectedResult(data[0]);
        setLoading(false);
      } catch (err) {
        console.error("Error loading test results:", err);
        setError("Failed to load test results. Please check the console for details.");
        setLoading(false);
      }
    };

    loadTestResults();
  }, []);

  // Animation effect
  useEffect(() => {
    let timer;
    if (playing) {
      timer = setInterval(() => {
        setHour(prevHour => (prevHour + 1) % 24);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [playing]);

  // Handle hour changes manually
  const handleHourChange = (e) => {
    setHour(parseInt(e.target.value, 10));
    setPlaying(false);
  };

  // Time period label
  const getTimePeriodLabel = (hour) => {
    if (hour >= 6 && hour < 10) return "Morning Rush";
    if (hour >= 10 && hour < 15) return "Midday";
    if (hour >= 15 && hour < 19) return "Evening Rush";
    return "Night";
  };

  // Get time factor (for display purposes)
  const getTimeFactor = (hour) => {
    if (hour >= 6 && hour < 10) return 2.0; // Morning rush
    if (hour >= 10 && hour < 15) return 1.0; // Midday
    if (hour >= 15 && hour < 19) return 2.5; // Evening rush
    return 0.75; // Night
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading simulation data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!selectedResult) return <div>No simulation data available</div>;

  // Get current hour's data
  const currentHourData = selectedResult.hourly_metrics[hour] || {
    queue_size: 0,
    total_processed: 0,
    bridge_closed: hour >= selectedResult.bridge_closure_hour,
    route_data: {}
  };

  // Get active routes for current hour
  const activeRoutes = Object.keys(currentHourData.route_data || {}).filter(route => {
    // Filter out Vincent Thomas Bridge if closed
    if (route === "Vincent Thomas Bridge" && currentHourData.bridge_closed) {
      return false;
    }
    return true;
  });

  // Get time factor for visualization
  const timeFactor = getTimeFactor(hour);

  return (
    <div className="flex flex-col space-y-6 p-4 bg-gray-50 rounded-lg">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Port Traffic RL Model Visualization</h1>
        <div className="text-sm text-gray-500 mb-4">
          Based on Reinforcement Learning Model Results
        </div>

        {/* Parameter Selection */}
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">RTG Rate:</span>
            <select
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md"
              value={selectedResult.rtg_rate}
              onChange={(e) => {
                const newRtgRate = parseInt(e.target.value);
                const newResult = testResults.find(r =>
                  r.rtg_rate === newRtgRate &&
                  r.bridge_closure_hour === selectedResult.bridge_closure_hour
                ) || testResults[0];
                setSelectedResult(newResult);
              }}
            >
              {Array.from(new Set(testResults?.map(r => r.rtg_rate) || [])).sort().map(rate => (
                <option key={rate} value={rate}>{rate} containers/day</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Bridge Closure:</span>
            <select
              className="px-2 py-1 bg-red-100 text-red-800 rounded-md"
              value={selectedResult.bridge_closure_hour}
              onChange={(e) => {
                const newClosureHour = parseInt(e.target.value);
                const newResult = testResults.find(r =>
                  r.rtg_rate === selectedResult.rtg_rate &&
                  r.bridge_closure_hour === newClosureHour
                ) || testResults[0];
                setSelectedResult(newResult);
              }}
            >
              {Array.from(new Set(testResults?.map(r => r.bridge_closure_hour) || [])).sort().map(hour => (
                <option key={hour} value={hour}>{hour}:00</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Controls */}
        <div className="flex items-center justify-center mb-2">
          <button
            onClick={() => setPlaying(!playing)}
            className={`px-3 py-1 mr-3 rounded-md ${playing ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <Clock className="mr-2" size={20} />
          <input
            type="range"
            min="0"
            max="23"
            value={hour}
            onChange={handleHourChange}
            className="mx-2 w-40"
          />
          <span className="text-lg font-medium">{hour}:00</span>
          <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
            {getTimePeriodLabel(hour)}
          </span>
          <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
            Time Factor: {timeFactor.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* Status Dashboard */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">System Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center p-3 bg-blue-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Vincent Thomas Bridge</div>
            <div className="text-xl font-bold text-blue-700">
              {currentHourData.bridge_closed ? "CLOSED" : "OPEN"}
            </div>
            {currentHourData.bridge_closed && (
              <div className="text-xs text-gray-500 mt-1">
                Traffic redirected to other routes
              </div>
            )}
          </div>
          <div className="flex flex-col items-center p-3 bg-green-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Throughput</div>
            <div className="text-xl font-bold text-green-700">
              {Math.round(currentHourData.total_processed)}
            </div>
            <div className="text-xs text-gray-500">containers/hour</div>
          </div>
          <div className="flex flex-col items-center p-3 bg-orange-50 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Queue Size</div>
            <div className="text-xl font-bold text-orange-700">
              {Math.round(currentHourData.queue_size)}
            </div>
            <div className="text-xs text-gray-500">containers waiting</div>
          </div>
        </div>
      </div>

      {/* Routes Display */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <div className="flex justify-between items-center mb-3 border-b pb-2">
          <h2 className="text-xl font-semibold">Route Status</h2>
          <button
            className="px-3 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
            onClick={() => setShowCongestion(!showCongestion)}
          >
            {showCongestion ? "Show Capacity" : "Show Congestion"}
          </button>
        </div>

        <div className="space-y-6">
          {activeRoutes.length > 0 ? (
            activeRoutes.map(route => {
              const routeData = currentHourData.route_data[route] || {
                usage: 0,
                processed: 0,
                congestion: 0
              };

              // Calculate base capacity (approximate from processed/usage)
              const baseCapacity = routeData.usage > 0
                ? Math.round(routeData.processed / (routeData.usage / 100))
                : 0;

              return (
                <div key={route} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-3 flex justify-between items-center">
                    <div className="font-medium text-lg">{route}</div>
                    <div className="flex items-center space-x-2 text-sm">
                      {route === "Vincent Thomas Bridge" && hour >= selectedResult.bridge_closure_hour - 1 && (
                        <div className="px-2 py-1 rounded bg-red-100 text-red-800">
                          {hour >= selectedResult.bridge_closure_hour ? "CLOSED" : "Closing Next Hour"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Route Visualization */}
                    <div className="relative h-16 mb-6">
                      {/* Main Road */}
                      <div className="absolute inset-0 bg-gray-200 rounded-md">
                        {/* Traffic Flow */}
                        <div
                          className="absolute top-0 bottom-0 left-0 rounded-md flex items-center justify-end transition-all duration-500"
                          style={{
                            width: `${routeData.usage}%`,
                            backgroundColor: routeColors[route],
                            maxWidth: '100%'
                          }}
                        >
                          <div className="absolute right-0 flex items-center">
                            <Truck color="white" size={24} />
                            <ArrowRight color="white" size={16} />
                          </div>
                        </div>

                        {/* Congestion Overlay */}
                        {showCongestion && (
                          <div
                            className="absolute top-0 bottom-0 left-0 bg-red-500 bg-opacity-40 rounded-md transition-all duration-500"
                            style={{ width: `${routeData.congestion * 100}%` }}
                          >
                            <div className="h-full flex items-center justify-center text-white font-bold">
                              {Math.round(routeData.congestion * 100)}% congestion
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Route Metrics */}
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">Containers Processed</div>
                        <div className="font-semibold">{Math.round(routeData.processed)} containers</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">Congestion</div>
                        <div className="font-semibold">{(routeData.congestion * 100).toFixed(0)}%</div>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-gray-500">Usage</div>
                        <div className="font-semibold">{routeData.usage.toFixed(0)}%</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-gray-500">RL Allocation</div>
                        <div className="font-semibold">{Math.min(10, Math.round(routeData.usage / 10))} / 10</div>
                      </div>
                    </div>
                  </div>

                  {/* Trends */}
                  <div className="flex border-t">
                    <div className="flex-1 p-2 flex items-center justify-center">
                      <div className={`flex items-center ${routeData.congestion > 0.5 ? 'text-red-500' : 'text-gray-500'}`}>
                        {routeData.congestion > 0.5 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span className="ml-1 text-sm">Congestion</span>
                      </div>
                    </div>
                    <div className="border-l"></div>
                    <div className="flex-1 p-2 flex items-center justify-center">
                      <div className={`flex items-center ${routeData.usage > 80 ? 'text-green-500' : 'text-gray-500'}`}>
                        {routeData.usage > 80 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span className="ml-1 text-sm">Utilization</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-4 text-gray-500">No active routes for this hour</div>
          )}
        </div>
      </div>

      {/* RL Agent Analysis */}
      <div className="bg-white p-4 rounded-md shadow-md">
        <h2 className="text-xl font-semibold mb-3 border-b pb-2">
          <div className="flex items-center">
            <BarChart3 className="mr-2" size={20} />
            RL Agent Behavior Analysis
          </div>
        </h2>

        <div className="mt-4 bg-yellow-50 p-3 rounded-md text-sm">
          <div className="font-medium mb-1">Agent Strategy:</div>
          <p>
            {hour === selectedResult.bridge_closure_hour
              ? "Bridge closure detected. Agent is redistributing traffic to remaining routes while minimizing congestion."
              : hour > selectedResult.bridge_closure_hour
              ? "Post-closure optimization: Agent is balancing load across remaining routes with preference for higher capacity Railroad route."
              : hour >= selectedResult.bridge_closure_hour - 2 && hour < selectedResult.bridge_closure_hour
              ? "Agent detects upcoming bridge closure and is gradually preparing alternate routes."
              : getTimePeriodLabel(hour) === "Evening Rush"
              ? "During evening rush, agent allocates more traffic to high-capacity routes to prevent queue build-up."
              : getTimePeriodLabel(hour) === "Morning Rush"
              ? "During morning rush, agent distributes traffic to maintain balanced congestion levels across all routes."
              : "During normal hours, agent optimizes for throughput while maintaining low congestion levels."}
          </p>
        </div>

        {/* Display RL Policy Distributions */}
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">RL Policy Distributions</h3>
          <div className="space-y-3">
            {activeRoutes.map(route => {
              const routeData = currentHourData.route_data[route] || {};
              const policyDistribution = routeData.policy || Array(11).fill(0.09);
              const action = routeData.action || 5;

              return (
                <div key={`policy-${route}`} className="text-sm">
                  <div className="flex items-center mb-1">
                    <div className="w-48">{route}</div>
                    <div className="text-xs text-gray-500">Action: {action}/10</div>
                  </div>
                  <div className="flex h-6 w-full rounded-md overflow-hidden">
                    {policyDistribution.map((prob, idx) => (
                      <div
                        key={idx}
                        className={`${idx === action ? 'bg-blue-500' : 'bg-gray-300'} 
                                   flex items-center justify-center text-xs text-white`}
                        style={{
                          width: `${Math.max(prob * 100, 3)}%`,
                          opacity: idx === action ? 1 : 0.3 + prob
                        }}
                      >
                        {idx}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="border rounded-md p-3">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Congestion Management</h3>
            <div className="flex items-end">
              <div className="text-2xl font-bold">
                {Math.round(Object.values(currentHourData.route_data).reduce((sum, route) => sum + route.congestion, 0) /
                  Math.max(1, Object.keys(currentHourData.route_data).length) * 100)}%
              </div>
              <div className="ml-2 text-sm text-gray-500">avg congestion</div>
            </div>
            <div className="mt-2 text-xs">
              {currentHourData.bridge_closed
                ? "Post-closure congestion level"
                : "Normal operation congestion"}
            </div>
          </div>

          <div className="border rounded-md p-3">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Route Utilization</h3>
            <div className="flex items-end">
              <div className="text-2xl font-bold">
                {Math.round(Object.values(currentHourData.route_data).reduce((sum, route) => sum + route.usage, 0) /
                  Math.max(1, Object.keys(currentHourData.route_data).length))}%
              </div>
              <div className="ml-2 text-sm text-gray-500">avg utilization</div>
            </div>
            <div className="mt-2 text-xs">
              {Object.values(currentHourData.route_data).some(route => route.usage > 90)
                ? "Some routes near capacity"
                : "Routes operating within capacity"}
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Info */}
      <div className="text-xs text-center text-gray-500 mt-4">
        Visualization of RL model test results. RTG Rate: {selectedResult.rtg_rate} containers/day,
        Bridge Closure: {selectedResult.bridge_closure_hour}:00
      </div>
    </div>
  );
};

export default PortVisualization;